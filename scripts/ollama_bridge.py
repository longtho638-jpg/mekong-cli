#!/usr/bin/env python3
"""
🦙 Ollama Bridge Proxy — Python v1.1 (STREAMING)
Port: 8082

Converts Anthropic Messages API → Ollama (OpenAI Compatible) API.
Supports SSE Streaming for Claude Code CLI.
"""

import os
import json
import uuid
import requests
from flask import Flask, request, Response, jsonify, stream_with_context

app = Flask(__name__)
app.url_map.strict_slashes = False

# --- CONFIG ---
PORT = 8082
OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://127.0.0.1:11434/v1/chat/completions")

def anthropic_to_openai(data):
    messages = []
    system_prompt = data.get("system", "")
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})

    for msg in data.get("messages", []):
        role = msg.get("role")
        content = msg.get("content")

        if isinstance(content, list):
            new_content = []
            for part in content:
                if part.get("type") == "text":
                    new_content.append(part.get("text", ""))
                elif part.get("type") == "tool_use":
                    # Tool use handling simplified for now
                    messages.append({
                        "role": "assistant",
                        "tool_calls": [{
                            "id": part.get("id"),
                            "type": "function",
                            "function": {
                                "name": part.get("name"),
                                "arguments": json.dumps(part.get("input")),
                            },
                        }]
                    })
                    continue
                elif part.get("type") == "tool_result":
                    messages.append({
                        "role": "tool",
                        "tool_call_id": part.get("tool_use_id"),
                        "content": str(part.get("content", "")),
                    })
                    continue
            if new_content:
                messages.append({"role": role, "content": "\n".join(new_content)})
            continue

        messages.append({"role": role, "content": content})

    target_model = data.get("model", "qwen2.5-coder:latest")

    payload = {
        "model": target_model,
        "messages": messages,
        "stream": data.get("stream", False),
        "max_tokens": data.get("max_tokens", 4096),
        "temperature": data.get("temperature", 0.7),
    }

    if "tools" in data:
        openai_tools = []
        for tool in data["tools"]:
            openai_tools.append({
                "type": "function",
                "function": {
                    "name": tool["name"],
                    "description": tool.get("description", ""),
                    "parameters": tool.get("input_schema", {}),
                },
            })
        payload["tools"] = openai_tools

    return payload

def generate_sse(openai_response_iter, model):
    """
    Generator that yields Anthropic SSE events from OpenAI chunk stream
    """
    msg_id = f"msg_{uuid.uuid4().hex}"
    
    # event: message_start
    yield f"event: message_start\ndata: {json.dumps({'type': 'message_start', 'message': {'id': msg_id, 'type': 'message', 'role': 'assistant', 'content': [], 'model': model, 'stop_reason': None, 'stop_sequence': None, 'usage': {'input_tokens': 0, 'output_tokens': 0}}})}\n\n"
    
    # event: content_block_start
    yield f"event: content_block_start\ndata: {json.dumps({'type': 'content_block_start', 'index': 0, 'content_block': {'type': 'text', 'text': ''}})}\n\n"

    for line in openai_response_iter.iter_lines():
        if not line:
            continue
        
        decoded_line = line.decode('utf-8')
        if not decoded_line.startswith('data: '):
            continue
            
        json_str = decoded_line[6:]
        if json_str.strip() == '[DONE]':
            break
            
        try:
            chunk = json.loads(json_str)
            if not chunk.get('choices'):
                continue
                
            delta = chunk['choices'][0].get('delta', {})
            content = delta.get('content')
            
            if content:
                # event: content_block_delta
                yield f"event: content_block_delta\ndata: {json.dumps({'type': 'content_block_delta', 'index': 0, 'delta': {'type': 'text_delta', 'text': content}})}\n\n"
                
        except json.JSONDecodeError:
            continue

    # event: content_block_stop
    yield f"event: content_block_stop\ndata: {json.dumps({'type': 'content_block_stop', 'index': 0})}\n\n"

    # event: message_delta
    yield f"event: message_delta\ndata: {json.dumps({'type': 'message_delta', 'delta': {'stop_reason': 'end_turn', 'stop_sequence': None}, 'usage': {'output_tokens': 0}})}\n\n"

    # event: message_stop
    yield f"event: message_stop\ndata: {json.dumps({'type': 'message_stop'})}\n\n"

@app.before_request
def log_request_info():
    print(f"[{request.method}] {request.path} | Query: {request.query_string.decode()} | Headers: {dict(request.headers)}", flush=True)

# Explicitly route both strict paths as fallback
@app.route("/", defaults={"path": ""}, methods=["GET", "POST", "PUT", "DELETE"])
@app.route("/<path:path>", methods=["GET", "POST", "PUT", "DELETE"])
def catch_all(path):
    # Check if this is the messages endpoint
    # Note: path here does not include leading slash usually
    print(f"🦙 CATCH-ALL: path={path!r}", flush=True)
    
    if path == "v1/messages" or path == "v1/messages/":
        if request.method == "POST":
            return messages()
        else:
            return jsonify({"error": "Method Not Allowed"}), 405
            
    return jsonify({"error": "Not Found", "path": path}), 404

# Keep the original function but remove route decorators to avoid conflict or just call it directly
def messages():
    try:
        print(f"🦙 MESSAGES HANDLER INVOKED", flush=True)
        data = request.json
        print(f"🦙 PAYLOAD RECEIVED: {json.dumps(data)}", flush=True)
        oa_payload = anthropic_to_openai(data)

        # Removed redundant TRY block start here
        headers = {"Content-Type": "application/json"}
        if os.environ.get("OLLAMA_API_KEY"):
            headers["Authorization"] = f"Bearer {os.environ.get('OLLAMA_API_KEY')}"

        print(f"🦙 Requesting {oa_payload['model']} (stream={oa_payload['stream']})")

        response = requests.post(
            OLLAMA_BASE_URL, 
            headers=headers, 
            json=oa_payload, 
            stream=oa_payload['stream'],
            timeout=120
        )

        if response.status_code != 200:
            print(f"❌ Ollama Error: {response.text}")
            return jsonify({"error": "Ollama error", "details": response.text}), response.status_code

        if oa_payload['stream']:
            return Response(
                stream_with_context(generate_sse(response, data.get("model"))),
                content_type='text/event-stream'
            )
        else:
            return jsonify({"error": "Non-streaming not implemented"}), 501

    except Exception as e:
        print(f"❌ Bridge Error: {e}")
        return jsonify({"error": "Bridge error", "details": str(e)}), 500

@app.route("/health")
def health():
    return jsonify({"status": "ok", "service": "🦙 Ollama Bridge (Streaming)", "port": PORT})

if __name__ == "__main__":
    print(f"🦙 Ollama Bridge (Streaming) starting on port {PORT}...")
    app.run(port=PORT, host="0.0.0.0", threaded=True)
