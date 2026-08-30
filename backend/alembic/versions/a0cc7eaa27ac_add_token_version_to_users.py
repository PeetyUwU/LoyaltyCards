"""add token_version to users

Revision ID: a0cc7eaa27ac
Revises: 283d167ad283
Create Date: 2026-08-29 16:43:26.886343

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = 'a0cc7eaa27ac'
down_revision: Union[str, Sequence[str], None] = '283d167ad283'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('token_version', sa.Integer(), nullable=False, server_default='0'))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'token_version')
