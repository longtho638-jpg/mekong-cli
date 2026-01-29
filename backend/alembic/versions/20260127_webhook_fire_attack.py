"""
Manual Alembic Migration for Webhook Fire Attack Schema.
Target: backend/models/webhooks.py and backend/models/dlq_entry.py
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


def upgrade():
    # 1. Create DLQ Entries Table
    op.create_table(
        "dlq_entries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("webhook_config_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("event_type", sa.String(), nullable=False),
        sa.Column("event_payload", postgresql.JSONB, nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("retry_count", sa.Integer(), default=0),
        sa.Column("stored_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("replayed_at", sa.DateTime(), nullable=True),
        sa.Column("is_archived", sa.Boolean(), default=False),
        sa.ForeignKeyConstraint(["webhook_config_id"], ["webhook_configs.id"], ondelete="CASCADE"),
    )

    # 2. Add columns to WebhookFailures (if not exists)
    # Note: We are preferring DLQ table, but let's ensure existing tables are updated
    op.add_column("webhook_failures", sa.Column("is_resolved", sa.Boolean(), default=False))
    op.add_column("webhook_failures", sa.Column("resolution_note", sa.Text(), nullable=True))

    # 3. Create WebhookDeliveryAttempt table (Detailed Logs)
    op.create_table(
        "webhook_delivery_attempts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("delivery_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("webhook_config_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("attempt_number", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("response_status", sa.Integer(), nullable=True),
        sa.Column("response_body", sa.Text(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("duration_ms", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["delivery_id"], ["webhook_deliveries.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["webhook_config_id"], ["webhook_configs.id"], ondelete="CASCADE"),
    )

    # 4. Indexes
    op.create_index("ix_dlq_webhook_config_id", "dlq_entries", ["webhook_config_id"])
    op.create_index("ix_attempts_delivery_id", "webhook_delivery_attempts", ["delivery_id"])
    op.create_index("ix_attempts_created_at", "webhook_delivery_attempts", ["created_at"])


def downgrade():
    op.drop_table("webhook_delivery_attempts")
    op.drop_column("webhook_failures", "resolution_note")
    op.drop_column("webhook_failures", "is_resolved")
    op.drop_table("dlq_entries")
