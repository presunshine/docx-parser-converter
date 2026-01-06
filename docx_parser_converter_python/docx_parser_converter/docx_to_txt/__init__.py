"""Deprecated docx_to_txt module.

.. deprecated::
    Use the new API instead: ``from docx_parser_converter import docx_to_text``
"""

from .docx_to_txt_converter import DocxToTxtConverter

__all__ = ["DocxToTxtConverter"]
