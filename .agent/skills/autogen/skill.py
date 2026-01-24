import os
import sys
from typing import Dict, List, Optional, Union

import autogen


def get_llm_config() -> Dict:
    """
    Constructs the LLM configuration for AutoGen.
    Prioritizes Gemini (Antigravity standard) then OpenAI.
    """
    config_list = []

    # Check for Gemini (Google GenAI)
    if os.getenv("GEMINI_API_KEY"):
        config_list.append({
            "model": "gemini-1.5-flash",
            "api_type": "google",
            "api_key": os.getenv("GEMINI_API_KEY")
        })

    # Check for OpenAI
    if os.getenv("OPENAI_API_KEY"):
        config_list.append({
            "model": "gpt-4o-mini",
            "api_key": os.getenv("OPENAI_API_KEY")
        })

    if not config_list:
        print("Warning: No API keys found for AutoGen. Please set GEMINI_API_KEY or OPENAI_API_KEY.")
        # Fallback to empty list which might cause runtime error if used

    return {
        "config_list": config_list,
        "temperature": 0.7,
    }

def create_group_chat(user_proxy: autogen.UserProxyAgent, assistants: List[autogen.AssistantAgent]) -> autogen.GroupChatManager:
    """Creates a group chat and manager."""
    groupchat = autogen.GroupChat(
        agents=[user_proxy] + assistants,
        messages=[],
        max_round=10
    )
    manager = autogen.GroupChatManager(groupchat=groupchat, llm_config=assistants[0].llm_config)
    return manager

def run_autogen_task(task: str, verbose: bool = False) -> str:
    """
    Runs a basic AutoGen task with a UserProxy and an Assistant.
    """
    llm_config = get_llm_config()

    if not llm_config["config_list"]:
         return "Error: No valid LLM configuration found."

    # Create an Assistant Agent
    assistant = autogen.AssistantAgent(
        name="assistant",
        llm_config=llm_config,
        system_message="You are a helpful AI assistant. Solve the user's task concisely."
    )

    # Create a User Proxy Agent
    user_proxy = autogen.UserProxyAgent(
        name="user_proxy",
        human_input_mode="NEVER",
        max_consecutive_auto_reply=1,
        is_termination_msg=lambda x: x.get("content", "").rstrip().endswith("TERMINATE"),
        code_execution_config={
            "work_dir": "coding",
            "use_docker": False,  # Default to False for skill execution environment
        },
    )

    # Start the conversation
    try:
        # We initiate chat.
        # Note: In a real 'skill' function we might want to capture output differently,
        # but AutoGen prints to stdout by default.
        # We can use the result object to get the chat history.
        chat_result = user_proxy.initiate_chat(
            assistant,
            message=task,
            summary_method="reflection_with_llm"
        )

        # Return the summary or last message
        if hasattr(chat_result, 'summary'):
            return chat_result.summary
        elif hasattr(chat_result, 'chat_history'):
             return chat_result.chat_history[-1]['content']
        else:
             return "Task completed (check logs for details)."

    except Exception as e:
        return f"Error running AutoGen task: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) > 1:
        task_input = sys.argv[1]
    else:
        task_input = "Write a python script to print 'Hello from AutoGen' and save it to hello.py"

    print(f"Running AutoGen task: {task_input}")
    result = run_autogen_task(task_input)
    print(f"Result: {result}")
