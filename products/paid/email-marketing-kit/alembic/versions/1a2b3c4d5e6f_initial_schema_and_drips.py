"""add drip tables

Revision ID: 1a2b3c4d5e6f
Revises:
Create Date: 2026-01-27 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '1a2b3c4d5e6f'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # --- Subscribers ---
    op.create_table('subscribers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('first_name', sa.String(length=255), nullable=True),
        sa.Column('last_name', sa.String(length=255), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='active'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_subscribers_email'), 'subscribers', ['email'], unique=True)
    op.create_index(op.f('ix_subscribers_id'), 'subscribers', ['id'], unique=False)

    # --- Templates ---
    op.create_table('email_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('subject', sa.String(length=255), nullable=True),
        sa.Column('body_html', sa.Text(), nullable=False),
        sa.Column('body_text', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_email_templates_id'), 'email_templates', ['id'], unique=False)

    # --- Campaigns ---
    # Enum type for postgres needs to be created if using native enum
    # But often Alembic handles it. We'll use String for simplicity in migration or create type.
    campaign_status = postgresql.ENUM('DRAFT', 'SCHEDULED', 'SENDING', 'COMPLETED', 'FAILED', 'CANCELLED', name='campaignstatus')
    campaign_status.create(op.get_bind(), checkfirst=True)

    op.create_table('campaigns',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('subject', sa.String(length=255), nullable=False),
        sa.Column('body_html', sa.Text(), nullable=False),
        sa.Column('body_text', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('draft', 'scheduled', 'sending', 'completed', 'failed', 'cancelled', name='campaignstatus'), nullable=False),
        sa.Column('scheduled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('sent_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('open_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('click_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('template_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['template_id'], ['email_templates.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_campaigns_id'), 'campaigns', ['id'], unique=False)
    op.create_index(op.f('ix_campaigns_status'), 'campaigns', ['status'], unique=False)

    # --- Campaign Events ---
    op.create_table('campaign_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('campaign_id', sa.Integer(), nullable=False),
        sa.Column('subscriber_id', sa.Integer(), nullable=False),
        sa.Column('event_type', sa.String(length=50), nullable=False),
        sa.Column('url', sa.Text(), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['campaign_id'], ['campaigns.id'], ),
        sa.ForeignKeyConstraint(['subscriber_id'], ['subscribers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_campaign_events_campaign_id'), 'campaign_events', ['campaign_id'], unique=False)
    op.create_index(op.f('ix_campaign_events_event_type'), 'campaign_events', ['event_type'], unique=False)
    op.create_index(op.f('ix_campaign_events_id'), 'campaign_events', ['id'], unique=False)
    op.create_index(op.f('ix_campaign_events_subscriber_id'), 'campaign_events', ['subscriber_id'], unique=False)

    # --- Drip Campaigns ---
    drip_status = postgresql.ENUM('ACTIVE', 'PAUSED', 'ARCHIVED', name='dripstatus')
    drip_status.create(op.get_bind(), checkfirst=True)

    drip_trigger_type = postgresql.ENUM('SIGNUP', 'TAG_ADDED', 'MANUAL', name='driptriggertype')
    drip_trigger_type.create(op.get_bind(), checkfirst=True)

    op.create_table('drip_campaigns',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('active', 'paused', 'archived', name='dripstatus'), nullable=False),
        sa.Column('trigger_type', sa.Enum('signup', 'tag_added', 'manual', name='driptriggertype'), nullable=False),
        sa.Column('trigger_value', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_drip_campaigns_id'), 'drip_campaigns', ['id'], unique=False)

    # --- Drip Steps ---
    drip_action_type = postgresql.ENUM('EMAIL', 'DELAY', name='dripactiontype')
    drip_action_type.create(op.get_bind(), checkfirst=True)

    op.create_table('drip_steps',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('drip_campaign_id', sa.Integer(), nullable=False),
        sa.Column('step_order', sa.Integer(), nullable=False),
        sa.Column('action_type', sa.Enum('email', 'delay', name='dripactiontype'), nullable=False),
        sa.Column('delay_seconds', sa.Integer(), nullable=True),
        sa.Column('template_id', sa.Integer(), nullable=True),
        sa.Column('subject', sa.String(length=255), nullable=True),
        sa.ForeignKeyConstraint(['drip_campaign_id'], ['drip_campaigns.id'], ),
        sa.ForeignKeyConstraint(['template_id'], ['email_templates.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_drip_steps_id'), 'drip_steps', ['id'], unique=False)

    # --- Drip Enrollments ---
    enrollment_status = postgresql.ENUM('ACTIVE', 'COMPLETED', 'CANCELLED', 'FAILED', name='enrollmentstatus')
    enrollment_status.create(op.get_bind(), checkfirst=True)

    op.create_table('drip_enrollments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('drip_campaign_id', sa.Integer(), nullable=False),
        sa.Column('subscriber_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.Enum('active', 'completed', 'cancelled', 'failed', name='enrollmentstatus'), nullable=False),
        sa.Column('current_step_id', sa.Integer(), nullable=True),
        sa.Column('next_run_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['current_step_id'], ['drip_steps.id'], ),
        sa.ForeignKeyConstraint(['drip_campaign_id'], ['drip_campaigns.id'], ),
        sa.ForeignKeyConstraint(['subscriber_id'], ['subscribers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_drip_enrollments_id'), 'drip_enrollments', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_drip_enrollments_id'), table_name='drip_enrollments')
    op.drop_table('drip_enrollments')
    op.drop_index(op.f('ix_drip_steps_id'), table_name='drip_steps')
    op.drop_table('drip_steps')
    op.drop_index(op.f('ix_drip_campaigns_id'), table_name='drip_campaigns')
    op.drop_table('drip_campaigns')
    op.drop_index(op.f('ix_campaign_events_subscriber_id'), table_name='campaign_events')
    op.drop_index(op.f('ix_campaign_events_id'), table_name='campaign_events')
    op.drop_index(op.f('ix_campaign_events_event_type'), table_name='campaign_events')
    op.drop_index(op.f('ix_campaign_events_campaign_id'), table_name='campaign_events')
    op.drop_table('campaign_events')
    op.drop_index(op.f('ix_campaigns_status'), table_name='campaigns')
    op.drop_index(op.f('ix_campaigns_id'), table_name='campaigns')
    op.drop_table('campaigns')
    op.drop_index(op.f('ix_email_templates_id'), table_name='email_templates')
    op.drop_table('email_templates')
    op.drop_index(op.f('ix_subscribers_id'), table_name='subscribers')
    op.drop_index(op.f('ix_subscribers_email'), table_name='subscribers')
    op.drop_table('subscribers')

    # Drop Enums
    sa.Enum(name='enrollmentstatus').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='dripactiontype').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='driptriggertype').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='dripstatus').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='campaignstatus').drop(op.get_bind(), checkfirst=True)
