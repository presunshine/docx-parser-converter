"""Deprecated docx_to_html module.

.. deprecated::
    Use the new API instead: ``from docx_parser_converter import docx_to_html``
"""

from .docx_to_html_converter import DocxToHtmlConverter

__all__ = ["DocxToHtmlConverter"]
