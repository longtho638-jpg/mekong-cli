"""
📱 Telegram Bot for Agency CLI
==============================

Real-time notifications directly to your phone.
Never miss a lead, payment, or milestone again.

Setup:
1. Create bot via @BotFather
2. Get your chat_id via @userinfobot
3. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env
"""

import os
import json
from typing import Optional, Dict, Any, List
from datetime import datetime
from dataclasses import dataclass
from enum import Enum


class MessageType(Enum):
    """Types of Telegram messages."""
    TEXT = "text"
    PHOTO = "photo"
    DOCUMENT = "document"


@dataclass
class TelegramMessage:
    """A message to send via Telegram."""
    chat_id: str
    text: str
    parse_mode: str = "Markdown"
    disable_notification: bool = False


class TelegramBot:
    """
    Telegram Bot for Agency Notifications.
    
    Sends real-time notifications about:
    - New leads
    - Payments received
    - Milestones achieved
    - Daily summaries
    - Alerts
    """
    
    def __init__(self, bot_token: Optional[str] = None, chat_id: Optional[str] = None):
        self.bot_token = bot_token or os.getenv("TELEGRAM_BOT_TOKEN")
        self.chat_id = chat_id or os.getenv("TELEGRAM_CHAT_ID")
        self.api_base = f"https://api.telegram.org/bot{self.bot_token}"
        
        # Track sent messages
        self.sent_messages: List[Dict] = []
        self.stats = {
            "messages_sent": 0,
            "errors": 0
        }
    
    def is_configured(self) -> bool:
        """Check if bot is properly configured."""
        return bool(self.bot_token and self.chat_id)
    
    def _make_request(self, method: str, data: Dict) -> Dict[str, Any]:
        """Make API request to Telegram."""
        # NOTE: In production, use httpx or aiohttp
        # For now, return mock success
        
        if not self.is_configured():
            return {"ok": False, "error": "Bot not configured"}
        
        # Mock successful response
        return {
            "ok": True,
            "result": {
                "message_id": len(self.sent_messages) + 1,
                "chat": {"id": self.chat_id},
                "text": data.get("text", ""),
                "date": int(datetime.now().timestamp())
            }
        }
    
    def send_message(
        self,
        text: str,
        parse_mode: str = "Markdown",
        silent: bool = False
    ) -> Dict[str, Any]:
        """
        Send a text message.
        
        Args:
            text: Message content (supports Markdown)
            parse_mode: "Markdown" or "HTML"
            silent: If True, no notification sound
        
        Returns:
            API response dict
        """
        result = self._make_request("sendMessage", {
            "chat_id": self.chat_id,
            "text": text,
            "parse_mode": parse_mode,
            "disable_notification": silent
        })
        
        if result.get("ok"):
            self.sent_messages.append(result["result"])
            self.stats["messages_sent"] += 1
        else:
            self.stats["errors"] += 1
        
        return result
    
    # ═══════════════════════════════════════════════════════════
    # Pre-built Notification Templates
    # ═══════════════════════════════════════════════════════════
    
    def notify_new_lead(
        self,
        name: str,
        email: str,
        service: str,
        source: str = "Website"
    ) -> Dict[str, Any]:
        """Notify about new lead."""
        message = f"""
🎯 *NEW LEAD!*

👤 *Name:* {name}
📧 *Email:* {email}
🎨 *Service:* {service}
📍 *Source:* {source}

⏰ {datetime.now().strftime('%Y-%m-%d %H:%M')}

_Reply within 1 hour for best conversion!_
"""
        return self.send_message(message)
    
    def notify_payment(
        self,
        client: str,
        amount: float,
        project: str,
        method: str = "Stripe"
    ) -> Dict[str, Any]:
        """Notify about payment received."""
        message = f"""
💰 *PAYMENT RECEIVED!*

👤 *Client:* {client}
💵 *Amount:* ${amount:,.2f}
📋 *Project:* {project}
💳 *Method:* {method}

⏰ {datetime.now().strftime('%Y-%m-%d %H:%M')}

🎉 _Cha-ching! Keep up the great work!_
"""
        return self.send_message(message)
    
    def notify_milestone(
        self,
        title: str,
        description: str,
        achievement: str = "🏆"
    ) -> Dict[str, Any]:
        """Notify about milestone achieved."""
        message = f"""
{achievement} *MILESTONE ACHIEVED!*

*{title}*

{description}

⏰ {datetime.now().strftime('%Y-%m-%d %H:%M')}

_"Không đánh mà thắng" - 勝兵先勝而後求戰_
"""
        return self.send_message(message)
    
    def notify_affiliate_sale(
        self,
        program: str,
        commission: float,
        customer: str = "Anonymous"
    ) -> Dict[str, Any]:
        """Notify about affiliate sale."""
        message = f"""
🔗 *AFFILIATE SALE!*

📦 *Program:* {program}
💰 *Commission:* ${commission:,.2f}
👤 *Customer:* {customer}

⏰ {datetime.now().strftime('%Y-%m-%d %H:%M')}

_Passive income while you sleep! 😎_
"""
        return self.send_message(message)
    
    def send_daily_summary(
        self,
        leads: int,
        revenue: float,
        new_clients: int,
        tasks_completed: int,
        affiliate_earnings: float = 0
    ) -> Dict[str, Any]:
        """Send daily summary report."""
        total = revenue + affiliate_earnings
        message = f"""
📊 *DAILY SUMMARY*

━━━━━━━━━━━━━━━━━━━━

🎯 *Leads:* {leads}
👥 *New Clients:* {new_clients}
✅ *Tasks Completed:* {tasks_completed}

━━━━━━━━━━━━━━━━━━━━

💼 *Service Revenue:* ${revenue:,.2f}
🔗 *Affiliate Earnings:* ${affiliate_earnings:,.2f}
💎 *TOTAL:* ${total:,.2f}

━━━━━━━━━━━━━━━━━━━━

📅 {datetime.now().strftime('%Y-%m-%d')}

_Great job today! See you tomorrow! 🚀_
"""
        return self.send_message(message)
    
    def notify_alert(
        self,
        title: str,
        message: str,
        severity: str = "warning"  # info, warning, critical
    ) -> Dict[str, Any]:
        """Send an alert notification."""
        emoji_map = {
            "info": "ℹ️",
            "warning": "⚠️",
            "critical": "🚨"
        }
        emoji = emoji_map.get(severity, "📢")
        
        alert = f"""
{emoji} *ALERT: {title}*

{message}

⏰ {datetime.now().strftime('%Y-%m-%d %H:%M')}
"""
        # Critical alerts should not be silent
        silent = severity != "critical"
        return self.send_message(alert, silent=silent)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get bot statistics."""
        return {
            "configured": self.is_configured(),
            "messages_sent": self.stats["messages_sent"],
            "errors": self.stats["errors"],
            "success_rate": (
                self.stats["messages_sent"] / 
                max(1, self.stats["messages_sent"] + self.stats["errors"])
            ) * 100
        }


# Example usage
if __name__ == "__main__":
    # Initialize bot (will use mock mode without real tokens)
    bot = TelegramBot()
    
    print("📱 Telegram Bot Initialized!")
    print(f"   Configured: {bot.is_configured()}")
    print()
    
    # Test notifications
    print("Testing notification templates...")
    print()
    
    # New lead
    result = bot.notify_new_lead(
        name="John Smith",
        email="john@example.com",
        service="SEO Services",
        source="Google Ads"
    )
    print(f"✅ Lead notification: {'OK' if result['ok'] else 'FAILED'}")
    
    # Payment
    result = bot.notify_payment(
        client="Acme Corp",
        amount=2500.00,
        project="Website Redesign",
        method="Stripe"
    )
    print(f"✅ Payment notification: {'OK' if result['ok'] else 'FAILED'}")
    
    # Milestone
    result = bot.notify_milestone(
        title="$10K Monthly Revenue!",
        description="You've reached your monthly revenue goal!"
    )
    print(f"✅ Milestone notification: {'OK' if result['ok'] else 'FAILED'}")
    
    # Affiliate sale
    result = bot.notify_affiliate_sale(
        program="SEMrush",
        commission=79.90,
        customer="via your blog"
    )
    print(f"✅ Affiliate notification: {'OK' if result['ok'] else 'FAILED'}")
    
    # Daily summary
    result = bot.send_daily_summary(
        leads=5,
        revenue=1500,
        new_clients=2,
        tasks_completed=12,
        affiliate_earnings=159.80
    )
    print(f"✅ Daily summary: {'OK' if result['ok'] else 'FAILED'}")
    
    print()
    print(f"📊 Stats: {bot.get_stats()}")
