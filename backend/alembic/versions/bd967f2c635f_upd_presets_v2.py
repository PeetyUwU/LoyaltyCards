"""update_company_preset_barcode_types_and_add_missing_presets

Revision ID: update_company_preset_barcode_types
Revises: e987b1f90d4a
Create Date: 2026-08-31

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import table, column, Integer, String


# revision identifiers, used by Alembic.
revision = 'upd_presets_v2'
down_revision = 'e987b1f90d4a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Upgrade schema - safely update or insert presets without violating foreign keys."""
    barcode_types = table('barcode_types',
        column('id', Integer),
        column('code', String),
    )
    
    company_preset = table('company_preset',
        column('id', Integer),
        column('name', String),
        column('image_url', String),
        column('color_scheme', String),
        column('barcode_type_id', Integer),
    )

    conn = op.get_bind()

    ean13_id = conn.execute(
        sa.select(barcode_types.c.id).where(barcode_types.c.code == 'EAN13')
    ).scalar_one()
    
    code128_id = conn.execute(
        sa.select(barcode_types.c.id).where(barcode_types.c.code == 'CODE128')
    ).scalar_one()
    
    qr_id = conn.execute(
        sa.select(barcode_types.c.id).where(barcode_types.c.code == 'QR')
    ).scalar_one()

    presets_data = [
        {'name': 'tesco', 'image_url': '/presets/tesco.png', 'color_scheme': '#00539F', 'barcode_type_id': code128_id},
        {'name': 'penny', 'image_url': '/presets/penny.png', 'color_scheme': None, 'barcode_type_id': ean13_id},
        {'name': 'albert', 'image_url': '/presets/albert.png', 'color_scheme': '#E30613', 'barcode_type_id': qr_id},
        {'name': 'billa', 'image_url': '/presets/billa.png', 'color_scheme': '#FCD900', 'barcode_type_id': qr_id},
        {'name': 'lidl', 'image_url': '/presets/lidl.png', 'color_scheme': None, 'barcode_type_id': qr_id},
        {'name': 'kaufland', 'image_url': '/presets/kaufland.png', 'color_scheme': None, 'barcode_type_id': qr_id},
    ]

    # Update or insert each preset individually to maintain foreign key safety
    for p in presets_data:
        existing_id = conn.execute(
            sa.select(company_preset.c.id).where(company_preset.c.name == p['name'])
        ).scalar_one_or_none()

        if existing_id:
            conn.execute(
                company_preset.update()
                .where(company_preset.c.name == p['name'])
                .values(
                    image_url=p['image_url'],
                    color_scheme=p['color_scheme'],
                    barcode_type_id=p['barcode_type_id']
                )
            )
        else:
            conn.execute(
                company_preset.insert().values(
                    name=p['name'],
                    image_url=p['image_url'],
                    color_scheme=p['color_scheme'],
                    barcode_type_id=p['barcode_type_id']
                )
            )


def downgrade() -> None:
    """Downgrade schema - restore previous state."""
    barcode_types = table('barcode_types',
        column('id', Integer),
        column('code', String),
    )
    
    company_preset = table('company_preset',
        column('id', Integer),
        column('name', String),
        column('image_url', String),
        column('color_scheme', String),
        column('barcode_type_id', Integer),
    )

    conn = op.get_bind()
    
    ean13_id = conn.execute(
        sa.select(barcode_types.c.id).where(barcode_types.c.code == 'EAN13')
    ).scalar_one()
    
    code128_id = conn.execute(
        sa.select(barcode_types.c.id).where(barcode_types.c.code == 'CODE128')
    ).scalar_one()

    # Revert back to original three presets safely via update/insert
    old_presets = [
        {'name': 'tesco', 'image_url': '/presets/tesco.png', 'color_scheme': '#00539F', 'barcode_type_id': ean13_id},
        {'name': 'albert', 'image_url': '/presets/albert.png', 'color_scheme': '#E30613', 'barcode_type_id': ean13_id},
        {'name': 'billa', 'image_url': '/presets/billa.png', 'color_scheme': '#FCD900', 'barcode_type_id': code128_id},
    ]
    
    for p in old_presets:
        conn.execute(
            company_preset.update()
            .where(company_preset.c.name == p['name'])
            .values(
                image_url=p['image_url'],
                color_scheme=p['color_scheme'],
                barcode_type_id=p['barcode_type_id']
            )
        )