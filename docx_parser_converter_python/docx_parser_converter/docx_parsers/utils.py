"""Backwards compatibility for utility functions.

.. deprecated::
    This module is deprecated. The new API accepts file paths directly.
"""

import warnings
from pathlib import Path


def read_binary_from_file_path(file_path: str) -> bytes:
    """Read binary content from a file path.

    .. deprecated::
        The new API accepts file paths directly:
        ``from docx_parser_converter import docx_to_html``
        ``docx_to_html('path/to/file.docx')``

    Args:
        file_path: The path to the file to read.

    Returns:
        The binary content of the file.
    """
    warnings.warn(
        "read_binary_from_file_path is deprecated and will be removed in a future version. "
        "The new API accepts file paths directly: docx_to_html('path/to/file.docx')",
        DeprecationWarning,
        stacklevel=2,
    )
    return Path(file_path).read_bytes()
