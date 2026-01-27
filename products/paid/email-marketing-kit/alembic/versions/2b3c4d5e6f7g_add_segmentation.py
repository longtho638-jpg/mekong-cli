"""
Generate Alembic migrations for new features.
Note: Since we are in a "Kit" context, we might want to just dump the schema or create a new migration.
For now, we will create a new migration file manually to reflect the changes (segment_rules).
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '2b3c4d5e6f7g'
down_revision = '1a2b3c4d5e6f'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Add segment_rules to campaigns
    op.add_column('campaigns', sa.Column('segment_rules', postgresql.JSON(astext_type=sa.Text()), nullable=True))

    # Ensure templates table exists (it was likely in initial schema but ensuring)
    # Ensure subscribers have attributes (JSON)
    # op.add_column('subscribers', sa.Column('attributes', postgresql.JSON(astext_type=sa.Text()), nullable=True)) # Already in initial

def downgrade() -> None:
    op.drop_column('campaigns', 'segment_rules')
