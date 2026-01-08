"""Common models shared across document, styles, and numbering.

These models represent XML elements that appear in multiple contexts.
"""

from .border import Border, ParagraphBorders, TableBorders
from .color import Color
from .indentation import Indentation
from .shading import Shading
from .spacing import Spacing
from .width import Width

__all__ = [
    # Border
    "Border",
    "ParagraphBorders",
    "TableBorders",
    # Color
    "Color",
    # Indentation
    "Indentation",
    # Shading
    "Shading",
    # Spacing
    "Spacing",
    # Width
    "Width",
]
