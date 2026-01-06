"""Shared pytest fixtures for all tests."""

from pathlib import Path

import pytest

# Project root fixtures directory
PROJECT_ROOT = Path(__file__).parent.parent.parent
FIXTURES_DIR = PROJECT_ROOT / "fixtures"


@pytest.fixture
def fixtures_path() -> Path:
    """Return the path to the test fixtures directory."""
    return FIXTURES_DIR / "test_docx_files"


@pytest.fixture
def tagged_tests_path() -> Path:
    """Return the path to tagged tests directory."""
    return FIXTURES_DIR / "tagged_tests"


@pytest.fixture
def text_formatting_fixtures(fixtures_path: Path) -> Path:
    """Return path to text formatting fixtures (uses main fixtures)."""
    return fixtures_path


@pytest.fixture
def paragraph_formatting_fixtures(fixtures_path: Path) -> Path:
    """Return path to paragraph formatting fixtures (uses main fixtures)."""
    return fixtures_path


@pytest.fixture
def lists_numbering_fixtures(fixtures_path: Path) -> Path:
    """Return path to lists/numbering fixtures (uses main fixtures)."""
    return fixtures_path


@pytest.fixture
def tables_fixtures(fixtures_path: Path) -> Path:
    """Return path to tables fixtures (uses main fixtures)."""
    return fixtures_path


@pytest.fixture
def comprehensive_fixtures(fixtures_path: Path) -> Path:
    """Return path to comprehensive fixtures (uses main fixtures)."""
    return fixtures_path


@pytest.fixture
def sample_docx_path(fixtures_path: Path) -> Path:
    """Return path to a sample DOCX file."""
    # Use first available DOCX file
    docx_files = list(fixtures_path.glob("*.docx"))
    if docx_files:
        return docx_files[0]
    pytest.skip("No sample DOCX files found")
    return Path()  # unreachable


@pytest.fixture
def sample_docx_bytes(sample_docx_path: Path) -> bytes:
    """Return the contents of a sample DOCX file as bytes."""
    return sample_docx_path.read_bytes()


@pytest.fixture
def invalid_zip_bytes() -> bytes:
    """Return bytes that are not a valid ZIP file."""
    return b"This is not a ZIP file"


@pytest.fixture
def empty_bytes() -> bytes:
    """Return empty bytes."""
    return b""
