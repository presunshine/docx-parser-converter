"""Common parsers for shared elements."""

from .border_parser import (
    parse_border,
    parse_paragraph_borders,
    parse_table_borders,
)
from .color_parser import parse_color
from .indentation_parser import parse_indentation
from .shading_parser import parse_shading
from .spacing_parser import parse_spacing
from .width_parser import parse_width

__all__ = [
    "parse_border",
    "parse_color",
    "parse_indentation",
    "parse_paragraph_borders",
    "parse_shading",
    "parse_spacing",
    "parse_table_borders",
    "parse_width",
]
