import { strict as assert } from 'node:assert';
import { convertJetbrainsTheme } from 'src/themes/convertJetbrainsTheme';
import { resolveScheme, resolveUiTheme } from 'src/themes/jetbrainsTheme';
import { mergeAttributes, TEXTMATE_LANGUAGES, TEXTMATE_RULES, textMateAttributes, textMateScopes } from 'src/themes/textMateTheme';

import type { TextAttributes } from 'src/themes/jetbrainsTheme';

const KEYS: Record<string, TextAttributes> = {
  DEFAULT_BLOCK_COMMENT: { foreground: '#000002' },
  DEFAULT_CONSTANT: { fontType: 2, foreground: '#000003' },
  DEFAULT_DOT: { foreground: '#000007' },
  DEFAULT_LINE_COMMENT: { fontType: 2, foreground: '#000001' },
  DEFAULT_NUMBER: { foreground: '#000004' },
  DEFAULT_VALID_STRING_ESCAPE: { fontType: 1, foreground: '#000005' },
  DIFF_INSERTED: { background: '#000006' },
};
const resolve = (key: string) => KEYS[key];

describe('TextMate languages', () => {
  it('merges layers like the IDE: the top color, every font style', () => {
    assert.deepEqual(mergeAttributes([{ fontType: 2, foreground: '#000001' }, { foreground: '#000002' }, { fontType: 1 }]), { fontType: 3, foreground: '#000002' });
    // an effect comes with its color
    assert.deepEqual(mergeAttributes([{ effectColor: '#000001', effectType: 3 }, { effectType: 1 }]), { effectColor: '#000001', effectType: 3, fontType: 0 });
  });

  it('draws a scope with every rule that matches it, the more specific on top', () => {
    // a number is a constant too: its color, the italic of the constant
    assert.deepEqual(textMateAttributes('constant.numeric.ruby', resolve), { fontType: 2, foreground: '#000004' });
    assert.deepEqual(textMateAttributes('constant.character.escape.ruby', resolve), { fontType: 3, foreground: '#000005' });
    // a layer without a color (a diff background, which a VS Code token cannot have) leaves no color
    assert.deepEqual(textMateAttributes('markup.inserted', resolve), { fontType: 0 });
    // the parents of a scope are layers under it: the marker of a comment is punctuation (the text color in Islands)
    // with the italic of the comment
    assert.deepEqual(textMateAttributes('comment.block.documentation punctuation.definition.comment', resolve), { fontType: 2, foreground: '#000007' });
    // a comment marker is always in a comment: its own rule has the layers of the comment, with no parent in the selector
    assert.deepEqual(textMateAttributes('punctuation.definition.comment.lua', resolve), { fontType: 2, foreground: '#000007' });
    assert.deepEqual(textMateAttributes('punctuation.definition.string.begin.lua', resolve), { fontType: 0, foreground: '#000007' });
    // whole segments only, and a key the scheme does not have adds nothing
    assert.equal(textMateAttributes('constantly', resolve), undefined);
    assert.deepEqual(textMateAttributes('string', resolve), {});
  });

  it('writes the selectors and the deeper scopes of the other rules, not the scopes of other languages', () => {
    const scopes = textMateScopes(['constant.language', 'keyword.operator.logical.python', 'support.class', 'comment.block.documentation storage.type', 'source.rst comment.block']);
    assert.ok(scopes.includes('constant.language'));
    assert.ok(scopes.includes('comment.block.documentation storage.type'));
    assert.ok(!scopes.includes('keyword.operator.logical.python'));
    assert.ok(!scopes.includes('support.class'));
    assert.ok(!scopes.includes('source.rst comment.block'));
    for (const selector of Object.keys(TEXTMATE_RULES)) assert.ok(scopes.includes(selector), selector);
    // a keyword in a comment (the `rem` of a batch file) has the italic of the comment
    assert.ok(scopes.includes('comment keyword'));
  });

  it('writes one rule per scope for every TextMate language, always with a color', () => {
    const ui = resolveUiTheme([{ colors: {}, dark: true, editorScheme: 'Test', name: 'Test', ui: {} }], 'Test');
    const scheme = resolveScheme([{ attributes: { ...KEYS, TEXT: { foreground: '#00000a' } }, colors: {}, name: 'Test' }], 'Test');
    const { theme } = convertJetbrainsTheme('Test', ui, scheme, { textMateLanguages: ['source.ruby', 'source.lua'], tokens: [{ from: ['TEXT'], name: 'Text', scope: ['constant.language'] }] });
    const rule = (name: string) => theme.tokenColors.find((token) => token.name === name);
    assert.deepEqual(rule('TextMate constant.numeric'), {
      name: 'TextMate constant.numeric',
      scope: ['source.ruby constant.numeric', 'source.lua constant.numeric'],
      settings: { fontStyle: 'italic', foreground: '#000004' },
    });
    // a deeper scope of another rule gets its TextMate style in these languages
    assert.equal(rule('TextMate constant.language')?.settings.foreground, '#000003');
    // no layer with a color: the text color, not the color of the parents (no other rule draws the scope)
    assert.equal(rule('TextMate markup.inserted')?.settings.foreground, '#00000a');
    // a language where the other rules already draw the scope the same gets no rule for it
    const { theme: same } = convertJetbrainsTheme('Test', ui, scheme, {
      textMateLanguages: ['source.ruby', 'source.lua'],
      tokens: [{ from: ['DEFAULT_CONSTANT'], name: 'Ruby constant', scope: ['source.ruby constant'] }],
    });
    assert.deepEqual(same.tokenColors.find((token) => token.name === 'TextMate constant')?.scope, ['source.lua constant']);
    // own token rules without languages: none
    assert.ok(!convertJetbrainsTheme('Test', ui, scheme, { tokens: [] }).theme.tokenColors.some((token) => token.name.startsWith('TextMate')));
    assert.ok(TEXTMATE_LANGUAGES.includes('source.lua') && !TEXTMATE_LANGUAGES.includes('source.ruby'));
  });
});
