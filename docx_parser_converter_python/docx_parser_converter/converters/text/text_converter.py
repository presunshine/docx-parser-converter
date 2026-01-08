"""Main text converter.

Provides the main entry point for converting DOCX documents to plain text.
"""

from dataclasses import dataclass
from typing import Literal

from ...models.document.document import Document
from ...models.document.paragraph import Paragraph
from ...models.document.table import Table
from ...models.numbering.numbering import Numbering
from ...models.styles.styles import Styles
from ..common.numbering_tracker import NumberingTracker
from .paragraph_to_text import ParagraphToTextConverter
from .table_to_text import TableMode, TableToTextConverter

# =============================================================================
# Configuration
# =============================================================================


@dataclass
class TextConverterConfig:
    """Configuration for text converter."""

    formatting: Literal["plain", "markdown"] = "plain"
    table_mode: TableMode = "auto"
    paragraph_separator: str = "\n\n"
    preserve_empty_paragraphs: bool = True
    preserve_list_indentation: bool = True


# =============================================================================
# Main Entry Point
# =============================================================================


def document_to_text(
    doc: Document | None,
    config: TextConverterConfig | None = None,
) -> str:
    """Convert a Document to plain text.

    Args:
        doc: Document element or None
        config: Optional configuration

    Returns:
        Plain text content
    """
    if doc is None:
        return ""

    converter = TextConverter(config=config)
    return converter.convert(doc)


# =============================================================================
# Text Converter Class
# =============================================================================


class TextConverter:
    """Main converter for Document elements to plain text."""

    def __init__(
        self,
        config: TextConverterConfig | None = None,
        styles: Styles | None = None,
        numbering: Numbering | None = None,
        hyperlink_urls: dict[str, str] | None = None,
    ) -> None:
        """Initialize text converter.

        Args:
            config: Converter configuration
            styles: Document styles (for style resolution)
            numbering: Document numbering definitions
            hyperlink_urls: Dict mapping rId to URL
        """
        self.config = config or TextConverterConfig()
        self.styles = styles
        self.numbering = numbering
        self.hyperlink_urls = hyperlink_urls or {}

        # Track numbering counters
        self._numbering_counters: dict[tuple[int, int], int] = {}

        # Create numbering tracker for list indentation
        self._numbering_tracker = NumberingTracker(numbering)

        # Initialize sub-converters
        use_markdown = self.config.formatting == "markdown"
        self._paragraph_converter = ParagraphToTextConverter(
            use_markdown=use_markdown,
            hyperlink_urls=self.hyperlink_urls,
        )
        self._table_converter = TableToTextConverter(
            mode=self.config.table_mode,
        )

    def convert(self, doc: Document | None) -> str:
        """Convert a Document to text.

        Args:
            doc: Document element or None

        Returns:
            Plain text content
        """
        if doc is None:
            return ""

        if doc.body is None:
            return ""

        # Reset numbering counters
        self._numbering_counters.clear()

        parts: list[str] = []

        for content in doc.body.content:
            text = self._convert_content(content)
            parts.append(text)

        # Join with paragraph separator and clean up
        result = self.config.paragraph_separator.join(parts)

        # Remove excessive newlines
        while "\n\n\n" in result:
            result = result.replace("\n\n\n", "\n\n")

        return result.strip()

    def _convert_content(self, content: Paragraph | Table) -> str:
        """Convert body content element.

        Args:
            content: Paragraph or Table

        Returns:
            Text representation
        """
        if isinstance(content, Paragraph):
            return self._convert_paragraph(content)
        elif isinstance(content, Table):
            return self._table_converter.convert(content)
        else:
            return ""

    def _convert_paragraph(self, para: Paragraph) -> str:
        """Convert a paragraph with numbering support.

        Args:
            para: Paragraph element

        Returns:
            Text representation
        """
        # Update numbering counters and get prefix
        prefix_info = self._get_numbering_prefix(para)

        # Get list indentation if enabled
        list_indent_spaces = 0
        if self.config.preserve_list_indentation:
            list_indent_spaces = self._get_list_indentation_spaces(para)

        # Create paragraph-specific converter with numbering info
        converter = ParagraphToTextConverter(
            use_markdown=self.config.formatting == "markdown",
            hyperlink_urls=self.hyperlink_urls,
            numbering_prefixes={prefix_info[0]: (prefix_info[1], prefix_info[2])}
            if prefix_info[0]
            else {},
            list_indent_spaces=list_indent_spaces,
        )

        return converter.convert(para)

    def _get_list_indentation_spaces(self, para: Paragraph) -> int:
        """Get list indentation as number of spaces.

        Args:
            para: Paragraph element

        Returns:
            Number of spaces for indentation
        """
        if not para.p_pr or not para.p_pr.num_pr:
            return 0

        num_pr = para.p_pr.num_pr
        if num_pr.num_id is None or num_pr.ilvl is None:
            return 0

        # Get level definition
        level = self._numbering_tracker.get_level(num_pr.num_id, num_pr.ilvl)
        if level is None or level.p_pr is None:
            return 0

        # Extract left indentation from level's paragraph properties
        p_pr = level.p_pr
        if isinstance(p_pr, dict) and "left" in p_pr:
            left_twips = p_pr["left"]
            if isinstance(left_twips, (int, float)):
                # Convert twips to spaces
                # 720 twips = 0.5 inch ≈ 4 spaces (standard indent)
                # Using ~180 twips per space
                return max(0, int(left_twips / 180))

        return 0

    def _get_numbering_prefix(self, para: Paragraph) -> tuple[tuple[int, int] | None, str, str]:
        """Get numbering prefix for paragraph.

        Args:
            para: Paragraph element

        Returns:
            Tuple of (key, prefix, suffix) or (None, "", "")
        """
        if not para.p_pr or not para.p_pr.num_pr:
            return (None, "", "")

        num_pr = para.p_pr.num_pr
        if num_pr.num_id is None or num_pr.ilvl is None:
            return (None, "", "")

        key = (num_pr.num_id, num_pr.ilvl)
        ilvl = num_pr.ilvl
        num_id = num_pr.num_id

        # Get format from numbering definitions
        num_fmt = "decimal"
        lvl_text = f"%{ilvl + 1}."
        suff = "\t"
        abstract_def = None

        if self.numbering:
            # Find the numbering instance and abstract definition
            for num_instance in self.numbering.num:
                if num_instance.num_id == num_id:
                    for abstract in self.numbering.abstract_num:
                        if abstract.abstract_num_id == num_instance.abstract_num_id:
                            abstract_def = abstract
                            # Find the level
                            for level in abstract.lvl:
                                if level.ilvl == ilvl:
                                    num_fmt = level.num_fmt or "decimal"
                                    lvl_text = level.lvl_text or f"%{ilvl + 1}."
                                    suff = level.suff or "tab"
                                    break
                            break
                    break

        # Reset counters for deeper levels when we go back to a shallower level
        for counter_key in list(self._numbering_counters.keys()):
            if counter_key[0] == num_id and counter_key[1] > ilvl:
                del self._numbering_counters[counter_key]

        # Increment counter for current level
        current = self._numbering_counters.get(key, 0) + 1
        self._numbering_counters[key] = current

        # Format the prefix
        if num_fmt == "bullet":
            prefix = lvl_text if lvl_text else "•"
        else:
            from .numbering_to_text import apply_level_text

            # Build counters dict and num_fmts dict for all levels
            counters: dict[int, int] = {}
            num_fmts: dict[int, str] = {}

            for level_idx in range(10):
                level_key = (num_id, level_idx)
                if level_key in self._numbering_counters:
                    counters[level_idx] = self._numbering_counters[level_key]

                # Get num_fmt for each level from abstract definition
                if abstract_def:
                    for level in abstract_def.lvl:
                        if level.ilvl == level_idx:
                            num_fmts[level_idx] = level.num_fmt or "decimal"
                            break

            # Make sure current level is in counters
            counters[ilvl] = current
            num_fmts[ilvl] = num_fmt

            # Use apply_level_text to handle all placeholders
            prefix = apply_level_text(lvl_text, counters, num_fmts)

        # Get suffix
        if suff == "tab":
            suffix = "\t"
        elif suff == "space":
            suffix = " "
        else:
            suffix = ""

        return (key, prefix, suffix)
