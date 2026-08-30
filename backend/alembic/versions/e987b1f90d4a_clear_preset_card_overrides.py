"""clear_preset_card_overrides

Revision ID: e987b1f90d4a
Revises: a0cc7eaa27ac
Create Date: 2026-08-30 15:40:15.223272

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e987b1f90d4a'
down_revision: Union[str, Sequence[str], None] = 'a0cc7eaa27ac'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute(
        """
        UPDATE cards 
        SET color_scheme = NULL, barcode_type_id = NULL 
        WHERE company_preset_id IS NOT NULL;
        """
    )
    op.create_check_constraint(
        "ck_card_preset_or_custom",
        "cards",
        """
        (company_preset_id IS NOT NULL AND color_scheme IS NULL AND barcode_type_id IS NULL)
        OR
        (company_preset_id IS NULL AND color_scheme IS NOT NULL AND barcode_type_id IS NOT NULL)
        """
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("ALTER TABLE cards DROP CONSTRAINT ck_card_preset_or_custom;")