from decimal import Decimal

import pytest
from hypothesis import given
from hypothesis import strategies as st

from extraction.normalize import (
    AmbiguousAmountError,
    InvalidAmountError,
    normalize_amount_br,
    normalize_digits,
)


def test_normalize_digits_removes_mask():
    assert normalize_digits("529.982.247-25") == "52998224725"
    assert normalize_digits("11.222.333/0001-81") == "11222333000181"


def test_normalize_digits_empty_when_no_digits():
    assert normalize_digits("abc") == ""


@pytest.mark.parametrize(
    "text,expected",
    [
        ("1.234,56", Decimal("1234.56")),
        ("R$ 1.234,56", Decimal("1234.56")),
        ("R$1.234,56", Decimal("1234.56")),
        ("0,05", Decimal("0.05")),
        ("12.345.678,90", Decimal("12345678.90")),
        ("-1.234,56", Decimal("-1234.56")),
        ("  987,00  ", Decimal("987.00")),
    ],
)
def test_normalize_amount_br_valid(text, expected):
    assert normalize_amount_br(text) == expected


@pytest.mark.parametrize("text", ["1.234", "1234", "1234,5", "1,234"])
def test_normalize_amount_br_ambiguous(text):
    with pytest.raises(AmbiguousAmountError):
        normalize_amount_br(text)


@pytest.mark.parametrize("text", ["", "   ", "abc", "R$", "1,2,3"])
def test_normalize_amount_br_invalid(text):
    with pytest.raises(InvalidAmountError):
        normalize_amount_br(text)


def format_br(value: Decimal) -> str:
    sign = "-" if value < 0 else ""
    cents = int(abs(value) * 100)
    whole, frac = divmod(cents, 100)
    return f"{sign}{whole:,}".replace(",", ".") + f",{frac:02d}"


@given(st.decimals(min_value=Decimal(-1000000000), max_value=Decimal(1000000000), places=2))
def test_roundtrip_property(value):
    assert normalize_amount_br(format_br(value)) == value


def test_normalize_digits_ignores_whitespace_and_symbols():
    assert normalize_digits(" 529 982\n247-25\t") == "52998224725"
    assert normalize_digits("") == ""
    assert normalize_digits("../-") == ""


@given(st.text())
def test_normalize_digits_property_ascii_only_and_idempotent(text):
    result = normalize_digits(text)
    assert all(ch in "0123456789" for ch in result)
    assert normalize_digits(result) == result


@pytest.mark.parametrize("text", ["²", "١٢٣"])
def test_normalize_digits_rejects_non_ascii_digits(text):
    assert normalize_digits(text) == ""


@pytest.mark.parametrize(
    "text,expected",
    [
        ("0,00", Decimal("0.00")),
        ("-0,00", Decimal("0.00")),
        ("00,50", Decimal("0.50")),
        ("1.234.567,89", Decimal("1234567.89")),
        ("R$ -1.234,56", Decimal("-1234.56")),
        ("999.999.999,99", Decimal("999999999.99")),
    ],
)
def test_normalize_amount_br_edge_values(text, expected):
    assert normalize_amount_br(text) == expected


@pytest.mark.parametrize("text", ["1.23,45", "1.234,567", ",50", "1234,567", "12.34"])
def test_normalize_amount_br_ambiguous_formats(text):
    with pytest.raises(AmbiguousAmountError):
        normalize_amount_br(text)


@pytest.mark.parametrize("text", ["--1,00", "12-3,00", "1,00 reais", "R$ R$", "1;00", "\n"])
def test_normalize_amount_br_invalid_characters(text):
    with pytest.raises(InvalidAmountError):
        normalize_amount_br(text)


def test_amount_errors_are_distinct_value_errors():
    assert issubclass(InvalidAmountError, ValueError)
    assert issubclass(AmbiguousAmountError, ValueError)
    assert not issubclass(InvalidAmountError, AmbiguousAmountError)
    assert not issubclass(AmbiguousAmountError, InvalidAmountError)


def test_normalize_amount_br_keeps_two_decimal_places():
    assert str(normalize_amount_br("10,00")) == "10.00"


@pytest.mark.parametrize("text", ["１２,３４", "١٢,٣٤", "1²,00"])
def test_normalize_amount_br_rejects_non_ascii_digits(text):
    with pytest.raises(InvalidAmountError):
        normalize_amount_br(text)
