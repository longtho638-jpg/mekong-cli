import pytest
from fastapi.testclient import TestClient
from fastapi.websockets import WebSocket
from backend.websocket_server import app

# Note: Testing WebSockets with TestClient requires 'httpx' and 'pytest-asyncio'
# This is a basic connectivity test structure.

@pytest.mark.asyncio
async def test_websocket_connection():
    client = TestClient(app)
    with client.websocket_connect("/ws/room1?user_id=user1&username=Alice") as websocket:
        data = websocket.receive_json()
        assert data["type"] == "init"
        assert data["revision"] == 0
        assert "presence" in data

@pytest.mark.asyncio
async def test_presence_broadcast():
    client = TestClient(app)
    # User 1 connects
    with client.websocket_connect("/ws/room1?user_id=user1&username=Alice") as ws1:
        # Consume init
        ws1.receive_json()

        # User 2 connects
        with client.websocket_connect("/ws/room1?user_id=user2&username=Bob") as ws2:
            # User 2 gets init
            init_data = ws2.receive_json()
            assert len(init_data["presence"]) == 2

            # User 1 should receive presence update for Bob
            msg = ws1.receive_json()
            assert msg["type"] == "presence_update"
            assert msg["data"]["user_id"] == "user2"

@pytest.mark.asyncio
async def test_operation_sync():
    client = TestClient(app)
    with client.websocket_connect("/ws/room2?user_id=u1") as ws1:
        ws1.receive_json() # init

        with client.websocket_connect("/ws/room2?user_id=u2") as ws2:
            ws2.receive_json() # init
            ws2.receive_json() # presence u1 joining (actually u2 joining seen by u1, u2 sees presence in init)
            # Wait, ws1 sees u2 join. ws2 sees snapshot.
            # We need to clear ws1 buffer if needed.
            # But here we focus on operation.

            # u1 sends op
            op_payload = {
                "type": "operation",
                "revision": 0,
                "operation": {
                    "type": "insert",
                    "position": 0,
                    "value": "Hello",
                    "length": 5
                }
            }
            ws1.send_json(op_payload)

            # u1 receives ACK (broadcast)
            ack1 = ws1.receive_json()
            if ack1["type"] == "presence_update": # might be the join event if delayed
                ack1 = ws1.receive_json()

            assert ack1["type"] == "operation"
            assert ack1["user_id"] == "u1"
            assert ack1["revision"] == 1

            # u2 receives op
            msg2 = ws2.receive_json()
            # ws2 might see presence update first depending on timing if we didn't consume it
            # In TestClient it's synchronous-ish.
            # ws1 received presence update when u2 joined?
            # yes, earlier we didn't read it from ws1 in this block.
            # Let's assume order:
            # 1. ws1 connected
            # 2. ws2 connected -> ws1 gets presence
            # 3. ws1 sends op -> ws1 gets op, ws2 gets op

            # So likely ws1 has [presence_u2, op_u1]
            # ws2 has [op_u1] (since it joined after u1, u1 was in its init presence)

            assert msg2["type"] == "operation"
            assert msg2["operation"]["value"] == "Hello"
