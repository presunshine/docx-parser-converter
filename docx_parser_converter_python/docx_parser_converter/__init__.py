"""DOCX Parser and Converter.

Convert DOCX documents to HTML or plain text.

Example:
    >>> from docx_parser_converter import docx_to_html, docx_to_text
    >>> html = docx_to_html("document.docx")
    >>> text = docx_to_text("document.docx")
"""

# Import with explicit re-export for type checkers
from .api import ConversionConfig as ConversionConfig
from .api import docx_to_html as docx_to_html
from .api import docx_to_text as docx_to_text

__all__ = ["docx_to_html", "docx_to_text", "ConversionConfig"]
