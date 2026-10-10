"""Normalização de textos extraídos de documentos.

O robô só normaliza; não valida CPF/CNPJ nem decide valores fiscais.
"""

import re
from decimal import Decimal

_STRICT_AMOUNT = re.compile(r"^-?(\d{1,3}(\.\d{3})+|\d+),\d{2}$")
_ALLOWED_CHARS = re.compile(r"^-?[\d.,]+$")


class InvalidAmountError(ValueError):
    """O texto não representa um valor monetário."""


class AmbiguousAmountError(ValueError):
    """O texto parece um valor, mas o formato brasileiro (vírgula e duas casas) não está claro."""


def normalize_digits(text: str) -> str:
    return "".join(ch for ch in text if ch.isdigit())


def normalize_amount_br(text: str) -> Decimal:
    cleaned = text.replace("R$", "").strip()
    if not cleaned or not _ALLOWED_CHARS.match(cleaned) or not any(c.isdigit() for c in cleaned):
        raise InvalidAmountError(f"not an amount: {text!r}")
    if cleaned.count(",") > 1:
        raise InvalidAmountError(f"not an amount: {text!r}")
    if not _STRICT_AMOUNT.match(cleaned):
        raise AmbiguousAmountError(f"ambiguous amount: {text!r}")
    return Decimal(cleaned.replace(".", "").replace(",", "."))
