from fastapi import HTTPException, status
from app.models.barcode_type import BarcodeType


def validate_card_code(barcode_type: BarcodeType, code: str) -> None:
    code_len = len(code)

    if barcode_type.numeric_only and not code.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Code must be numeric for {barcode_type.code}",
        )
    if barcode_type.fixed_length is not None and code_len != barcode_type.fixed_length:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Code must be exactly {barcode_type.fixed_length} digits for {barcode_type.code}",
        )
    if barcode_type.min_length is not None and code_len < barcode_type.min_length:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Code too short for {barcode_type.code} (min {barcode_type.min_length})",
        )
    if barcode_type.max_length is not None and code_len > barcode_type.max_length:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Code too long for {barcode_type.code} (max {barcode_type.max_length})",
        )


async def resolve_barcode_type(db, barcode_type_id: int | None, company_preset_id: int | None) -> BarcodeType:
    from sqlalchemy.future import select
    from app.models.company_preset import CompanyPreset

    effective_id = barcode_type_id
    if effective_id is None and company_preset_id is not None:
        preset_result = await db.execute(select(CompanyPreset).where(CompanyPreset.id == company_preset_id))
        preset = preset_result.scalar_one_or_none()
        if preset is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Preset not found")
        effective_id = preset.barcode_type_id

    if effective_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No barcode type specified")

    bt_result = await db.execute(select(BarcodeType).where(BarcodeType.id == effective_id))
    barcode_type = bt_result.scalar_one_or_none()
    if barcode_type is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Barcode type not found")

    return barcode_type