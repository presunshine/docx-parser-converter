"""Style models for DOCX documents.

These models represent elements from styles.xml.
"""

from .document_defaults import (
    DocumentDefaults,
    ParagraphPropertiesDefault,
    RunPropertiesDefault,
)
from .latent_styles import (
    LatentStyleException,
    LatentStyles,
)
from .style import Style
from .styles import Styles
from .table_style import TableStyleProperties

__all__ = [
    # Root
    "Styles",
    # Style
    "Style",
    # Document Defaults
    "DocumentDefaults",
    "RunPropertiesDefault",
    "ParagraphPropertiesDefault",
    # Latent Styles
    "LatentStyles",
    "LatentStyleException",
    # Table Style
    "TableStyleProperties",
]
