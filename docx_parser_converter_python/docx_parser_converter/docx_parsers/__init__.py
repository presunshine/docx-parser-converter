"""Deprecated docx_parsers module.

.. deprecated::
    The new API accepts file paths directly.
"""

from .utils import read_binary_from_file_path

__all__ = ["read_binary_from_file_path"]
