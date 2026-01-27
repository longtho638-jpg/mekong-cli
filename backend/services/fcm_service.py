import firebase_admin
from firebase_admin import messaging, credentials
import os
import logging

logger = logging.getLogger(__name__)

class FCMService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FCMService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self._initialized = True
        self.app = None

        # Try to initialize with credentials file
        cred_path = os.getenv('FIREBASE_CREDENTIALS_PATH', 'firebase-service-account.json')

        try:
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                self.app = firebase_admin.initialize_app(cred)
                logger.info("Firebase Admin initialized successfully.")
            else:
                logger.warning(f"Firebase credentials file not found at {cred_path}. FCM service will be disabled.")
        except Exception as e:
            logger.error(f"Failed to initialize Firebase Admin: {str(e)}")

    def send_push(self, token: str, title: str, body: str, data: dict = None):
        """Send push notification via FCM"""
        if not self.app:
            logger.warning("FCM not initialized, skipping push notification.")
            return None

        try:
            message = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=body
                ),
                data=data or {},
                token=token
            )

            response = messaging.send(message)
            return response
        except Exception as e:
            logger.error(f"Error sending push notification: {str(e)}")
            return None

    def send_multicast(self, tokens: list[str], title: str, body: str, data: dict = None):
        """Send to multiple devices"""
        if not self.app:
            logger.warning("FCM not initialized, skipping multicast.")
            return None

        try:
            message = messaging.MulticastMessage(
                notification=messaging.Notification(title=title, body=body),
                data=data or {},
                tokens=tokens
            )

            response = messaging.send_multicast(message)
            return f'{response.success_count} sent, {response.failure_count} failed'
        except Exception as e:
            logger.error(f"Error sending multicast: {str(e)}")
            return None
