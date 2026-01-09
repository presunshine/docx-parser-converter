/**
 * Type definitions for DOCX models.
 *
 * This module contains all literal types (enums) used across the models.
 * Based on the OOXML specification and matching Python implementation.
 */

// =============================================================================
// Justification and Alignment
// =============================================================================

/** Paragraph and table justification. */
export type JustificationType = 'left' | 'center' | 'right' | 'both' | 'distribute' | 'start' | 'end';

/** Vertical alignment for table cells. */
export type VAlignType = 'top' | 'center' | 'bottom';

/** Vertical alignment for text (run properties). */
export type VertAlignType = 'baseline' | 'superscript' | 'subscript';

/** Text direction in a paragraph or cell. */
export type TextDirectionType = 'lrTb' | 'tbRl' | 'btLr' | 'lrTbV' | 'tbRlV' | 'tbLrV';

// =============================================================================
// Spacing and Sizing
// =============================================================================

/** Line spacing rule. */
export type LineRuleType = 'auto' | 'exact' | 'atLeast';

/** Width type for tables and cells. */
export type WidthType = 'dxa' | 'pct' | 'auto' | 'nil';

/** Height rule for table rows. */
export type HeightRuleType = 'auto' | 'exact' | 'atLeast';

// =============================================================================
// Borders
// =============================================================================

/** Border style values. */
export type BorderStyleType =
  | 'nil'
  | 'none'
  | 'single'
  | 'thick'
  | 'double'
  | 'dotted'
  | 'dashed'
  | 'dotDash'
  | 'dotDotDash'
  | 'triple'
  | 'thinThickSmallGap'
  | 'thickThinSmallGap'
  | 'thinThickThinSmallGap'
  | 'thinThickMediumGap'
  | 'thickThinMediumGap'
  | 'thinThickThinMediumGap'
  | 'thinThickLargeGap'
  | 'thickThinLargeGap'
  | 'thinThickThinLargeGap'
  | 'wave'
  | 'doubleWave'
  | 'dashSmallGap'
  | 'dashDotStroked'
  | 'threeDEmboss'
  | 'threeDEngrave'
  | 'outset'
  | 'inset';

// =============================================================================
// Shading
// =============================================================================

/** Shading pattern values. */
export type ShadingPatternType =
  | 'clear'
  | 'solid'
  | 'nil'
  | 'horzStripe'
  | 'vertStripe'
  | 'reverseDiagStripe'
  | 'diagStripe'
  | 'horzCross'
  | 'diagCross'
  | 'thinHorzStripe'
  | 'thinVertStripe'
  | 'thinReverseDiagStripe'
  | 'thinDiagStripe'
  | 'thinHorzCross'
  | 'thinDiagCross'
  | 'pct5'
  | 'pct10'
  | 'pct12'
  | 'pct15'
  | 'pct20'
  | 'pct25'
  | 'pct30'
  | 'pct35'
  | 'pct37'
  | 'pct40'
  | 'pct45'
  | 'pct50'
  | 'pct55'
  | 'pct60'
  | 'pct62'
  | 'pct65'
  | 'pct70'
  | 'pct75'
  | 'pct80'
  | 'pct85'
  | 'pct87'
  | 'pct90'
  | 'pct95';

// =============================================================================
// Colors
// =============================================================================

/** Theme color identifiers. */
export type ThemeColorType =
  | 'dark1'
  | 'light1'
  | 'dark2'
  | 'light2'
  | 'accent1'
  | 'accent2'
  | 'accent3'
  | 'accent4'
  | 'accent5'
  | 'accent6'
  | 'hyperlink'
  | 'followedHyperlink'
  | 'background1'
  | 'text1'
  | 'background2'
  | 'text2';

/** Highlight (background) color names. */
export type HighlightType =
  | 'black'
  | 'blue'
  | 'cyan'
  | 'darkBlue'
  | 'darkCyan'
  | 'darkGray'
  | 'darkGreen'
  | 'darkMagenta'
  | 'darkRed'
  | 'darkYellow'
  | 'green'
  | 'lightGray'
  | 'magenta'
  | 'none'
  | 'red'
  | 'white'
  | 'yellow';

// =============================================================================
// Underline
// =============================================================================

/** Underline style values. */
export type UnderlineType =
  | 'none'
  | 'single'
  | 'words'
  | 'double'
  | 'thick'
  | 'dotted'
  | 'dottedHeavy'
  | 'dash'
  | 'dashedHeavy'
  | 'dashLong'
  | 'dashLongHeavy'
  | 'dotDash'
  | 'dashDotHeavy'
  | 'dotDotDash'
  | 'dashDotDotHeavy'
  | 'wave'
  | 'wavyHeavy'
  | 'wavyDouble';

// =============================================================================
// Tabs
// =============================================================================

/** Tab stop type. */
export type TabType = 'left' | 'center' | 'right' | 'decimal' | 'bar' | 'clear' | 'num';

/** Tab leader character. */
export type TabLeaderType = 'none' | 'dot' | 'hyphen' | 'underscore' | 'heavy' | 'middleDot';

// =============================================================================
// Breaks and Special Characters
// =============================================================================

/** Break type. */
export type BreakType = 'page' | 'column' | 'textWrapping';

/** Break clear location (for textWrapping breaks). */
export type BreakClearType = 'none' | 'left' | 'right' | 'all';

// =============================================================================
// Tables
// =============================================================================

/** Table layout algorithm. */
export type TableLayoutType = 'fixed' | 'autofit';

/** Vertical merge type for table cells. */
export type VMergeType = 'restart' | 'continue';

// =============================================================================
// Sections
// =============================================================================

/** Section break type. */
export type SectionType = 'nextPage' | 'continuous' | 'evenPage' | 'oddPage' | 'nextColumn';

/** Page orientation. */
export type OrientType = 'portrait' | 'landscape';

// =============================================================================
// Fonts
// =============================================================================

/** Font hint for character classification. */
export type FontHintType = 'default' | 'eastAsia' | 'cs' | 'ascii' | 'hAnsi';

// =============================================================================
// Frames
// =============================================================================

/** Frame text wrap type. */
export type FrameWrapType = 'auto' | 'notBeside' | 'around' | 'tight' | 'through' | 'none';

/** Frame anchor location. */
export type FrameAnchorType = 'text' | 'margin' | 'page';

/** Drop cap type. */
export type DropCapType = 'none' | 'drop' | 'margin';

// =============================================================================
// Fields
// =============================================================================

/** Field character type. */
export type FieldCharType = 'begin' | 'separate' | 'end';

// =============================================================================
// Numbering
// =============================================================================

/** Numbering format type. */
export type NumFmtType =
  | 'decimal'
  | 'upperRoman'
  | 'lowerRoman'
  | 'upperLetter'
  | 'lowerLetter'
  | 'ordinal'
  | 'cardinalText'
  | 'ordinalText'
  | 'hex'
  | 'chicago'
  | 'ideographDigital'
  | 'japaneseCounting'
  | 'aiueo'
  | 'iroha'
  | 'decimalFullWidth'
  | 'decimalHalfWidth'
  | 'japaneseLegal'
  | 'japaneseDigitalTenThousand'
  | 'decimalEnclosedCircle'
  | 'decimalFullWidth2'
  | 'aiueoFullWidth'
  | 'irohaFullWidth'
  | 'decimalZero'
  | 'bullet'
  | 'ganada'
  | 'chosung'
  | 'decimalEnclosedFullstop'
  | 'decimalEnclosedParen'
  | 'decimalEnclosedCircleChinese'
  | 'ideographEnclosedCircle'
  | 'ideographTraditional'
  | 'ideographZodiac'
  | 'ideographZodiacTraditional'
  | 'taiwaneseCounting'
  | 'ideographLegalTraditional'
  | 'taiwaneseCountingThousand'
  | 'taiwaneseDigital'
  | 'chineseCounting'
  | 'chineseLegalSimplified'
  | 'chineseCountingThousand'
  | 'koreanDigital'
  | 'koreanCounting'
  | 'koreanLegal'
  | 'koreanDigital2'
  | 'vietnameseCounting'
  | 'russianLower'
  | 'russianUpper'
  | 'none'
  | 'numberInDash'
  | 'hebrew1'
  | 'hebrew2'
  | 'arabicAlpha'
  | 'arabicAbjad'
  | 'hindiVowels'
  | 'hindiConsonants'
  | 'hindiNumbers'
  | 'hindiCounting'
  | 'thaiLetters'
  | 'thaiNumbers'
  | 'thaiCounting'
  | 'bahtText'
  | 'dollarText';

/** Multi-level numbering type. */
export type MultiLevelType = 'singleLevel' | 'multilevel' | 'hybridMultilevel';

/** Level suffix type (character after number). */
export type LevelSuffixType = 'tab' | 'space' | 'nothing';

/** Level justification type. */
export type LevelJcType = 'left' | 'center' | 'right';

// =============================================================================
// Styles
// =============================================================================

/** Style type. */
export type StyleType = 'paragraph' | 'character' | 'table' | 'numbering';

/** Table style conditional formatting type. */
export type TableStyleConditionType =
  | 'wholeTable'
  | 'firstRow'
  | 'lastRow'
  | 'firstCol'
  | 'lastCol'
  | 'band1Vert'
  | 'band2Vert'
  | 'band1Horz'
  | 'band2Horz'
  | 'neCell'
  | 'nwCell'
  | 'seCell'
  | 'swCell';

// =============================================================================
// Type Arrays (for validation/testing)
// =============================================================================

/** All valid justification values. */
export const JustificationTypes: JustificationType[] = [
  'left',
  'center',
  'right',
  'both',
  'distribute',
  'start',
  'end',
];

/** All valid border style values. */
export const BorderStyleTypes: BorderStyleType[] = [
  'nil',
  'none',
  'single',
  'thick',
  'double',
  'dotted',
  'dashed',
  'dotDash',
  'dotDotDash',
  'triple',
  'thinThickSmallGap',
  'thickThinSmallGap',
  'thinThickThinSmallGap',
  'thinThickMediumGap',
  'thickThinMediumGap',
  'thinThickThinMediumGap',
  'thinThickLargeGap',
  'thickThinLargeGap',
  'thinThickThinLargeGap',
  'wave',
  'doubleWave',
  'dashSmallGap',
  'dashDotStroked',
  'threeDEmboss',
  'threeDEngrave',
  'outset',
  'inset',
];

/** All valid numbering format values. */
export const NumFmtTypes: NumFmtType[] = [
  'decimal',
  'upperRoman',
  'lowerRoman',
  'upperLetter',
  'lowerLetter',
  'ordinal',
  'cardinalText',
  'ordinalText',
  'hex',
  'chicago',
  'ideographDigital',
  'japaneseCounting',
  'aiueo',
  'iroha',
  'decimalFullWidth',
  'decimalHalfWidth',
  'japaneseLegal',
  'japaneseDigitalTenThousand',
  'decimalEnclosedCircle',
  'decimalFullWidth2',
  'aiueoFullWidth',
  'irohaFullWidth',
  'decimalZero',
  'bullet',
  'ganada',
  'chosung',
  'decimalEnclosedFullstop',
  'decimalEnclosedParen',
  'decimalEnclosedCircleChinese',
  'ideographEnclosedCircle',
  'ideographTraditional',
  'ideographZodiac',
  'ideographZodiacTraditional',
  'taiwaneseCounting',
  'ideographLegalTraditional',
  'taiwaneseCountingThousand',
  'taiwaneseDigital',
  'chineseCounting',
  'chineseLegalSimplified',
  'chineseCountingThousand',
  'koreanDigital',
  'koreanCounting',
  'koreanLegal',
  'koreanDigital2',
  'vietnameseCounting',
  'russianLower',
  'russianUpper',
  'none',
  'numberInDash',
  'hebrew1',
  'hebrew2',
  'arabicAlpha',
  'arabicAbjad',
  'hindiVowels',
  'hindiConsonants',
  'hindiNumbers',
  'hindiCounting',
  'thaiLetters',
  'thaiNumbers',
  'thaiCounting',
  'bahtText',
  'dollarText',
];

/** All valid underline type values. */
export const UnderlineTypes: UnderlineType[] = [
  'none',
  'single',
  'words',
  'double',
  'thick',
  'dotted',
  'dottedHeavy',
  'dash',
  'dashedHeavy',
  'dashLong',
  'dashLongHeavy',
  'dotDash',
  'dashDotHeavy',
  'dotDotDash',
  'dashDotDotHeavy',
  'wave',
  'wavyHeavy',
  'wavyDouble',
];
