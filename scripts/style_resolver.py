#!/usr/bin/env python3
"""
style_resolver.py - CSS parsing and computed style resolution

Parses CSS from <style> blocks and resolves computed styles for elements,
combining CSS class rules with inline styles.

Usage:
    from style_resolver import StyleResolver

    resolver = StyleResolver(html_content)
    computed = resolver.get_computed_styles(element)
"""

import re
from dataclasses import dataclass, field
from typing import Any


@dataclass
class CSSRule:
    """A single CSS rule with selector and properties."""

    selector: str
    properties: dict[str, str] = field(default_factory=dict)


class StyleResolver:
    """
    Resolves computed styles for HTML elements.

    Parses CSS from <style> blocks and combines with inline styles
    to determine final computed values.
    """

    def __init__(self, html_content: str):
        """
        Initialize with HTML content.

        Args:
            html_content: Full HTML document string
        """
        self.html_content = html_content
        self.css_rules: dict[str, dict[str, str]] = {}
        self._parse_style_blocks()

    def _parse_style_blocks(self) -> None:
        """Extract and parse all <style> blocks from HTML."""
        style_pattern = re.compile(
            r"<style[^>]*>(.*?)</style>", re.DOTALL | re.IGNORECASE
        )

        for match in style_pattern.finditer(self.html_content):
            css_content = match.group(1)
            self._parse_css(css_content)

    def _parse_css(self, css_content: str) -> None:
        """
        Parse CSS content into rules.

        Args:
            css_content: Raw CSS string
        """
        # Remove comments
        css_content = re.sub(r"/\*.*?\*/", "", css_content, flags=re.DOTALL)

        # Match CSS rules: selector { properties }
        rule_pattern = re.compile(r"([^{]+)\{([^}]*)\}", re.DOTALL)

        for match in rule_pattern.finditer(css_content):
            selector = match.group(1).strip()
            properties_str = match.group(2).strip()

            properties = self._parse_properties(properties_str)

            # Handle multiple selectors (comma-separated)
            for sel in selector.split(","):
                sel = sel.strip()
                if sel:
                    # Store by selector
                    if sel not in self.css_rules:
                        self.css_rules[sel] = {}
                    self.css_rules[sel].update(properties)

    def _parse_properties(self, properties_str: str) -> dict[str, str]:
        """
        Parse CSS property declarations.

        Args:
            properties_str: String like "color: red; font-size: 12pt;"

        Returns:
            Dict of property names to values
        """
        properties = {}

        # Split by semicolon, handling edge cases
        for declaration in properties_str.split(";"):
            declaration = declaration.strip()
            if ":" in declaration:
                # Split only on first colon (value might contain colons)
                prop, value = declaration.split(":", 1)
                prop = prop.strip().lower()
                value = value.strip()
                if prop and value:
                    properties[prop] = value

        return properties

    def parse_inline_style(self, style_attr: str | None) -> dict[str, str]:
        """
        Parse inline style attribute.

        Args:
            style_attr: Value of style attribute, e.g., "color: red; font-size: 12pt"

        Returns:
            Dict of property names to values
        """
        if not style_attr:
            return {}
        return self._parse_properties(style_attr)

    def get_matching_rules(
        self, element_tag: str, class_names: list[str], element_id: str | None = None
    ) -> dict[str, str]:
        """
        Get CSS rules matching an element.

        Args:
            element_tag: Tag name (e.g., "p", "span")
            class_names: List of class names
            element_id: Optional ID attribute

        Returns:
            Dict of matching CSS properties
        """
        matched = {}

        # Check tag selector
        if element_tag in self.css_rules:
            matched.update(self.css_rules[element_tag])

        # Check class selectors
        for class_name in class_names:
            # .classname
            class_selector = f".{class_name}"
            if class_selector in self.css_rules:
                matched.update(self.css_rules[class_selector])

            # tag.classname
            tag_class_selector = f"{element_tag}.{class_name}"
            if tag_class_selector in self.css_rules:
                matched.update(self.css_rules[tag_class_selector])

        # Check ID selector
        if element_id:
            id_selector = f"#{element_id}"
            if id_selector in self.css_rules:
                matched.update(self.css_rules[id_selector])

        return matched

    def get_computed_styles(
        self,
        element_tag: str,
        class_attr: str | None = None,
        style_attr: str | None = None,
        element_id: str | None = None,
    ) -> dict[str, str]:
        """
        Get computed styles for an element.

        Combines CSS rules and inline styles, with inline taking precedence.

        Args:
            element_tag: Tag name
            class_attr: Class attribute value (space-separated)
            style_attr: Inline style attribute value
            element_id: ID attribute value

        Returns:
            Dict of computed style properties
        """
        # Parse class names
        class_names = class_attr.split() if class_attr else []

        # Get CSS rule properties
        computed = self.get_matching_rules(element_tag, class_names, element_id)

        # Apply inline styles (override CSS rules)
        inline = self.parse_inline_style(style_attr)
        computed.update(inline)

        return computed


def normalize_style_value(property_name: str, value: str) -> str:
    """
    Normalize a CSS property value for comparison.

    Handles variations like:
    - "bold" vs "700" for font-weight
    - "#ff0000" vs "red" vs "rgb(255,0,0)" for colors
    - "12pt" vs "16px" for sizes (approximate)

    Args:
        property_name: CSS property name
        value: CSS property value

    Returns:
        Normalized value string
    """
    value = value.strip().lower()

    # Font weight normalization
    if property_name == "font-weight":
        weight_map = {
            "normal": "400",
            "bold": "700",
            "lighter": "300",
            "bolder": "700",
        }
        return weight_map.get(value, value)

    # Font style normalization
    if property_name == "font-style":
        return value  # italic, normal, oblique - keep as-is

    # Color normalization (basic)
    if property_name in ("color", "background-color", "border-color"):
        # Named colors to hex (common ones)
        color_map = {
            "red": "#ff0000",
            "green": "#008000",
            "lime": "#00ff00",
            "blue": "#0000ff",
            "black": "#000000",
            "white": "#ffffff",
            "yellow": "#ffff00",
            "orange": "#ffa500",
            "purple": "#800080",
            "gray": "#808080",
            "grey": "#808080",
            "cyan": "#00ffff",
            "magenta": "#ff00ff",
        }
        if value in color_map:
            return color_map[value]

        # Normalize hex colors to lowercase 6-digit
        if value.startswith("#"):
            hex_val = value[1:]
            if len(hex_val) == 3:
                hex_val = "".join(c * 2 for c in hex_val)
            return f"#{hex_val.lower()}"

        # RGB to hex
        rgb_match = re.match(r"rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)", value)
        if rgb_match:
            r, g, b = (
                int(rgb_match.group(1)),
                int(rgb_match.group(2)),
                int(rgb_match.group(3)),
            )
            return f"#{r:02x}{g:02x}{b:02x}"

        return value

    # Text decoration normalization
    if property_name == "text-decoration":
        # Normalize compound values
        parts = value.split()
        # Sort for consistent comparison
        return " ".join(sorted(parts))

    # Font family normalization
    if property_name == "font-family":
        # Remove quotes, normalize spacing
        value = re.sub(r'["\']', "", value)
        return value.strip()

    # Line height normalization
    if property_name == "line-height":
        # Strip trailing zeros: "1.50" -> "1.5", "2.00" -> "2"
        try:
            num_val = float(value)
            if num_val == int(num_val):
                return str(int(num_val))
            else:
                return f"{num_val:g}"  # Removes trailing zeros
        except ValueError:
            return value

    return value


def compare_style_values(property_name: str, expected: str, actual: str) -> bool:
    """
    Compare two style values, accounting for equivalent representations.

    Args:
        property_name: CSS property name
        expected: Expected value
        actual: Actual value

    Returns:
        True if values are equivalent
    """
    norm_expected = normalize_style_value(property_name, expected)
    norm_actual = normalize_style_value(property_name, actual)

    return norm_expected == norm_actual


def compare_styles(expected: dict[str, str], actual: dict[str, str]) -> dict[str, Any]:
    """
    Compare expected vs actual style dictionaries.

    Args:
        expected: Expected style properties
        actual: Actual computed styles

    Returns:
        {
            "match": bool,
            "missing": [properties in expected but not actual],
            "different": {prop: {"expected": x, "actual": y}},
            "extra": [properties in actual but not expected]
        }
    """
    result = {"match": True, "missing": [], "different": {}, "extra": []}

    # Check expected properties
    for prop, expected_val in expected.items():
        if prop not in actual:
            result["missing"].append(prop)
            result["match"] = False
        elif not compare_style_values(prop, expected_val, actual[prop]):
            result["different"][prop] = {
                "expected": expected_val,
                "actual": actual[prop],
            }
            result["match"] = False

    # Check for extra properties (informational, doesn't fail match)
    for prop in actual:
        if prop not in expected:
            result["extra"].append(prop)

    return result


# Convenience function for quick style extraction
def extract_styles_from_html_element(
    html_element: str, full_html: str
) -> dict[str, str]:
    """
    Extract computed styles for an HTML element string.

    Args:
        html_element: Single HTML element string, e.g., '<p class="p-1" style="color:red">text</p>'
        full_html: Full HTML document (for <style> block)

    Returns:
        Dict of computed styles
    """
    resolver = StyleResolver(full_html)

    # Parse the element
    tag_match = re.match(r"<(\w+)([^>]*)>", html_element)
    if not tag_match:
        return {}

    tag_name = tag_match.group(1)
    attrs_str = tag_match.group(2)

    # Extract attributes
    # Note: style values can contain quotes (e.g., font-family: 'Times New Roman')
    class_match = re.search(r'class\s*=\s*["\']([^"\']*)["\']', attrs_str)
    # Handle style with either double or single quotes, allowing inner quotes of the other type
    style_match = re.search(r'style\s*=\s*"([^"]*)"', attrs_str)
    if not style_match:
        style_match = re.search(r"style\s*=\s*'([^']*)'", attrs_str)
    id_match = re.search(r'id\s*=\s*["\']([^"\']*)["\']', attrs_str)

    class_attr = class_match.group(1) if class_match else None
    style_attr = style_match.group(1) if style_match else None
    element_id = id_match.group(1) if id_match else None

    return resolver.get_computed_styles(tag_name, class_attr, style_attr, element_id)


if __name__ == "__main__":
    # Quick test
    test_html = """
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            .bold { font-weight: bold; }
            .red { color: #ff0000; }
            p.special { font-size: 18pt; text-align: center; }
        </style>
    </head>
    <body>
        <p class="bold red special" style="margin-top: 10px;">Test</p>
    </body>
    </html>
    """

    resolver = StyleResolver(test_html)
    computed = resolver.get_computed_styles(
        "p", "bold red special", "margin-top: 10px;"
    )

    print("Computed styles:")
    for prop, val in sorted(computed.items()):
        print(f"  {prop}: {val}")

    # Test comparison
    expected = {
        "font-weight": "bold",
        "color": "red",  # Should match #ff0000
        "font-size": "18pt",
    }

    result = compare_styles(expected, computed)
    print(f"\nComparison result: {'PASS' if result['match'] else 'FAIL'}")
    if result["different"]:
        print(f"  Different: {result['different']}")
    if result["missing"]:
        print(f"  Missing: {result['missing']}")
