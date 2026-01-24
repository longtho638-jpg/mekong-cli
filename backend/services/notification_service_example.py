"""
Example usage of NotificationService

This file demonstrates how to use the notification service.
"""

from notification_service import notification_service, NotificationType


def example_usage():
    """Demonstrate notification service features"""

    user_id = "user_12345"
    username = "John Doe"

    print("=" * 60)
    print("NOTIFICATION SERVICE EXAMPLE")
    print("=" * 60)

    # 1. Send welcome notification
    print("\n1. Sending welcome notification...")
    welcome_notif = notification_service.send_welcome_notification(
        user_id=user_id,
        username=username
    )
    print(f"   Created: {welcome_notif.notification_id}")

    # 2. Send payment success notification
    print("\n2. Sending payment success notification...")
    payment_notif = notification_service.send_payment_success_notification(
        user_id=user_id,
        amount=395.00,
        currency="USD",
        transaction_id="txn_abc123"
    )
    print(f"   Created: {payment_notif.notification_id}")

    # 3. Send license expiry warning
    print("\n3. Sending license expiry warning...")
    expiry_notif = notification_service.send_license_expiry_warning(
        user_id=user_id,
        days_remaining=7,
        license_type="Premium"
    )
    print(f"   Created: {expiry_notif.notification_id}")

    # 4. Send feature announcement
    print("\n4. Sending feature announcement...")
    feature_notif = notification_service.send_feature_announcement(
        user_id=user_id,
        feature_name="AI-Powered Code Review",
        feature_description="Get instant code quality feedback with our new AI reviewer.",
        learn_more_url="https://example.com/features/ai-review"
    )
    print(f"   Created: {feature_notif.notification_id}")

    # 5. Get all user notifications
    print(f"\n5. Getting all notifications for {user_id}...")
    all_notifications = notification_service.get_user_notifications(user_id)
    print(f"   Total notifications: {len(all_notifications)}")
    for notif in all_notifications:
        print(f"   - {notif.title} ({notif.notification_type.value})")

    # 6. Get unread count
    print(f"\n6. Checking unread count...")
    unread_count = notification_service.get_unread_count(user_id)
    print(f"   Unread notifications: {unread_count}")

    # 7. Mark one notification as read
    print(f"\n7. Marking first notification as read...")
    marked = notification_service.mark_as_read(user_id, welcome_notif.notification_id)
    print(f"   Success: {marked}")
    print(f"   Unread count now: {notification_service.get_unread_count(user_id)}")

    # 8. Get only unread notifications
    print(f"\n8. Getting unread notifications...")
    unread_notifications = notification_service.get_user_notifications(
        user_id,
        unread_only=True
    )
    print(f"   Unread notifications: {len(unread_notifications)}")
    for notif in unread_notifications:
        print(f"   - {notif.title}")

    # 9. Mark all as read
    print(f"\n9. Marking all notifications as read...")
    marked_count = notification_service.mark_all_as_read(user_id)
    print(f"   Marked {marked_count} notifications as read")
    print(f"   Unread count now: {notification_service.get_unread_count(user_id)}")

    # 10. Broadcast feature announcement
    print(f"\n10. Broadcasting feature announcement to multiple users...")
    user_ids = ["user_1", "user_2", "user_3"]
    broadcast_notifs = notification_service.broadcast_feature_announcement(
        user_ids=user_ids,
        feature_name="Dark Mode",
        feature_description="Toggle between light and dark themes in settings.",
        learn_more_url="https://example.com/features/dark-mode"
    )
    print(f"   Sent {len(broadcast_notifs)} notifications")

    # 11. Get notification as dict
    print(f"\n11. Getting notification as dictionary...")
    notif_dict = payment_notif.to_dict()
    print(f"   Notification data:")
    for key, value in notif_dict.items():
        print(f"      {key}: {value}")

    print("\n" + "=" * 60)
    print("EXAMPLE COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    example_usage()
