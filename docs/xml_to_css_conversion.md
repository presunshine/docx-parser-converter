# DOCX XML to CSS Conversion Reference

This document provides a comprehensive mapping of DOCX XML elements to their CSS equivalents used in HTML output. The converter uses CSS inline styles by default (`use_semantic_tags=False`) for maximum styling fidelity.

## Conversion Types

- **Direct**: CSS property is a direct equivalent of the DOCX property
- **Approximate**: CSS property approximates the DOCX property (no exact CSS equivalent exists)
- **Computed**: Value requires calculation or transformation

---

## Run Properties (`<w:rPr>`)

### Text Formatting

| XML Element | XML Attribute | CSS Property | CSS Value | Type | Notes |
|-------------|---------------|--------------|-----------|------|-------|
| `<w:b/>` | - | `font-weight` | `bold` | Direct | Bold text |
| `<w:b w:val="false"/>` | `@val="false"` | `font-weight` | `normal` | Direct | Explicitly not bold |
| `<w:i/>` | - | `font-style` | `italic` | Direct | Italic text |
| `<w:i w:val="false"/>` | `@val="false"` | `font-style` | `normal` | Direct | Explicitly not italic |
| `<w:strike/>` | - | `text-decoration` | `line-through` | Direct | Single strikethrough |
| `<w:dstrike/>` | - | `text-decoration` | `line-through double` | Direct | Double strikethrough |
| `<w:caps/>` | - | `text-transform` | `uppercase` | Direct | All caps |
| `<w:smallCaps/>` | - | `font-variant` | `small-caps` | Direct | Small caps |
| `<w:vanish/>` | - | `display` | `none` | Direct | Hidden text |
| `<w:vertAlign w:val="superscript"/>` | `@val` | `vertical-align` | `super` | Direct | Superscript |
| `<w:vertAlign w:val="superscript"/>` | `@val` | `font-size` | `smaller` | Direct | (combined with above) |
| `<w:vertAlign w:val="subscript"/>` | `@val` | `vertical-align` | `sub` | Direct | Subscript |
| `<w:vertAlign w:val="subscript"/>` | `@val` | `font-size` | `smaller` | Direct | (combined with above) |

### Underline Styles

| XML Element | `@w:val` Value | CSS `text-decoration` | CSS `text-decoration-thickness` | Type | Notes |
|-------------|----------------|----------------------|--------------------------------|------|-------|
| `<w:u w:val="single"/>` | `single` | `underline` | - | Direct | Standard underline |
| `<w:u w:val="double"/>` | `double` | `underline double` | - | Direct | Double underline |
| `<w:u w:val="dotted"/>` | `dotted` | `underline dotted` | - | Direct | Dotted underline |
| `<w:u w:val="dash"/>` | `dash` | `underline dashed` | - | Direct | Dashed underline |
| `<w:u w:val="wave"/>` | `wave` | `underline wavy` | - | Direct | Wavy underline |
| `<w:u w:val="thick"/>` | `thick` | `underline` | `2.5px` | Approximate | Thick single line |
| `<w:u w:val="dottedHeavy"/>` | `dottedHeavy` | `underline dotted` | `2.5px` | Approximate | Thick dotted |
| `<w:u w:val="dashedHeavy"/>` | `dashedHeavy` | `underline dashed` | `2.5px` | Approximate | Thick dashed |
| `<w:u w:val="dashLong"/>` | `dashLong` | `underline dashed` | - | Approximate | Long dashes (no CSS equivalent) |
| `<w:u w:val="dashLongHeavy"/>` | `dashLongHeavy` | `underline dashed` | `2.5px` | Approximate | Thick long dashes |
| `<w:u w:val="dotDash"/>` | `dotDash` | `underline dashed` | - | Approximate | Dot-dash pattern |
| `<w:u w:val="dashDotHeavy"/>` | `dashDotHeavy` | `underline dashed` | `2.5px` | Approximate | Thick dot-dash |
| `<w:u w:val="dotDotDash"/>` | `dotDotDash` | `underline dashed` | - | Approximate | Dot-dot-dash pattern |
| `<w:u w:val="dashDotDotHeavy"/>` | `dashDotDotHeavy` | `underline dashed` | `2.5px` | Approximate | Thick dot-dot-dash |
| `<w:u w:val="wavyHeavy"/>` | `wavyHeavy` | `underline wavy` | `2.5px` | Approximate | Thick wavy |
| `<w:u w:val="wavyDouble"/>` | `wavyDouble` | `underline wavy` | - | Approximate | Double wavy (no CSS equivalent) |
| `<w:u w:val="words"/>` | `words` | `underline` | - | Approximate | Underline words only (CSS underlines all) |

### Underline Color

| XML Element | XML Attribute | CSS Property | CSS Value | Type | Notes |
|-------------|---------------|--------------|-----------|------|-------|
| `<w:u w:color="FF0000"/>` | `@color` (hex RGB) | `text-decoration-color` | `#{color}` | Direct | Underline color |
| `<w:u w:themeColor="accent1"/>` | `@themeColor` | - | Not supported | - | Theme-based underline color (requires theme resolution) |

**Example:**
```xml
<w:u w:val="single" w:color="0000FF"/>
```
Produces:
```css
text-decoration: underline; text-decoration-color: #0000FF;
```

### Font Properties

| XML Element | XML Attribute | CSS Property | CSS Value | Type | Notes |
|-------------|---------------|--------------|-----------|------|-------|
| `<w:sz w:val="24"/>` | `@val` (half-points) | `font-size` | `{val/2}pt` | Computed | Font size (val is in half-points) |
| `<w:rFonts w:ascii="Arial"/>` | `@ascii` | `font-family` | `'{font-name}'` | Direct | Font family (quoted if has spaces) |
| `<w:rFonts w:hAnsi="Arial"/>` | `@hAnsi` | `font-family` | `'{font-name}'` | Direct | High ANSI font |
| `<w:rFonts w:eastAsia="..."/>` | `@eastAsia` | `font-family` | `'{font-name}'` | Direct | East Asian font |
| `<w:color w:val="FF0000"/>` | `@val` | `color` | `#{val}` | Direct | Text color (hex RGB) |
| `<w:color w:themeColor="..."/>` | `@themeColor` | `color` | Resolved from theme | Computed | Theme-based color |
| `<w:highlight w:val="yellow"/>` | `@val` | `background-color` | Color from map | Direct | Highlight color |
| `<w:shd w:fill="FFFF00"/>` | `@fill` | `background-color` | `#{fill}` | Direct | Background shading |

### Highlight Color Mapping

| `@w:val` | CSS `background-color` |
|----------|----------------------|
| `yellow` | `#ffff00` |
| `green` | `#00ff00` |
| `cyan` | `#00ffff` |
| `magenta` | `#ff00ff` |
| `blue` | `#0000ff` |
| `red` | `#ff0000` |
| `darkBlue` | `#000080` |
| `darkCyan` | `#008080` |
| `darkGreen` | `#008000` |
| `darkMagenta` | `#800080` |
| `darkRed` | `#800000` |
| `darkYellow` | `#808000` |
| `darkGray` | `#808080` |
| `lightGray` | `#c0c0c0` |
| `black` | `#000000` |
| `white` | `#ffffff` |

---

## Paragraph Properties (`<w:pPr>`)

### Alignment

| XML Element | `@w:val` | CSS Property | CSS Value | Type | Notes |
|-------------|----------|--------------|-----------|------|-------|
| `<w:jc w:val="left"/>` | `left` | `text-align` | `left` | Direct | Left alignment |
| `<w:jc w:val="center"/>` | `center` | `text-align` | `center` | Direct | Center alignment |
| `<w:jc w:val="right"/>` | `right` | `text-align` | `right` | Direct | Right alignment |
| `<w:jc w:val="both"/>` | `both` | `text-align` | `justify` | Direct | Justified |
| `<w:jc w:val="distribute"/>` | `distribute` | `text-align` | `justify` | Approximate | Distributed (approximated as justify) |

### Indentation

| XML Element | XML Attribute | CSS Property | CSS Value | Type | Notes |
|-------------|---------------|--------------|-----------|------|-------|
| `<w:ind w:left="720"/>` | `@left` (twips) | `margin-left` | `{twips/20}pt` | Computed | Left indent |
| `<w:ind w:right="720"/>` | `@right` (twips) | `margin-right` | `{twips/20}pt` | Computed | Right indent |
| `<w:ind w:firstLine="720"/>` | `@firstLine` (twips) | `text-indent` | `{twips/20}pt` | Computed | First line indent |
| `<w:ind w:hanging="720"/>` | `@hanging` (twips) | `text-indent` | `-{twips/20}pt` | Computed | Hanging indent (negative) |

### Spacing

| XML Element | XML Attribute | CSS Property | CSS Value | Type | Notes |
|-------------|---------------|--------------|-----------|------|-------|
| `<w:spacing w:before="240"/>` | `@before` (twips) | `margin-top` | `{twips/20}pt` | Computed | Space before paragraph |
| `<w:spacing w:after="240"/>` | `@after` (twips) | `margin-bottom` | `{twips/20}pt` | Computed | Space after paragraph |
| `<w:spacing w:line="360"/>` | `@line` (twips) | `line-height` | `{line/240}` | Computed | Line spacing (ratio) |
| `<w:spacing w:lineRule="auto"/>` | `@lineRule="auto"` | `line-height` | `{line/240}` | Computed | Auto = multiply by 1/240 |
| `<w:spacing w:lineRule="exact"/>` | `@lineRule="exact"` | `line-height` | `{line/20}pt` | Computed | Exact = twips to points |
| `<w:spacing w:lineRule="atLeast"/>` | `@lineRule="atLeast"` | `line-height` | `{line/20}pt` | Approximate | At least (CSS has no "at least") |

### Borders

| XML Element | CSS Property | Type | Notes |
|-------------|--------------|------|-------|
| `<w:pBdr><w:top .../>` | `border-top` | Direct | Top border |
| `<w:pBdr><w:bottom .../>` | `border-bottom` | Direct | Bottom border |
| `<w:pBdr><w:left .../>` | `border-left` | Direct | Left border |
| `<w:pBdr><w:right .../>` | `border-right` | Direct | Right border |
| `<w:pBdr><w:between .../>` | (not supported) | - | Between paragraphs |

### Border Style Mapping

| `@w:val` | CSS `border-style` | Type |
|----------|-------------------|------|
| `single` | `solid` | Direct |
| `double` | `double` | Direct |
| `dotted` | `dotted` | Direct |
| `dashed` | `dashed` | Direct |
| `dotDash` | `dashed` | Approximate |
| `dotDotDash` | `dashed` | Approximate |
| `triple` | `double` | Approximate |
| `thinThickSmallGap` | `double` | Approximate |
| `thickThinSmallGap` | `double` | Approximate |
| `wave` | `solid` | Approximate |
| `none` | `none` | Direct |
| `nil` | `none` | Direct |

---

## Table Properties

### Table-Level (`<w:tblPr>`)

| XML Element | CSS Property | Type | Notes |
|-------------|--------------|------|-------|
| `<w:tblW w:w="5000" w:type="pct"/>` | `width` | Computed | Table width |
| `<w:jc w:val="center"/>` | `margin-left: auto; margin-right: auto` | Direct | Center table |
| `<w:tblLayout w:type="fixed"/>` | `table-layout: fixed` | Direct | Fixed layout |
| `<w:tblCellSpacing>` | `border-spacing` | Direct | Cell spacing |
| `<w:shd w:fill="E0E0E0"/>` | `background-color` | Direct | Table background |

### Table Borders (`<w:tblBorders>`)

Table-level borders are applied to **cells**, not the `<table>` element, to allow cell-level overrides (`tcBorders`) to work correctly. This matches Microsoft Word's behavior.

| XML Element | Applied To | CSS Property | Notes |
|-------------|------------|--------------|-------|
| `<w:top .../>` | First row cells | `border-top` | Top edge of table |
| `<w:bottom .../>` | Last row cells | `border-bottom` | Bottom edge of table |
| `<w:left .../>` | First column cells | `border-left` | Left edge of table |
| `<w:right .../>` | Last column cells | `border-right` | Right edge of table |
| `<w:insideH .../>` | Non-last-row cells | `border-bottom` | Horizontal lines between rows |
| `<w:insideV .../>` | Non-last-column cells | `border-right` | Vertical lines between columns |

**Border Precedence**: Cell-level borders (`tcBorders`) always override table-level borders (`tblBorders`). If a cell explicitly sets `border-top: none`, it will NOT have a top border even if the table's `tblBorders` specifies one.

**Example - Full Grid Table:**
```xml
<w:tblBorders>
  <w:top w:val="single" w:sz="4" w:color="000000"/>
  <w:bottom w:val="single" w:sz="4" w:color="000000"/>
  <w:left w:val="single" w:sz="4" w:color="000000"/>
  <w:right w:val="single" w:sz="4" w:color="000000"/>
  <w:insideH w:val="single" w:sz="4" w:color="000000"/>
  <w:insideV w:val="single" w:sz="4" w:color="000000"/>
</w:tblBorders>
```

This produces a table with all borders. Each cell receives:
- First row cells: `border-top` (from `top`)
- Last row cells: `border-bottom` (from `bottom`)
- First column cells: `border-left` (from `left`)
- Last column cells: `border-right` (from `right`)
- Non-last-row cells: `border-bottom` (from `insideH`)
- Non-last-column cells: `border-right` (from `insideV`)

### Cell-Level (`<w:tcPr>`)

| XML Element | CSS Property | Type | Notes |
|-------------|--------------|------|-------|
| `<w:tcW w:w="2880"/>` | `width` | Computed | Cell width |
| `<w:vAlign w:val="center"/>` | `vertical-align` | Direct | Vertical alignment |
| `<w:shd w:fill="FFFF00"/>` | `background-color` | Direct | Cell background |
| `<w:tcBorders>` | `border-*` | Direct | Cell borders (overrides table borders) |
| `<w:gridSpan w:val="2"/>` | `colspan` attribute | Direct | Column span |
| `<w:vMerge w:val="restart"/>` | `rowspan` attribute | Direct | Row span start |

### Cell Borders (`<w:tcBorders>`)

Cell-level borders override any table-level border settings:

| XML Element | CSS Property | Notes |
|-------------|--------------|-------|
| `<w:top .../>` | `border-top` | Overrides table `top` or `insideH` |
| `<w:bottom .../>` | `border-bottom` | Overrides table `bottom` or `insideH` |
| `<w:left .../>` | `border-left` | Overrides table `left` or `insideV` |
| `<w:right .../>` | `border-right` | Overrides table `right` or `insideV` |

**Example - Cell with No Borders:**
```xml
<w:tcBorders>
  <w:top w:val="nil"/>
  <w:bottom w:val="nil"/>
  <w:left w:val="nil"/>
  <w:right w:val="nil"/>
</w:tcBorders>
```
Produces: `border-top: none; border-bottom: none; border-left: none; border-right: none`

This cell will have no borders even if the table has `tblBorders` defined.

---

## Unit Conversions

| DOCX Unit | Conversion | CSS Unit |
|-----------|------------|----------|
| Twips | ÷ 20 | Points (pt) |
| Half-points | ÷ 2 | Points (pt) |
| Eighths of a point | ÷ 8 | Points (pt) |
| EMUs | ÷ 914400 | Inches (in) |
| Fifths of a percent | ÷ 50 | Percent (%) |
| Percent (pct, w:type="pct") | ÷ 50 | Percent (%) |
| Dxa (twentieths of a point) | ÷ 20 | Points (pt) |

---

## Configuration Options

### `use_semantic_tags` (default: `False`)

When `True`, uses semantic HTML tags instead of CSS spans:

| Formatting | CSS Output (`False`) | Semantic Output (`True`) |
|------------|---------------------|-------------------------|
| Bold | `<span style="font-weight: bold">` | `<strong>` |
| Italic | `<span style="font-style: italic">` | `<em>` |
| Strikethrough | `<span style="text-decoration: line-through">` | `<del>` |
| Subscript | `<span style="vertical-align: sub">` | `<sub>` |
| Superscript | `<span style="vertical-align: super">` | `<sup>` |

**Note**: Double strikethrough always uses CSS (`text-decoration: line-through double`) even when `use_semantic_tags=True` to preserve the "double" styling information.

---

## Limitations and Approximations

### No Direct CSS Equivalent

These DOCX features have no direct CSS equivalent and use approximations:

| DOCX Feature | Approximation | Notes |
|--------------|---------------|-------|
| Underline "words only" | Regular underline | CSS underlines all text including spaces |
| Dot-dash patterns | `dashed` | CSS has no dot-dash patterns |
| Double wavy underline | `wavy` | CSS has no double-wavy |
| "At least" line spacing | Exact value | CSS has no minimum line-height |
| Distribute alignment | `justify` | Similar but not identical |
| Complex border patterns | Closest match | Many DOCX patterns have no CSS equivalent |

### Browser Support Notes

- `text-decoration-thickness` requires modern browsers (Chrome 89+, Firefox 70+, Safari 12.1+)
- `text-decoration-color` is well-supported in modern browsers (Chrome 57+, Firefox 36+, Safari 12.1+)
- `text-decoration-style: wavy` is well-supported in modern browsers
- Font features like `font-variant: small-caps` may render differently across browsers
