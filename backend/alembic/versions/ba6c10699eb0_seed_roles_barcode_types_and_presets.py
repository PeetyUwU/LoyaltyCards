"""seed roles, barcode types, and presets

Revision ID: ba6c10699eb0
Revises: 35f1fe0ba718
Create Date: 2026-08-28 13:53:39.522875

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import table, column, Integer, String, Boolean


# revision identifiers, used by Alembic.
revision: str = 'ba6c10699eb0'
down_revision: Union[str, Sequence[str], None] = '35f1fe0ba718'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

roles = table('roles',
    column('id', Integer),
    column('role_name', String),
)

barcode_types = table('barcode_types',
    column('id', Integer),
    column('code', String),
    column('numeric_only', Boolean),
    column('fixed_length', Integer),
    column('min_length', Integer),
    column('max_length', Integer),
)

company_preset = table('company_preset',
    column('id', Integer),
    column('name', String),
    column('image_url', String),
    column('color_scheme', String),
    column('barcode_type_id', Integer),
)


def upgrade() -> None:
    op.bulk_insert(roles, [
        {'role_name': 'owner'},
        {'role_name': 'admin'},
        {'role_name': 'user'},
    ])

    op.bulk_insert(barcode_types, [
        {'code': 'EAN13', 'numeric_only': True, 'fixed_length': 13, 'min_length': None, 'max_length': None},
        {'code': 'EAN8', 'numeric_only': True, 'fixed_length': 8, 'min_length': None, 'max_length': None},
        {'code': 'CODE128', 'numeric_only': False, 'fixed_length': None, 'min_length': 1, 'max_length': 48},
        {'code': 'QR', 'numeric_only': False, 'fixed_length': None, 'min_length': 1, 'max_length': 4296},
        {'code': 'PDF417', 'numeric_only': False, 'fixed_length': None, 'min_length': 1, 'max_length': 1850},
    ])
    
    conn = op.get_bind()
    ean13_id = conn.execute(
        sa.select(barcode_types.c.id).where(barcode_types.c.code == 'EAN13')
        ).scalar_one()
    code128_id = conn.execute(
        sa.select(barcode_types.c.id).where(barcode_types.c.code == 'CODE128')
        ).scalar_one()

    op.bulk_insert(company_preset, [
        {'name': 'tesco', 'image_url': '/presets/tesco.png', 'color_scheme': '#00539F', 'barcode_type_id': ean13_id},
        {'name': 'albert', 'image_url': '/presets/albert.png', 'color_scheme': '#E30613', 'barcode_type_id': ean13_id},
        {'name': 'billa', 'image_url': '/presets/billa.png', 'color_scheme': '#FCD900', 'barcode_type_id': code128_id},
    ])


def downgrade() -> None:
    op.execute("DELETE FROM company_preset")
    op.execute("DELETE FROM barcode_types")
    op.execute("DELETE FROM roles")
