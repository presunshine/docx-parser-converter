"""Backwards compatibility wrapper for DocxToHtmlConverter.

.. deprecated::
    This module is deprecated. Use the new API instead:
    ``from docx_parser_converter import docx_to_html``
"""

import warnings
from io import BytesIO
from pathlib import Path

from ..api import docx_to_html


class DocxToHtmlConverter:
    """Legacy HTML converter class.

    .. deprecated::
        Use ``docx_to_html()`` instead:
        ``from docx_parser_converter import docx_to_html``

    Args:
        docx_file: The binary content of the DOCX file.
        use_default_values: Legacy parameter, ignored in new implementation.

    Example:
        >>> # DEPRECATED - use docx_to_html() instead
        >>> converter = DocxToHtmlConverter(docx_bytes)
        >>> html = converter.convert_to_html()
    """

    def __init__(self, docx_file: bytes, use_default_values: bool = True) -> None:
        warnings.warn(
            "DocxToHtmlConverter is deprecated and will be removed in a future version. "
            "Use: from docx_parser_converter import docx_to_html; "
            "html = docx_to_html('path/to/file.docx')",
            DeprecationWarning,
            stacklevel=2,
        )
        self._content = docx_file
        self._use_default_values = use_default_values

    def convert_to_html(self) -> str:
        """Convert DOCX content to HTML.

        Returns:
            The generated HTML content.
        """
        return docx_to_html(BytesIO(self._content))

    def save_html_to_file(self, html_content: str, output_path: str) -> None:
        """Save HTML content to a file.

        Args:
            html_content: The HTML content to save.
            output_path: The path to save the HTML file.
        """
        Path(output_path).write_text(html_content, encoding="utf-8")
