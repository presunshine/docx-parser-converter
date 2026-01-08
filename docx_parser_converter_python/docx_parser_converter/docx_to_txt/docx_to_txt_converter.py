"""Backwards compatibility wrapper for DocxToTxtConverter.

.. deprecated::
    This module is deprecated. Use the new API instead:
    ``from docx_parser_converter import docx_to_text``
"""

import warnings
from io import BytesIO
from pathlib import Path

from ..api import docx_to_text


class DocxToTxtConverter:
    """Legacy text converter class.

    .. deprecated::
        Use ``docx_to_text()`` instead:
        ``from docx_parser_converter import docx_to_text``

    Args:
        docx_file: The binary content of the DOCX file.
        use_default_values: Legacy parameter, ignored in new implementation.

    Example:
        >>> # DEPRECATED - use docx_to_text() instead
        >>> converter = DocxToTxtConverter(docx_bytes)
        >>> text = converter.convert_to_txt()
    """

    def __init__(self, docx_file: bytes, use_default_values: bool = True) -> None:
        warnings.warn(
            "DocxToTxtConverter is deprecated and will be removed in a future version. "
            "Use: from docx_parser_converter import docx_to_text; "
            "text = docx_to_text('path/to/file.docx')",
            DeprecationWarning,
            stacklevel=2,
        )
        self._content = docx_file
        self._use_default_values = use_default_values

    def convert_to_txt(self, indent: bool = True) -> str:
        """Convert DOCX content to plain text.

        Args:
            indent: Legacy parameter, ignored in new implementation.

        Returns:
            The generated plain text content.
        """
        return docx_to_text(BytesIO(self._content))

    def save_txt_to_file(self, txt_content: str, output_path: str) -> None:
        """Save text content to a file.

        Args:
            txt_content: The text content to save.
            output_path: The path to save the text file.
        """
        Path(output_path).write_text(txt_content, encoding="utf-8")
