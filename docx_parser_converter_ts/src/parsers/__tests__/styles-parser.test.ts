/**
 * Unit tests for styles parsers.
 *
 * Matches Python: tests/unit/parsers/test_styles_parser.py
 */

import { describe, it, expect } from 'vitest';

import { makeElement } from '../../__tests__/helpers/test-utils';
import {
  parseDocumentDefaults,
  parseParagraphPropertiesDefault,
  parseRunPropertiesDefault,
} from '../styles/document-defaults-parser';
import {
  parseLatentStyleException,
  parseLatentStyles,
} from '../styles/latent-styles-parser';
import { parseStyle, parseTableStyleProperties } from '../styles/style-parser';
import { parseStyles } from '../styles/styles-parser';

// =============================================================================
// LatentStyleException Parser Tests
// =============================================================================

describe('LatentStyleException Parser', () => {
  it('returns null for null input', () => {
    const result = parseLatentStyleException(null);
    expect(result).toBeNull();
  });

  it('parses minimal exception with only name', () => {
    const elem = makeElement('<w:lsdException w:name="Normal"/>');
    const result = parseLatentStyleException(elem);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('Normal');
    expect(result!.locked).toBeNull();
    expect(result!.uiPriority).toBeNull();
    expect(result!.semiHidden).toBeNull();
    expect(result!.unhideWhenUsed).toBeNull();
    expect(result!.qFormat).toBeNull();
  });

  it('parses exception with all attributes', () => {
    const elem = makeElement(`<w:lsdException
      w:name="heading 1"
      w:locked="0"
      w:uiPriority="9"
      w:semiHidden="0"
      w:unhideWhenUsed="0"
      w:qFormat="1"/>`);
    const result = parseLatentStyleException(elem);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('heading 1');
    expect(result!.locked).toBe(true); // attribute present = true
    expect(result!.uiPriority).toBe(9);
    expect(result!.semiHidden).toBe(true);
    expect(result!.unhideWhenUsed).toBe(true);
    expect(result!.qFormat).toBe(true);
  });

  it('parses hidden style exception', () => {
    const elem = makeElement(`<w:lsdException
      w:name="Placeholder Text"
      w:semiHidden="1"
      w:unhideWhenUsed="1"
      w:uiPriority="99"/>`);
    const result = parseLatentStyleException(elem);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('Placeholder Text');
    expect(result!.semiHidden).toBe(true);
    expect(result!.unhideWhenUsed).toBe(true);
    expect(result!.uiPriority).toBe(99);
  });
});

// =============================================================================
// LatentStyles Parser Tests
// =============================================================================

describe('LatentStyles Parser', () => {
  it('returns null for null input', () => {
    const result = parseLatentStyles(null);
    expect(result).toBeNull();
  });

  it('parses empty latent styles element', () => {
    const elem = makeElement('<w:latentStyles/>');
    const result = parseLatentStyles(elem);
    expect(result).not.toBeNull();
    expect(result!.defLockedState).toBeNull();
    expect(result!.defUIPriority).toBeNull();
    expect(result!.defSemiHidden).toBeNull();
    expect(result!.defUnhideWhenUsed).toBeNull();
    expect(result!.defQFormat).toBeNull();
    expect(result!.count).toBeNull();
    expect(result!.lsdException).toEqual([]);
  });

  it('parses latent styles with defaults only', () => {
    const elem = makeElement(`<w:latentStyles
      w:defLockedState="0"
      w:defUIPriority="99"
      w:defSemiHidden="0"
      w:defUnhideWhenUsed="0"
      w:defQFormat="0"
      w:count="376"/>`);
    const result = parseLatentStyles(elem);
    expect(result).not.toBeNull();
    expect(result!.defLockedState).toBe(true);
    expect(result!.defUIPriority).toBe(99);
    expect(result!.defSemiHidden).toBe(true);
    expect(result!.defUnhideWhenUsed).toBe(true);
    expect(result!.defQFormat).toBe(true);
    expect(result!.count).toBe(376);
    expect(result!.lsdException).toEqual([]);
  });

  it('parses latent styles with exceptions', () => {
    const elem = makeElement(`<w:latentStyles w:defUIPriority="99" w:count="376">
      <w:lsdException w:name="Normal" w:uiPriority="0" w:qFormat="1"/>
      <w:lsdException w:name="heading 1" w:uiPriority="9" w:qFormat="1"/>
      <w:lsdException w:name="heading 2" w:uiPriority="9" w:semiHidden="1"/>
    </w:latentStyles>`);
    const result = parseLatentStyles(elem);
    expect(result).not.toBeNull();
    expect(result!.count).toBe(376);
    expect(result!.lsdException).not.toBeNull();
    expect(result!.lsdException!.length).toBe(3);
    expect(result!.lsdException![0].name).toBe('Normal');
    expect(result!.lsdException![0].uiPriority).toBe(0);
    expect(result!.lsdException![1].name).toBe('heading 1');
    expect(result!.lsdException![2].semiHidden).toBe(true);
  });
});

// =============================================================================
// RunPropertiesDefault Parser Tests
// =============================================================================

describe('RunPropertiesDefault Parser', () => {
  it('returns null for null input', () => {
    const result = parseRunPropertiesDefault(null);
    expect(result).toBeNull();
  });

  it('parses empty run properties default', () => {
    const elem = makeElement('<w:rPrDefault/>');
    const result = parseRunPropertiesDefault(elem);
    expect(result).not.toBeNull();
    expect(result!.rPr).toBeNull();
  });

  it('parses run properties default with nested rPr', () => {
    const elem = makeElement(`<w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
        <w:sz w:val="24"/>
        <w:szCs w:val="24"/>
      </w:rPr>
    </w:rPrDefault>`);
    const result = parseRunPropertiesDefault(elem);
    expect(result).not.toBeNull();
    expect(result!.rPr).not.toBeNull();
    expect(result!.rPr!.rFonts?.ascii).toBe('Times New Roman');
    expect(result!.rPr!.sz).toBe(24);
  });

  it('parses run properties default with language settings', () => {
    const elem = makeElement(`<w:rPrDefault>
      <w:rPr>
        <w:lang w:val="en-US" w:eastAsia="ja-JP" w:bidi="ar-SA"/>
      </w:rPr>
    </w:rPrDefault>`);
    const result = parseRunPropertiesDefault(elem);
    expect(result).not.toBeNull();
    expect(result!.rPr).not.toBeNull();
    expect(result!.rPr!.lang?.val).toBe('en-US');
  });
});

// =============================================================================
// ParagraphPropertiesDefault Parser Tests
// =============================================================================

describe('ParagraphPropertiesDefault Parser', () => {
  it('returns null for null input', () => {
    const result = parseParagraphPropertiesDefault(null);
    expect(result).toBeNull();
  });

  it('parses empty paragraph properties default', () => {
    const elem = makeElement('<w:pPrDefault/>');
    const result = parseParagraphPropertiesDefault(elem);
    expect(result).not.toBeNull();
    expect(result!.pPr).toBeNull();
  });

  it('parses paragraph properties default with spacing', () => {
    const elem = makeElement(`<w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="160" w:line="259" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>`);
    const result = parseParagraphPropertiesDefault(elem);
    expect(result).not.toBeNull();
    expect(result!.pPr).not.toBeNull();
    expect(result!.pPr!.spacing?.after).toBe(160);
    expect(result!.pPr!.spacing?.line).toBe(259);
  });
});

// =============================================================================
// DocumentDefaults Parser Tests
// =============================================================================

describe('DocumentDefaults Parser', () => {
  it('returns null for null input', () => {
    const result = parseDocumentDefaults(null);
    expect(result).toBeNull();
  });

  it('parses empty document defaults', () => {
    const elem = makeElement('<w:docDefaults/>');
    const result = parseDocumentDefaults(elem);
    expect(result).not.toBeNull();
    expect(result!.rPrDefault).toBeNull();
    expect(result!.pPrDefault).toBeNull();
  });

  it('parses document defaults with run default only', () => {
    const elem = makeElement(`<w:docDefaults>
      <w:rPrDefault>
        <w:rPr>
          <w:sz w:val="22"/>
        </w:rPr>
      </w:rPrDefault>
    </w:docDefaults>`);
    const result = parseDocumentDefaults(elem);
    expect(result).not.toBeNull();
    expect(result!.rPrDefault).not.toBeNull();
    expect(result!.rPrDefault!.rPr).not.toBeNull();
    expect(result!.pPrDefault).toBeNull();
  });

  it('parses document defaults with both defaults', () => {
    const elem = makeElement(`<w:docDefaults>
      <w:rPrDefault>
        <w:rPr>
          <w:rFonts w:ascii="Calibri"/>
          <w:sz w:val="22"/>
        </w:rPr>
      </w:rPrDefault>
      <w:pPrDefault>
        <w:pPr>
          <w:spacing w:after="200" w:line="276" w:lineRule="auto"/>
        </w:pPr>
      </w:pPrDefault>
    </w:docDefaults>`);
    const result = parseDocumentDefaults(elem);
    expect(result).not.toBeNull();
    expect(result!.rPrDefault).not.toBeNull();
    expect(result!.rPrDefault!.rPr).not.toBeNull();
    expect(result!.rPrDefault!.rPr!.rFonts?.ascii).toBe('Calibri');
    expect(result!.pPrDefault).not.toBeNull();
    expect(result!.pPrDefault!.pPr).not.toBeNull();
    expect(result!.pPrDefault!.pPr!.spacing?.after).toBe(200);
  });
});

// =============================================================================
// TableStyleProperties Parser Tests
// =============================================================================

describe('TableStyleProperties Parser', () => {
  it('returns null for null input', () => {
    const result = parseTableStyleProperties(null);
    expect(result).toBeNull();
  });

  it('returns null for missing type attribute', () => {
    const elem = makeElement('<w:tblStylePr/>');
    const result = parseTableStyleProperties(elem);
    expect(result).toBeNull();
  });

  it('parses first row condition', () => {
    const elem = makeElement(`<w:tblStylePr w:type="firstRow">
      <w:rPr>
        <w:b/>
        <w:color w:val="FFFFFF"/>
      </w:rPr>
      <w:tcPr>
        <w:shd w:val="clear" w:fill="4472C4"/>
      </w:tcPr>
    </w:tblStylePr>`);
    const result = parseTableStyleProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('firstRow');
    expect(result!.rPr).not.toBeNull();
    expect(result!.rPr!.b).toBe(true);
    expect(result!.tcPr).not.toBeNull();
    expect(result!.tcPr!.shd?.fill).toBe('4472C4');
  });

  it('parses last column condition', () => {
    const elem = makeElement(`<w:tblStylePr w:type="lastCol">
      <w:rPr>
        <w:b/>
      </w:rPr>
    </w:tblStylePr>`);
    const result = parseTableStyleProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('lastCol');
    expect(result!.rPr).not.toBeNull();
    expect(result!.pPr).toBeNull();
    expect(result!.tblPr).toBeNull();
    expect(result!.trPr).toBeNull();
    expect(result!.tcPr).toBeNull();
  });

  it('parses band1 horizontal', () => {
    const elem = makeElement(`<w:tblStylePr w:type="band1Horz">
      <w:tcPr>
        <w:shd w:val="clear" w:fill="D9E2F3"/>
      </w:tcPr>
    </w:tblStylePr>`);
    const result = parseTableStyleProperties(elem);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('band1Horz');
    expect(result!.tcPr).not.toBeNull();
  });

  it('parses all condition types', () => {
    const conditionTypes = [
      'wholeTable',
      'firstRow',
      'lastRow',
      'firstCol',
      'lastCol',
      'band1Vert',
      'band2Vert',
      'band1Horz',
      'band2Horz',
      'neCell',
      'nwCell',
      'seCell',
      'swCell',
    ];
    for (const condType of conditionTypes) {
      const elem = makeElement(`<w:tblStylePr w:type="${condType}"/>`);
      const result = parseTableStyleProperties(elem);
      expect(result).not.toBeNull();
      expect(result!.type).toBe(condType);
    }
  });
});

// =============================================================================
// Style Parser Tests
// =============================================================================

describe('Style Parser', () => {
  it('returns null for null input', () => {
    const result = parseStyle(null);
    expect(result).toBeNull();
  });

  it('returns null for missing type', () => {
    const elem = makeElement('<w:style w:styleId="Normal"/>');
    const result = parseStyle(elem);
    expect(result).toBeNull();
  });

  it('returns null for missing styleId', () => {
    const elem = makeElement('<w:style w:type="paragraph"/>');
    const result = parseStyle(elem);
    expect(result).toBeNull();
  });

  it('parses minimal paragraph style', () => {
    const elem = makeElement('<w:style w:type="paragraph" w:styleId="Normal"/>');
    const result = parseStyle(elem);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('paragraph');
    expect(result!.styleId).toBe('Normal');
    expect(result!.name).toBeNull();
    expect(result!.basedOn).toBeNull();
    expect(result!.default).toBeNull();
  });

  it('parses complete paragraph style', () => {
    const elem = makeElement(`<w:style w:type="paragraph" w:styleId="Heading1" w:default="0">
      <w:name w:val="heading 1"/>
      <w:aliases w:val="H1,Heading One"/>
      <w:basedOn w:val="Normal"/>
      <w:next w:val="Normal"/>
      <w:link w:val="Heading1Char"/>
      <w:uiPriority w:val="9"/>
      <w:qFormat/>
      <w:rsid w:val="00A1B2C3"/>
      <w:pPr>
        <w:spacing w:before="240" w:after="0"/>
        <w:outlineLvl w:val="0"/>
      </w:pPr>
      <w:rPr>
        <w:b/>
        <w:sz w:val="32"/>
      </w:rPr>
    </w:style>`);
    const result = parseStyle(elem);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('paragraph');
    expect(result!.styleId).toBe('Heading1');
    expect(result!.name).toBe('heading 1');
    expect(result!.aliases).toBe('H1,Heading One');
    expect(result!.basedOn).toBe('Normal');
    expect(result!.next).toBe('Normal');
    expect(result!.link).toBe('Heading1Char');
    expect(result!.uiPriority).toBe(9);
    expect(result!.qFormat).toBe(true);
    expect(result!.rsid).toBe('00A1B2C3');
    expect(result!.pPr).not.toBeNull();
    expect(result!.rPr).not.toBeNull();
  });

  it('parses character style', () => {
    const elem = makeElement(`<w:style w:type="character" w:styleId="BoldEmphasis">
      <w:name w:val="Bold Emphasis"/>
      <w:basedOn w:val="DefaultParagraphFont"/>
      <w:uiPriority w:val="22"/>
      <w:rPr>
        <w:b/>
        <w:i/>
      </w:rPr>
    </w:style>`);
    const result = parseStyle(elem);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('character');
    expect(result!.styleId).toBe('BoldEmphasis');
    expect(result!.rPr).not.toBeNull();
    expect(result!.rPr!.b).toBe(true);
    expect(result!.rPr!.i).toBe(true);
  });

  it('parses table style with conditional formatting', () => {
    const elem = makeElement(`<w:style w:type="table" w:styleId="TableGrid">
      <w:name w:val="Table Grid"/>
      <w:basedOn w:val="TableNormal"/>
      <w:uiPriority w:val="39"/>
      <w:tblPr>
        <w:tblBorders>
          <w:top w:val="single" w:sz="4" w:color="auto"/>
          <w:left w:val="single" w:sz="4" w:color="auto"/>
          <w:bottom w:val="single" w:sz="4" w:color="auto"/>
          <w:right w:val="single" w:sz="4" w:color="auto"/>
          <w:insideH w:val="single" w:sz="4" w:color="auto"/>
          <w:insideV w:val="single" w:sz="4" w:color="auto"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tblStylePr w:type="firstRow">
        <w:rPr>
          <w:b/>
        </w:rPr>
      </w:tblStylePr>
      <w:tblStylePr w:type="lastRow">
        <w:rPr>
          <w:b/>
        </w:rPr>
      </w:tblStylePr>
    </w:style>`);
    const result = parseStyle(elem);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('table');
    expect(result!.styleId).toBe('TableGrid');
    expect(result!.tblPr).not.toBeNull();
    expect(result!.tblStylePr).not.toBeNull();
    expect(result!.tblStylePr!.length).toBe(2);
    expect(result!.tblStylePr![0].type).toBe('firstRow');
    expect(result!.tblStylePr![1].type).toBe('lastRow');
  });

  it('parses default style flag', () => {
    const elem = makeElement(
      '<w:style w:type="paragraph" w:styleId="Normal" w:default="1"/>'
    );
    const result = parseStyle(elem);
    expect(result).not.toBeNull();
    expect(result!.default).toBe(true);
  });

  it('parses custom style flag', () => {
    const elem = makeElement(
      '<w:style w:type="paragraph" w:styleId="MyStyle" w:customStyle="1"/>'
    );
    const result = parseStyle(elem);
    expect(result).not.toBeNull();
    expect(result!.customStyle).toBe(true);
  });

  it('parses hidden style properties', () => {
    const elem = makeElement(`<w:style w:type="paragraph" w:styleId="HiddenStyle">
      <w:name w:val="Hidden Style"/>
      <w:hidden/>
      <w:semiHidden/>
      <w:unhideWhenUsed/>
    </w:style>`);
    const result = parseStyle(elem);
    expect(result).not.toBeNull();
    expect(result!.hidden).toBe(true);
    expect(result!.semiHidden).toBe(true);
    expect(result!.unhideWhenUsed).toBe(true);
  });

  it('parses locked style', () => {
    const elem = makeElement(`<w:style w:type="paragraph" w:styleId="LockedStyle">
      <w:name w:val="Locked Style"/>
      <w:locked/>
    </w:style>`);
    const result = parseStyle(elem);
    expect(result).not.toBeNull();
    expect(result!.locked).toBe(true);
  });

  it('parses auto-redefine style', () => {
    const elem = makeElement(`<w:style w:type="paragraph" w:styleId="AutoStyle">
      <w:name w:val="Auto Style"/>
      <w:autoRedefine/>
    </w:style>`);
    const result = parseStyle(elem);
    expect(result).not.toBeNull();
    expect(result!.autoRedefine).toBe(true);
  });

  it('parses personal styles', () => {
    const elem = makeElement(`<w:style w:type="paragraph" w:styleId="PersonalStyle">
      <w:name w:val="Personal Style"/>
      <w:personal/>
      <w:personalCompose/>
      <w:personalReply/>
    </w:style>`);
    const result = parseStyle(elem);
    expect(result).not.toBeNull();
    expect(result!.personal).toBe(true);
    expect(result!.personalCompose).toBe(true);
    expect(result!.personalReply).toBe(true);
  });

  it('parses numbering style', () => {
    const elem = makeElement(`<w:style w:type="numbering" w:styleId="BulletList">
      <w:name w:val="Bullet List"/>
      <w:uiPriority w:val="99"/>
    </w:style>`);
    const result = parseStyle(elem);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('numbering');
    expect(result!.styleId).toBe('BulletList');
  });

  it('parses all style types', () => {
    const styleTypes = ['paragraph', 'character', 'table', 'numbering'];
    for (const styleType of styleTypes) {
      const elem = makeElement(
        `<w:style w:type="${styleType}" w:styleId="Test${styleType}"/>`
      );
      const result = parseStyle(elem);
      expect(result).not.toBeNull();
      expect(result!.type).toBe(styleType);
    }
  });
});

// =============================================================================
// Styles Parser Tests
// =============================================================================

describe('Styles Parser', () => {
  it('returns null for null input', () => {
    const result = parseStyles(null);
    expect(result).toBeNull();
  });

  it('parses empty styles element', () => {
    const elem = makeElement('<w:styles/>');
    const result = parseStyles(elem);
    expect(result).not.toBeNull();
    expect(result!.docDefaults).toBeNull();
    expect(result!.latentStyles).toBeNull();
    expect(result!.style).toEqual([]);
  });

  it('parses styles with doc defaults only', () => {
    const elem = makeElement(`<w:styles>
      <w:docDefaults>
        <w:rPrDefault>
          <w:rPr>
            <w:sz w:val="22"/>
          </w:rPr>
        </w:rPrDefault>
      </w:docDefaults>
    </w:styles>`);
    const result = parseStyles(elem);
    expect(result).not.toBeNull();
    expect(result!.docDefaults).not.toBeNull();
    expect(result!.latentStyles).toBeNull();
    expect(result!.style).toEqual([]);
  });

  it('parses styles with latent styles only', () => {
    const elem = makeElement(`<w:styles>
      <w:latentStyles w:defUIPriority="99" w:count="376">
        <w:lsdException w:name="Normal" w:uiPriority="0"/>
      </w:latentStyles>
    </w:styles>`);
    const result = parseStyles(elem);
    expect(result).not.toBeNull();
    expect(result!.docDefaults).toBeNull();
    expect(result!.latentStyles).not.toBeNull();
    expect(result!.latentStyles!.count).toBe(376);
    expect(result!.style).toEqual([]);
  });

  it('parses styles with style definitions only', () => {
    const elem = makeElement(`<w:styles>
      <w:style w:type="paragraph" w:styleId="Normal" w:default="1">
        <w:name w:val="Normal"/>
      </w:style>
      <w:style w:type="paragraph" w:styleId="Heading1">
        <w:name w:val="heading 1"/>
        <w:basedOn w:val="Normal"/>
      </w:style>
    </w:styles>`);
    const result = parseStyles(elem);
    expect(result).not.toBeNull();
    expect(result!.docDefaults).toBeNull();
    expect(result!.latentStyles).toBeNull();
    expect(result!.style!.length).toBe(2);
    expect(result!.style![0].styleId).toBe('Normal');
    expect(result!.style![1].styleId).toBe('Heading1');
  });

  it('filters invalid styles', () => {
    const elem = makeElement(`<w:styles>
      <w:style w:type="paragraph" w:styleId="Valid">
        <w:name w:val="Valid Style"/>
      </w:style>
      <w:style w:type="paragraph">
      </w:style>
      <w:style w:styleId="NoType">
      </w:style>
    </w:styles>`);
    const result = parseStyles(elem);
    expect(result).not.toBeNull();
    expect(result!.style!.length).toBe(1);
    expect(result!.style![0].styleId).toBe('Valid');
  });
});
