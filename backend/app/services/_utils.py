from decimal import Decimal
from typing import Any, Iterable


def schema_to_dict(schema: Any, exclude_unset: bool = True) -> dict:
    if hasattr(schema, "model_dump"):
        return schema.model_dump(exclude_unset=exclude_unset)
    return schema.dict(exclude_unset=exclude_unset)


def update_model(db_obj: Any, obj_in: Any) -> Any:
    for field, value in schema_to_dict(obj_in, exclude_unset=True).items():
        setattr(db_obj, field, value)
    return db_obj


def decimal_sum(values: Iterable[Any]) -> Decimal:
    return sum((Decimal(value or 0) for value in values), Decimal("0"))


def require_unique(existing: Any, message: str) -> None:
    if existing is not None:
        raise ValueError(message)


def validate_non_negative(value: Any, field_name: str) -> None:
    if value is not None and Decimal(value) < 0:
        raise ValueError(f"{field_name} doit etre superieur ou egal a 0")
