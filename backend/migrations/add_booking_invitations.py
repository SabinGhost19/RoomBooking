"""
Create booking_invitations table

Revision ID: add_booking_invitations
Revises: (previous revision)
Create Date: 2025-11-09
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_booking_invitations'
down_revision = None  # Update this to your latest revision
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create booking_invitations table
    op.create_table(
        'booking_invitations',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('booking_id', sa.Integer(), nullable=False),
        sa.Column('inviter_id', sa.Integer(), nullable=False),
        sa.Column('invitee_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=False),
        sa.Column('response_message', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('responded_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['booking_id'], ['bookings.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['inviter_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['invitee_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('ix_booking_invitations_id', 'booking_invitations', ['id'])
    op.create_index('ix_booking_invitations_booking_id', 'booking_invitations', ['booking_id'])
    op.create_index('ix_booking_invitations_inviter_id', 'booking_invitations', ['inviter_id'])
    op.create_index('ix_booking_invitations_invitee_id', 'booking_invitations', ['invitee_id'])
    op.create_index('ix_booking_invitations_status', 'booking_invitations', ['status'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_booking_invitations_status')
    op.drop_index('ix_booking_invitations_invitee_id')
    op.drop_index('ix_booking_invitations_inviter_id')
    op.drop_index('ix_booking_invitations_booking_id')
    op.drop_index('ix_booking_invitations_id')
    
    # Drop table
    op.drop_table('booking_invitations')
