import importlib.util
from pathlib import Path
import pytest
spec = importlib.util.spec_from_file_location('send_morning', Path(__file__).resolve().parents[1] / 'scripts/send-morning.py')
mail = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mail)


def test_scheduled_delivery_never_selects_yesterday():
    assert mail.edition_date('2026-10-22', '') == ('2026-10-22', False)


def test_explicit_sample_is_labelled_and_date_validated():
    assert mail.edition_date('2026-10-22', '2026-10-21') == ('2026-10-21', True)
    for invalid in ['yesterday', '2026-02-30', '2026-1-2']:
        with pytest.raises(ValueError):
            mail.edition_date('2026-10-22', invalid)

