import { strict as assert } from 'node:assert';
import { applySemanticStyle, decodeSemanticTokens, parseSelector, resolveScopes, selectorScore, semanticStyle } from 'src/themes/semanticTokens';

const token = (type: string, modifiers: string[] = [], language = 'typescript') => ({ language, modifiers, type });

describe('Semantic tokens (as VS Code styles them)', () => {
  it('scores a selector like VS Code: 100 per modifier, 100 for the type, 10 for the language', () => {
    assert.deepEqual(parseSelector('property.readonly:typescript'), { language: 'typescript', modifiers: ['readonly'], type: 'property' });
    assert.equal(selectorScore(parseSelector('property'), token('property', ['readonly'])), 100);
    assert.equal(selectorScore(parseSelector('property:typescript'), token('property', ['readonly'])), 110);
    // a modifier weighs more than the language: `property.readonly` beats `property:typescript`
    assert.equal(selectorScore(parseSelector('property.readonly'), token('property', ['readonly'])), 200);
    assert.equal(selectorScore(parseSelector('*.readonly'), token('property', ['readonly'])), 100);
    // every modifier of the selector must be on the token, and the language must be the one of the document
    assert.equal(selectorScore(parseSelector('property.static'), token('property', ['readonly'])), -1);
    assert.equal(selectorScore(parseSelector('property:python'), token('property')), -1);
    // a super type matches one level down
    assert.equal(selectorScore(parseSelector('method'), token('member')), 99);
  });

  it('takes each property from the best selector, a later one winning a tie', () => {
    const rules = {
      property: { fontStyle: '', foreground: '#000001' },
      'property.static': { fontStyle: 'italic', foreground: '#000002' },
      'property:typescript': { foreground: '#000003' },
    };
    assert.deepEqual(semanticStyle(token('property', ['static']), rules, []), {
      bold: false,
      foreground: '#000002',
      italic: true,
      strikethrough: false,
      underline: false,
    });
    // `property:typescript` (110) sets the color, the font style stays the one of `property` (100)
    assert.deepEqual(semanticStyle(token('property'), rules, []), {
      bold: false,
      foreground: '#000003',
      italic: false,
      strikethrough: false,
      underline: false,
    });
    // a string value is a color
    assert.deepEqual(semanticStyle(token('class'), { class: '#000004' }, []), { foreground: '#000004' });
  });

  it('falls back on the TextMate rules of the theme for what the semantic rules leave unset', () => {
    const tokenColors = [
      { scope: 'variable.other.constant', settings: { foreground: '#000005' } },
      { scope: ['entity.name.function', 'source.ts variable'], settings: { fontStyle: 'bold', foreground: '#000006' } },
    ];
    // `variable.readonly` probes variable.other.constant
    assert.deepEqual(semanticStyle(token('variable', ['readonly']), {}, tokenColors), { foreground: '#000005' });
    // a rule with a parent cannot match a probe of one scope
    assert.equal(resolveScopes([['variable.other.readwrite']], tokenColors), undefined);
    assert.deepEqual(resolveScopes([['entity.name.function.ts']], tokenColors), {
      bold: true,
      foreground: '#000006',
      italic: false,
      strikethrough: false,
      underline: false,
    });
    // a property a semantic rule sets is not replaced by a default rule
    assert.equal(semanticStyle(token('function'), { function: { foreground: '#000007' } }, tokenColors).foreground, '#000007');
    // the default rules of an extension come with their language
    const defaults = [{ scopesToProbe: [['entity.name.function']], selector: 'variable:typescript' }];
    assert.equal(semanticStyle(token('variable'), {}, tokenColors, defaults).foreground, '#000006');
    assert.deepEqual(semanticStyle(token('variable', [], 'javascript'), {}, tokenColors, defaults), {});
  });

  it('sets only what the semantic style has on the TextMate style', () => {
    assert.deepEqual(applySemanticStyle({ fontStyle: 'bold', foreground: '#000001' }, { foreground: '#00000A', italic: true }), {
      fontStyle: 'italic bold',
      foreground: '#00000a',
    });
    assert.deepEqual(applySemanticStyle({ fontStyle: 'italic', foreground: '#000001' }, { italic: false }), { fontStyle: '', foreground: '#000001' });
  });

  it('decodes the relative positions and the modifier bits of the tokens', () => {
    const legend = { tokenModifiers: ['declaration', 'static', 'readonly'], tokenTypes: ['class', 'property'] };
    const tokens = decodeSemanticTokens([3, 4, 6, 0, 1, 0, 8, 5, 1, 0b110, 2, 2, 3, 1, 0], legend, 'typescript');
    assert.deepEqual(tokens, [
      { character: 4, language: 'typescript', length: 6, line: 3, modifiers: ['declaration'], type: 'class' },
      { character: 12, language: 'typescript', length: 5, line: 3, modifiers: ['static', 'readonly'], type: 'property' },
      { character: 2, language: 'typescript', length: 3, line: 5, modifiers: [], type: 'property' },
    ]);
  });
});
