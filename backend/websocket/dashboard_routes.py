import asyncio
import json
import logging
from typing import Dict, Set

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect

from backend.services.dashboard_service import DashboardService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws/dashboard", tags=["websocket"])

class DashboardConnectionManager:
    def __init__(self):
        # Map metric_name -> Set[WebSocket]
        self.subscriptions: Dict[str, Set[WebSocket]] = {}
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        # Remove from all subscriptions
        for metric in list(self.subscriptions.keys()):
            if websocket in self.subscriptions[metric]:
                self.subscriptions[metric].remove(websocket)
                if not self.subscriptions[metric]:
                    del self.subscriptions[metric]

    async def subscribe(self, websocket: WebSocket, metric: str):
        if metric not in self.subscriptions:
            self.subscriptions[metric] = set()
        self.subscriptions[metric].add(websocket)
        logger.info(f"Client subscribed to {metric}")

    async def unsubscribe(self, websocket: WebSocket, metric: str):
        if metric in self.subscriptions and websocket in self.subscriptions[metric]:
            self.subscriptions[metric].remove(websocket)

    async def broadcast_metric(self, metric: str, value: any):
        if metric in self.subscriptions:
            message = {
                "type": "update",
                "payload": {
                    "metric": metric,
                    "value": value
                }
            }
            json_message = json.dumps(message)
            to_remove = []
            for connection in self.subscriptions[metric]:
                try:
                    await connection.send_text(json_message)
                except Exception as e:
                    logger.error(f"Error sending metric update: {e}")
                    to_remove.append(connection)

            for ws in to_remove:
                self.disconnect(ws)

manager = DashboardConnectionManager()

@router.websocket("")
async def dashboard_websocket(websocket: WebSocket):
    await manager.connect(websocket)
    service = DashboardService()

    try:
        while True:
            data = await websocket.receive_json()
            action = data.get('action')
            metric = data.get('metric')

            if action == 'subscribe' and metric:
                await manager.subscribe(websocket, metric)

                # Send immediate initial value
                # In a real app, parse date_range from request or default
                metric_data = await service.get_metric_data(metric, "30d")
                await websocket.send_json({
                    "type": "update",
                    "payload": {
                        "metric": metric,
                        "value": metric_data.value # simplified for realtime card
                    }
                })

            elif action == 'unsubscribe' and metric:
                await manager.unsubscribe(websocket, metric)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.close()
        except:
            pass
        manager.disconnect(websocket)

# Simulation of background updates (for demo/testing)
async def simulate_data_updates():
    """Background task to simulate real-time data changes"""
    import random
    while True:
        await asyncio.sleep(5)
        # Simulate updates for common metrics
        if 'revenue' in manager.subscriptions:
            change = random.uniform(-100, 200)
            await manager.broadcast_metric('revenue', 50000 + change) # Mock value

        if 'active_users' in manager.subscriptions:
            change = random.randint(-5, 10)
            await manager.broadcast_metric('active_users', 1200 + change)

# In a real app, this would be started on startup event
