/**
 * Syntax colors: TextMate scopes and semantic tokens -> the JetBrains editor attributes that color the same code.
 * Hand kept: change it and run `bun run sync:colors`.
 *
 * Each rule lists attribute keys: the first one the color scheme defines gives the font style, the first one with a
 * foreground gives the color (like the IDE, which draws a key without a color in the color of the layer under it). Many
 * language keys of the IDE fall back to a default key in code, not in the scheme files (`JSON.PROPERTY_KEY` ->
 * `DEFAULT_INSTANCE_FIELD`, `YAML_SCALAR_KEY` -> `DEFAULT_KEYWORD`): those fallbacks are written here.
 * The order of the rules is kept in the theme: for the same scope depth, a later rule wins in VS Code.
 */
/** Semantic keys of the JavaScript plugin (its fallbacks are not in this repository: the default ones are written) */
const JS_MEMBER_FUNCTION = ['JS.INSTANCE_MEMBER_FUNCTION', 'DEFAULT_INSTANCE_METHOD', 'DEFAULT_FUNCTION_CALL', 'TEXT'];
const JS_GLOBAL_VARIABLE = ['JS.GLOBAL_VARIABLE', 'DEFAULT_GLOBAL_VARIABLE'];
const JS_LANGUAGES = ['javascript', 'javascriptreact', 'typescript', 'typescriptreact'];
const JS_TYPE_PARAMETER = ['IDE.TS.TYPE_PARAMETER', 'TYPE_PARAMETER_NAME_ATTRIBUTES'];
/** The scopes of the Python grammar (MagicRegExp) inside a raw string, which it reads as a regular expression */
const PY_REGEXP_PARTS = [
  'comment.regexp',
  'constant.character.escape.regexp',
  'constant.character.set.regexp',
  'constant.character.unicode.regexp',
  'constant.other.set.regexp',
  'entity.name.tag.backreference.regexp',
  'entity.name.tag.named.backreference.regexp',
  'entity.name.tag.named.group.regexp',
  'keyword.operator.conditional.negative.regexp',
  'keyword.operator.conditional.regexp',
  'keyword.operator.disjunction.regexp',
  'keyword.operator.lookahead.negative.regexp',
  'keyword.operator.lookahead.regexp',
  'keyword.operator.lookbehind.negative.regexp',
  'keyword.operator.lookbehind.regexp',
  'keyword.operator.negation.regexp',
  'keyword.operator.quantifier.regexp',
  'punctuation.character.set.begin.regexp',
  'punctuation.character.set.end.regexp',
  'punctuation.comment.begin.regexp',
  'punctuation.comment.end.regexp',
  'punctuation.parenthesis.backreference.named.begin.regexp',
  'punctuation.parenthesis.backreference.named.end.regexp',
  'punctuation.parenthesis.begin.regexp',
  'punctuation.parenthesis.conditional.begin.regexp',
  'punctuation.parenthesis.conditional.end.regexp',
  'punctuation.parenthesis.end.regexp',
  'punctuation.parenthesis.lookahead.begin.regexp',
  'punctuation.parenthesis.lookahead.end.regexp',
  'punctuation.parenthesis.lookbehind.begin.regexp',
  'punctuation.parenthesis.lookbehind.end.regexp',
  'punctuation.parenthesis.named.begin.regexp',
  'punctuation.parenthesis.named.end.regexp',
  'punctuation.parenthesis.non-capturing.begin.regexp',
  'punctuation.parenthesis.non-capturing.end.regexp',
  'storage.modifier.flag.regexp',
  'support.other.escape.special.regexp',
  'support.other.match.any.regexp',
  'support.other.match.begin.regexp',
  'support.other.match.end.regexp',
  'support.other.parenthesis.regexp',
];

/** The regexp scopes of the TypeScript and JavaScript grammars inside a regex literal */
const JS_REGEXP_PARTS = [
  'constant.character.control.regexp',
  'constant.character.escape.backslash.regexp',
  'constant.character.numeric.regexp',
  'constant.other.character-class.regexp',
  'constant.other.character-class.range.regexp',
  'constant.other.character-class.set.regexp',
  'keyword.control.anchor.regexp',
  'keyword.operator.negation.regexp',
  'keyword.operator.or.regexp',
  'keyword.operator.quantifier.regexp',
  'keyword.other.back-reference.regexp',
  'punctuation.definition.character-class.regexp',
  'punctuation.definition.group.assertion.regexp',
  'punctuation.definition.group.no-capture.regexp',
  'punctuation.definition.group.regexp',
  'variable.other.regexp',
];

export type TokenRule = { from: string[]; name: string; scope: string[] };

export const TOKEN_RULES: TokenRule[] = [
  // Defaults of every language
  { from: ['DEFAULT_LINE_COMMENT'], name: 'Comment', scope: ['comment', 'punctuation.definition.comment'] },
  { from: ['DEFAULT_BLOCK_COMMENT'], name: 'Block comment', scope: ['comment.block'] },
  {
    from: ['DEFAULT_DOC_COMMENT'],
    name: 'Doc comment',
    // the delimiters (`/** */`, the quotes of a docstring) too, as the IDE draws them (seen in PyCharm 2026-11-21)
    scope: [
      'comment.block.documentation',
      'comment.block.javadoc',
      'string.quoted.docstring',
      'comment.block.documentation punctuation.definition.comment',
      'comment.block.javadoc punctuation.definition.comment',
      'string.quoted.docstring punctuation.definition.string',
    ],
  },
  { from: ['DEFAULT_DOC_COMMENT_TAG'], name: 'Doc comment tag', scope: ['comment.block.documentation storage.type', 'comment.block.documentation keyword', 'storage.type.class.jsdoc'] },
  { from: ['DEFAULT_KEYWORD'], name: 'Keyword', scope: ['keyword', 'storage.type', 'storage.modifier', 'keyword.control', 'constant.language', 'variable.language.this', 'variable.language.super', 'support.type.primitive'] },
  { from: ['DEFAULT_OPERATION_SIGN', 'TEXT'], name: 'Operator', scope: ['keyword.operator', 'punctuation.separator.key-value', 'punctuation.accessor'] },
  // Word operators are keywords in the IDE (and, or, not, in, is, new, typeof…)
  { from: ['DEFAULT_KEYWORD'], name: 'Word operator', scope: ['keyword.operator.logical.python', 'keyword.operator.new', 'keyword.operator.expression', 'keyword.operator.word', 'keyword.operator.instanceof', 'keyword.operator.typeof'] },
  { from: ['DEFAULT_STRING'], name: 'String', scope: ['string', 'punctuation.definition.string'] },
  { from: ['DEFAULT_VALID_STRING_ESCAPE'], name: 'String escape', scope: ['constant.character.escape', 'constant.character.format.placeholder', 'meta.format.percent', 'constant.other.placeholder'] },
  { from: ['DEFAULT_INVALID_STRING_ESCAPE'], name: 'Invalid string escape', scope: ['invalid.illegal.character.escape', 'invalid.illegal.unrecognized-string-escape'] },
  { from: ['DEFAULT_NUMBER'], name: 'Number', scope: ['constant.numeric'] },
  { from: ['DEFAULT_CONSTANT'], name: 'Constant', scope: ['variable.other.constant', 'constant.other', 'variable.other.enummember', 'entity.name.constant'] },
  { from: ['DEFAULT_FUNCTION_DECLARATION'], name: 'Function declaration', scope: ['entity.name.function', 'meta.definition.method entity.name.function', 'meta.function entity.name.function'] },
  { from: ['DEFAULT_FUNCTION_CALL', 'TEXT'], name: 'Function call', scope: ['meta.function-call entity.name.function', 'meta.function-call.generic', 'support.function'] },
  { from: ['DEFAULT_INSTANCE_METHOD', 'DEFAULT_FUNCTION_CALL', 'TEXT'], name: 'Method call', scope: ['meta.method-call entity.name.function', 'meta.function-call.method'] },
  { from: ['DEFAULT_INSTANCE_FIELD'], name: 'Field', scope: ['variable.other.property', 'variable.other.object.property', 'variable.other.member', 'support.variable.property', 'entity.name.variable.field'] },
  { from: ['DEFAULT_CLASS_NAME', 'DEFAULT_IDENTIFIER', 'TEXT'], name: 'Class name', scope: ['entity.name.type', 'entity.name.class', 'entity.other.inherited-class'] },
  { from: ['DEFAULT_CLASS_REFERENCE', 'DEFAULT_IDENTIFIER', 'TEXT'], name: 'Class reference', scope: ['support.class', 'support.type', 'entity.name.type.module'] },
  { from: ['DEFAULT_INTERFACE_NAME', 'DEFAULT_CLASS_NAME', 'DEFAULT_IDENTIFIER', 'TEXT'], name: 'Interface name', scope: ['entity.name.type.interface'] },
  { from: ['TYPE_PARAMETER_NAME_ATTRIBUTES'], name: 'Type parameter', scope: ['entity.name.type.parameter', 'meta.type.parameters entity.name.type'] },
  { from: ['DEFAULT_PARAMETER', 'DEFAULT_IDENTIFIER', 'TEXT'], name: 'Parameter', scope: ['variable.parameter'] },
  { from: ['DEFAULT_METADATA'], name: 'Annotation', scope: ['meta.decorator', 'entity.name.function.decorator', 'punctuation.definition.decorator', 'storage.type.annotation', 'punctuation.definition.annotation'] },
  { from: ['DEFAULT_LABEL', 'DEFAULT_IDENTIFIER'], name: 'Label', scope: ['entity.name.label'] },
  // The tag key colors the whole tag, its brackets too (XmlHighlighterColors: HTML_TAG -> DEFAULT_TAG)
  { from: ['HTML_TAG', 'DEFAULT_TAG', 'TEXT'], name: 'Tag punctuation', scope: ['punctuation.definition.tag', 'meta.tag punctuation'] },
  { from: ['HTML_TAG_NAME', 'XML_TAG_NAME', 'DEFAULT_KEYWORD'], name: 'Tag name', scope: ['entity.name.tag'] },
  { from: ['HTML_ATTRIBUTE_NAME', 'XML_ATTRIBUTE_NAME', 'DEFAULT_INSTANCE_FIELD'], name: 'Attribute name', scope: ['entity.other.attribute-name'] },
  // The `=` of an attribute is part of its value (captured in WebStorm 2026-11-22)
  { from: ['HTML_ATTRIBUTE_VALUE', 'XML_ATTRIBUTE_VALUE', 'DEFAULT_STRING'], name: 'Attribute value', scope: ['meta.attribute-with-value string', 'meta.tag string', 'meta.attribute punctuation.separator.key-value.html'] },
  // The name of a doctype is the tag, not a tag name: text in Islands Light
  { from: ['HTML_TAG', 'DEFAULT_TAG', 'TEXT'], name: 'HTML doctype', scope: ['meta.tag.metadata.doctype.html entity.name.tag'] },
  { from: ['HTML_ENTITY_REFERENCE', 'XML_ENTITY_REFERENCE', 'DEFAULT_VALID_STRING_ESCAPE'], name: 'Entity', scope: ['constant.character.entity', 'constant.character.entity punctuation'] },
  { from: ['ERRORS_ATTRIBUTES'], name: 'Invalid', scope: ['invalid', 'invalid.illegal'] },
  { from: ['DEPRECATED_ATTRIBUTES'], name: 'Deprecated', scope: ['invalid.deprecated'] },

  // Python, as PyCharm colors it (keys and fallbacks of PyHighlighter.java: no key for constants or attributes, method
  // calls fall back to function calls)
  { from: ['PY.ANNOTATION', 'DEFAULT_IDENTIFIER', 'TEXT'], name: 'Python name in capitals', scope: ['constant.other.caps.python', 'variable.other.constant.python'] },
  { from: ['PY.METHOD_CALL', 'PY.FUNCTION_CALL', 'DEFAULT_FUNCTION_CALL', 'TEXT'], name: 'Python call', scope: ['meta.function-call.python entity.name.function', 'meta.function-call.generic.python'] },
  { from: ['PY.KEYWORD', 'DEFAULT_KEYWORD'], name: 'Python keyword', scope: ['keyword.control.flow.python', 'keyword.control.import.python', 'storage.type.function.python', 'storage.type.class.python', 'constant.language.python'] },
  { from: ['PY.SELF_PARAMETER', 'DEFAULT_KEYWORD'], name: 'Python self', scope: ['variable.parameter.function.language.special.self.python', 'variable.language.special.self.python', 'variable.parameter.function.language.special.cls.python', 'variable.language.special.cls.python'] },
  { from: ['PY.KEYWORD_ARGUMENT', 'DEFAULT_PARAMETER'], name: 'Python keyword argument', scope: ['variable.parameter.function-call.python', 'meta.function-call.arguments.python variable.parameter'] },
  { from: ['PY.BUILTIN_NAME', 'DEFAULT_PREDEFINED_SYMBOL'], name: 'Python builtin', scope: ['support.function.builtin.python', 'support.type.python', 'support.type.exception.python', 'support.function.builtin', 'support.type.builtin.python'] },
  { from: ['PY.PREDEFINED_USAGE', 'DEFAULT_PREDEFINED_SYMBOL'], name: 'Python special name', scope: ['support.variable.magic.python', 'support.function.magic.python', 'entity.name.function.magic.python'] },
  { from: ['PY.PREDEFINED_DEFINITION', 'PY.PREDEFINED_USAGE'], name: 'Python special method', scope: ['meta.function.python support.function.magic.python'] },
  { from: ['PY.DECORATOR', 'DEFAULT_METADATA'], name: 'Python decorator', scope: ['meta.function.decorator.python', 'entity.name.function.decorator.python', 'punctuation.definition.decorator.python'] },
  { from: ['PY.DOC_COMMENT', 'DEFAULT_DOC_COMMENT'], name: 'Python docstring', scope: ['string.quoted.docstring.multi.python', 'string.quoted.docstring.single.python', 'string.quoted.docstring punctuation.definition.string.begin.python', 'string.quoted.docstring punctuation.definition.string.end.python'] },
  { from: ['PY.STRING.B', 'DEFAULT_STRING'], name: 'Python bytes', scope: ['string.quoted.binary.single.python', 'string.quoted.binary.multi.python'] },
  // Captured in PyCharm 2026.3 (2026-11-22): the prefix of a string (f, r, u) is part of the string, the prefix and quotes
  // of bytes have the bytes color, the 0x of a number and the j of an imaginary number are the number, and a builtin
  // used as a decorator (@classmethod, @property) is a decorator. The full scope names: a rule with a parent scope wins
  // over another only when their last scopes are as long.
  { from: ['PY.STRING.U', 'DEFAULT_STRING'], name: 'Python string prefix', scope: ['storage.type.string.python'] },
  {
    from: ['PY.STRING.B', 'DEFAULT_STRING'],
    name: 'Python bytes prefix and quotes',
    scope: ['single', 'multi'].flatMap((kind) =>
      ['storage.type.string.python', 'punctuation.definition.string.begin.python', 'punctuation.definition.string.end.python'].map(
        (part) => `string.quoted.binary.${kind}.python ${part}`
      )
    ),
  },
  { from: ['PY.NUMBER', 'DEFAULT_NUMBER'], name: 'Python number prefix', scope: ['storage.type.number.python', 'storage.type.imaginary.number.python'] },
  { from: ['PY.DECORATOR', 'DEFAULT_METADATA'], name: 'Python builtin decorator', scope: ['meta.function.decorator.python support.type.python', 'meta.function.decorator.python support.function.builtin.python'] },
  // The grammar reads every raw string as a regular expression. PyCharm draws a raw string in the string color, the regex
  // of re.compile too (its injected regex only gets a background; captured 2026-11-22, as WebStorm does for JS regexes)
  {
    from: ['PY.STRING.U', 'DEFAULT_STRING'],
    name: 'Python raw string',
    scope: ['single', 'multi'].flatMap((kind) => PY_REGEXP_PARTS.map((part) => `string.regexp.quoted.${kind}.python ${part}`)),
  },
  { from: ['PY.FUNC_DEFINITION', 'DEFAULT_FUNCTION_DECLARATION'], name: 'Python function', scope: ['meta.function.python entity.name.function.python'] },
  { from: ['PY.CLASS_DEFINITION', 'DEFAULT_CLASS_NAME', 'TEXT'], name: 'Python class', scope: ['entity.name.type.class.python'] },

  // Java (JavaHighlightingColors.java): the grammar gives class names `storage.type`, which the IDE draws as class names,
  // not keywords; the package and import paths are plain identifiers. A static final field needs the language server
  // (semantic tokens), the grammar cannot tell it.
  { from: ['CLASS_NAME_ATTRIBUTES'], name: 'Java class name', scope: ['storage.type.java', 'storage.type.generic.java', 'storage.type.object.array.java'] },
  { from: ['DEFAULT_IDENTIFIER'], name: 'Java package', scope: ['storage.modifier.package.java', 'storage.modifier.import.java'] },

  // C and C++ (CLion, seen on screen 2026-11-21; its keys are closed): a call is text, not a declaration; the member
  // initializer of a constructor is a field; a macro has the color of an annotation; the type of a parameter is a class
  // reference (the grammar names it like a type parameter)
  { from: ['DEFAULT_FUNCTION_CALL', 'TEXT'], name: 'C++ call', scope: ['entity.name.function.call.cpp', 'entity.name.function.member.cpp', 'entity.name.function.member.c'] },
  { from: ['DEFAULT_INSTANCE_FIELD'], name: 'C++ member initializer', scope: ['entity.name.function.call.initializer.cpp'] },
  { from: ['DEFAULT_METADATA'], name: 'C++ macro', scope: ['entity.name.function.preprocessor.cpp', 'entity.name.function.preprocessor.c'] },
  { from: ['DEFAULT_CLASS_REFERENCE'], name: 'C++ parameter type', scope: ['entity.name.type.parameter.cpp'] },

  // Rust (keys of intellij-rust, RsColors.kt; RustRover's Islands colors seen on screen 2026-11-21): doc comments, primitive
  // types are keywords, attributes are metadata, a call is text (not intellij-rust's old yellow: RustRover draws it plain),
  // a macro stays blue like a declaration, a lifetime takes the teal of a type parameter (RustRover: teal, italic)
  { from: ['org.rust.DOC_COMMENT'], name: 'Rust doc comment', scope: ['comment.line.documentation.rust', 'comment.block.documentation.rust', 'comment.line.documentation.rust punctuation.definition.comment', 'comment.block.documentation.rust punctuation.definition.comment'] },
  { from: ['org.rust.PRIMITIVE_TYPE'], name: 'Rust primitive type', scope: ['entity.name.type.numeric.rust', 'entity.name.type.primitive.rust'] },
  { from: ['org.rust.SELF_PARAMETER'], name: 'Rust self', scope: ['variable.language.self.rust'] },
  { from: ['org.rust.ATTRIBUTE'], name: 'Rust attribute', scope: ['meta.attribute.rust', 'meta.attribute.rust entity.name.type.rust', 'meta.attribute.rust punctuation'] },
  { from: ['org.rust.FUNCTION_CALL', 'TEXT'], name: 'Rust call', scope: ['meta.function.call.rust entity.name.function.rust'] },
  { from: ['TYPE_PARAMETER_NAME_ATTRIBUTES'], name: 'Rust lifetime', scope: ['entity.name.type.lifetime.rust', 'punctuation.definition.lifetime.rust'] },

  // C# (Rider draws C# with its own palette, not the Islands one: C# follows the defaults like the other languages). The
  // XML tags of a doc comment are doc markup, like the HTML of a Javadoc, not HTML tags
  { from: ['DEFAULT_DOC_MARKUP', 'DEFAULT_DOC_COMMENT'], name: 'C# doc comment tag', scope: ['comment.block.documentation.cs meta.tag', 'comment.block.documentation.cs punctuation.definition.tag', 'comment.block.documentation.cs entity.name.tag'] },

  // Go (GoLand's colors are closed: only the GO_* keys the bundled schemes have, Islands Light's, then the defaults): a call
  // is text, not a declaration; builtins and their constants have their key where a scheme gives one
  { from: ['GO_EXPORTED_FUNCTION_CALL', 'TEXT'], name: 'Go call', scope: ['entity.name.function.support.go'] },
  { from: ['GO_BUILTIN_FUNCTION_CALL', 'TEXT'], name: 'Go builtin call', scope: ['entity.name.function.support.builtin.go'] },
  { from: ['GO_BUILTIN_TYPE_REFERENCE'], name: 'Go builtin type', scope: ['storage.type.numeric.go', 'storage.type.string.go', 'storage.type.boolean.go', 'storage.type.byte.go', 'storage.type.rune.go', 'storage.type.error.go', 'storage.type.uintptr.go'] },
  { from: ['GO_BUILTIN_CONSTANT'], name: 'Go builtin constant', scope: ['constant.language.null.go', 'constant.language.boolean.go', 'constant.language.iota.go'] },

  // Ruby, as RubyMine draws it (its Ruby plugin is closed: the colors are captured, src/themes/capturedAttributes.ts).
  // Words like require, attr_reader, include are calls of their own color (`new`, which the grammar names the same, is a
  // plain call in RubyMine); a class, a module and an assigned constant are constant declarations, a use of them a
  // constant; a call is text, a symbol and an instance variable have their keys. A parameter or a local variable is
  // colored where the grammar names it (its uses need the IDE's resolution).
  { from: ['IDE.RUBY.COMMENT'], name: 'Ruby comment', scope: ['comment.line.number-sign.ruby', 'comment.block.documentation.ruby', 'comment.line.number-sign.ruby punctuation.definition.comment'] },
  { from: ['IDE.RUBY.SPECIFIC_CALL'], name: 'Ruby specific call', scope: ['keyword.other.special-method.ruby'] },
  { from: ['DEFAULT_KEYWORD'], name: 'Ruby literal', scope: ['constant.language.nil.ruby', 'constant.language.boolean.ruby', 'variable.language.self.ruby'] },
  { from: ['IDE.RUBY.CONSTANT_DECLARATION'], name: 'Ruby constant declaration', scope: ['entity.name.type.module.ruby', 'entity.name.type.class.ruby', 'variable.other.constant.ruby'] },
  { from: ['IDE.RUBY.CONSTANT'], name: 'Ruby constant', scope: ['support.class.ruby', 'variable.other.constant.ruby support.class.ruby', 'entity.other.inherited-class.ruby'] },
  { from: ['IDE.RUBY.NUMBER'], name: 'Ruby number', scope: ['constant.numeric.ruby'] },
  { from: ['IDE.RUBY.SYMBOL'], name: 'Ruby symbol', scope: ['constant.language.symbol.ruby', 'constant.language.symbol.ruby punctuation.definition.constant.ruby', 'constant.other.symbol.hashkey.ruby'] },
  { from: ['IDE.RUBY.METHOD_DECLARATION'], name: 'Ruby method declaration', scope: ['entity.name.function.ruby'] },
  { from: ['DEFAULT_IDENTIFIER', 'TEXT'], name: 'Ruby call', scope: ['meta.function-call.ruby entity.name.function.ruby', 'support.function.kernel.ruby'] },
  { from: ['IDE.RUBY.PARAMETER'], name: 'Ruby parameter', scope: ['variable.parameter.function.ruby', 'variable.other.block.ruby'] },
  { from: ['IDE.RUBY.LOCAL_VARIABLE'], name: 'Ruby local variable', scope: ['variable.ruby'] },
  { from: ['DEFAULT_INSTANCE_FIELD'], name: 'Ruby instance variable', scope: ['variable.other.readwrite.instance.ruby', 'variable.other.readwrite.instance.ruby punctuation.definition.variable.ruby'] },
  { from: ['IDE.RUBY.ESCAPE'], name: 'Ruby escape', scope: ['constant.character.escape.ruby'] },
  // the code of `#{…}` is code, its braces text
  { from: ['TEXT'], name: 'Ruby interpolation', scope: ['string meta.embedded.line.ruby', 'string meta.embedded.line.ruby punctuation.section.embedded'] },

  // PHP, as PhpStorm draws it (closed plugin, captured): a variable, a parameter and $this one color, a property access
  // a field, a constant its own color, a function or method call one color, the braces of `{$…}` in a string grey,
  // `<?php`, `echo`, `null` and `true` keywords. A property declaration is a variable to the grammar.
  { from: ['DEFAULT_KEYWORD'], name: 'PHP keyword', scope: ['punctuation.section.embedded.begin.php', 'punctuation.section.embedded.end.php', 'support.function.construct.output.php', 'constant.language.php', 'storage.type.php'] },
  { from: ['IDE.PHP.VARIABLE'], name: 'PHP variable', scope: ['variable.other.php', 'variable.language.this.php', 'variable.other.php punctuation.definition.variable.php', 'variable.language.this.php punctuation.definition.variable.php'] },
  { from: ['DEFAULT_INSTANCE_FIELD'], name: 'PHP property', scope: ['variable.other.property.php'] },
  { from: ['IDE.PHP.CONSTANT'], name: 'PHP constant', scope: ['constant.other.php', 'constant.other.class.php'] },
  { from: ['IDE.PHP.FUNCTION_CALL'], name: 'PHP call', scope: ['meta.function-call.php support.function', 'meta.function-call.php entity.name.function', 'meta.method-call.php entity.name.function'] },
  { from: ['IDE.PHP.STRING_BRACES'], name: 'PHP string braces', scope: ['string.quoted.double.php punctuation.definition.variable.php'] },
  { from: ['DEFAULT_CLASS_REFERENCE', 'DEFAULT_IDENTIFIER', 'TEXT'], name: 'PHP class', scope: ['entity.name.type.namespace.php', 'support.class.builtin.php'] },

  // Data and markup
  { from: ['JSON.PROPERTY_KEY', 'DEFAULT_INSTANCE_FIELD'], name: 'JSON key', scope: ['support.type.property-name.json', 'meta.object-literal.key'] },
  // TOML (TomlColors.kt; the grammar of the Even Better TOML extension): a key is a keyword, not a field like in JSON
  { from: ['org.toml.KEY'], name: 'TOML key', scope: ['support.type.property-name.toml', 'support.type.property-name.table.toml'] },
  { from: ['YAML_SCALAR_KEY', 'DEFAULT_KEYWORD'], name: 'YAML key', scope: ['entity.name.tag.yaml'] },
  { from: ['YAML_ANCHOR'], name: 'YAML anchor', scope: ['variable.other.anchor.yaml', 'variable.other.alias.yaml', 'punctuation.definition.anchor.yaml', 'punctuation.definition.alias.yaml'] },
  // A comment of YAML falls back to the doc comment (YAMLHighlighter); a plain value is text, numbers and booleans too
  { from: ['YAML_COMMENT'], name: 'YAML comment', scope: ['comment.line.number-sign.yaml', 'punctuation.definition.comment.yaml'] },
  {
    from: ['YAML_SCALAR_VALUE'],
    name: 'YAML value',
    scope: ['constant.language.boolean.yaml', 'constant.language.null.yaml', 'constant.numeric.float.yaml', 'constant.numeric.float.inf.yaml', 'constant.numeric.float.nan.yaml', 'constant.numeric.integer.decimal.yaml', 'constant.numeric.integer.hexadecimal.yaml', 'constant.numeric.integer.octal.yaml'],
  },
  { from: ['PROPERTIES.KEY'], name: 'Properties key', scope: ['support.type.property-name.properties', 'keyword.other.definition.ini', 'entity.name.section.group-title.ini'] },
  { from: ['PROPERTIES.KEY_VALUE_SEPARATOR'], name: 'Properties separator', scope: ['punctuation.separator.key-value.ini'] },
  // .env (DotEnvSyntaxHighlighter): a key is a keyword, a value a string with its quotes and `${…}`, `export` a comment
  { from: ['DOTENV_KEY'], name: '.env key', scope: ['variable.key.dotenv'] },
  { from: ['DOTENV_VALUE'], name: '.env value', scope: ['property.value.dotenv', 'property.value.dotenv keyword', 'property.value.dotenv variable'] },
  { from: ['DOTENV_COMMENT'], name: '.env export', scope: ['keyword.key.export.dotenv'] },
  // Pug (intellij-plugins JadeSyntaxHighlighter): HTML tag and attribute names, an id an attribute name, a class a static
  // field, the statements and `include` keywords, the `=` of an attribute or of code an operator
  { from: ['JADE_DOCTYPE'], name: 'Pug doctype', scope: ['text.pug meta.tag.sgml.doctype.html'] },
  { from: ['JADE_TAG_NAME'], name: 'Pug tag', scope: ['entity.name.tag.pug'] },
  { from: ['JADE_ATTRIBUTE_NAME'], name: 'Pug attribute', scope: ['entity.other.attribute-name.tag.pug'] },
  { from: ['JADE_TAG_ID'], name: 'Pug id', scope: ['entity.other.attribute-name.id.css.pug'] },
  { from: ['JADE_TAG_CLASS'], name: 'Pug class', scope: ['entity.other.attribute-name.class.css.pug'] },
  { from: ['JADE_PARENTS', 'TEXT'], name: 'Pug parentheses', scope: ['constant.name.attribute.tag.pug'] },
  { from: ['JADE_OPERATION_SIGN', 'TEXT'], name: 'Pug operator', scope: ['text.pug attribute_value', 'text.pug source.js constant'] },
  { from: ['JADE_KEYWORD'], name: 'Pug keyword', scope: ['storage.type.function.pug', 'storage.type.import.include.pug'] },
  { from: ['JADE_FILE_PATH'], name: 'Pug file', scope: ['variable.control.import.include.pug'] },
  // Handlebars (intellij-plugins HbHighlighter): `{{ }}` braces, every identifier (`if`, `else`, a name) a keyword,
  // `=` an operator, the value of a hash a value (number)
  { from: ['HANDLEBARS.COMMENTS'], name: 'Handlebars comment', scope: ['comment.block.handlebars'] },
  { from: ['HANDLEBARS.MUSTACHES', 'TEXT'], name: 'Handlebars braces', scope: ['support.constant.handlebars'] },
  { from: ['HANDLEBARS.IDENTIFIERS'], name: 'Handlebars identifier', scope: ['support.constant.handlebars keyword.control', 'variable.parameter.handlebars'] },
  { from: ['HANDLEBARS.OPERATORS', 'TEXT'], name: 'Handlebars operator', scope: ['entity.other.attribute-name.handlebars'] },
  { from: ['HANDLEBARS.VALUES'], name: 'Handlebars value', scope: ['entity.other.attribute-value.handlebars variable.parameter.handlebars'] },
  { from: ['HANDLEBARS.STRINGS'], name: 'Handlebars string', scope: ['string.quoted.double.handlebars', 'string.quoted.single.handlebars'] },
  // SQL (Database Tools, closed). Seen in PyCharm 2026-11-21: the table of a CREATE, an alias and the column after it are
  // text (a column the IDE resolves can be purple: semantic), a built-in function italic like a static method
  { from: ['TEXT'], name: 'SQL name', scope: ['entity.name.function.sql', 'constant.other.database-name.sql', 'constant.other.table-name.sql'] },
  { from: ['DEFAULT_STATIC_METHOD'], name: 'SQL function', scope: ['source.sql support.function'] },
  // CSS (the CSS plugin is closed: its keys fall back in code we cannot read). Captured in WebStorm 2026-11-22: a property
  // name (a custom property too) has the color of an HTML attribute name, a keyword value (`auto`, `none`, a font name)
  // and a unit are strings, a selector and a function (`url`, `var` and its argument) the color of an HTML tag name; the
  // `.` of a class and the `:` of a pseudo-class are text, the `#` of an id is not
  { from: ['CSS.PROPERTY_NAME', 'HTML_ATTRIBUTE_NAME'], name: 'CSS property', scope: ['variable.css', 'support.type.property-name.css', 'support.type.vendored.property-name.css', 'support.type.property-name.scss', 'support.type.property-name.less', 'support.type.property-name.media.css'] },
  { from: ['CSS.PROPERTY_VALUE', 'TEXT'], name: 'CSS value', scope: ['meta.property-value.css'] },
  { from: ['CSS.PROPERTY_VALUE', 'DEFAULT_STRING'], name: 'CSS value keyword', scope: ['support.constant.property-value.css', 'support.constant.font-name.css'] },
  { from: ['CSS.PROPERTY_VALUE', 'DEFAULT_STRING'], name: 'CSS unit', scope: ['keyword.other.unit'] },
  {
    from: ['CSS.TAG_NAME', 'HTML_TAG_NAME'],
    name: 'CSS selector',
    scope: [
      'entity.name.tag.css',
      'entity.other.attribute-name.class.css',
      'entity.other.attribute-name.id.css',
      'entity.other.attribute-name.pseudo-class.css',
      'entity.other.attribute-name.pseudo-element.css',
      'meta.attribute-selector.css entity.other.attribute-name',
    ],
  },
  {
    from: ['TEXT'],
    name: 'CSS selector punctuation',
    scope: ['entity.other.attribute-name.class.css punctuation.definition.entity.css', 'entity.other.attribute-name.pseudo-class.css punctuation.definition.entity.css', 'entity.other.attribute-name.pseudo-element.css punctuation.definition.entity.css'],
  },
  { from: ['CSS.FUNCTION', 'HTML_TAG_NAME'], name: 'CSS function', scope: ['meta.property-value.css support.function', 'support.function.url.css', 'variable.argument.css'] },
  { from: ['CSS.COLOR', 'DEFAULT_NUMBER'], name: 'CSS color', scope: ['constant.other.color.rgb-value.hex.css', 'support.constant.color'] },
  { from: ['CSS.URL', 'DEFAULT_STRING'], name: 'CSS url', scope: ['variable.parameter.url.css'] },
  { from: ['CSS.IMPORTANT', 'DEFAULT_KEYWORD'], name: 'CSS important', scope: ['keyword.other.important.css'] },
  // A header, its `#` too, has the key of its level (MarkdownHighlighterColors); a setext header (underlined) is level 1 or 2
  { from: ['MARKDOWN_HEADER_LEVEL_1'], name: 'Markdown header', scope: ['markup.heading', 'entity.name.section.markdown', 'punctuation.definition.heading.markdown'] },
  ...[1, 2, 3, 4, 5, 6].map((level) => ({
    from: [`MARKDOWN_HEADER_LEVEL_${level}`],
    name: `Markdown header ${level}`,
    scope: [`heading.${level}.markdown`, `heading.${level}.markdown entity.name.section.markdown`, `heading.${level}.markdown punctuation.definition.heading.markdown`, ...(level <= 2 ? [`markup.heading.setext.${level}.markdown`] : [])],
  })),
  { from: ['MARKDOWN_BOLD'], name: 'Markdown bold', scope: ['markup.bold'] },
  { from: ['MARKDOWN_ITALIC'], name: 'Markdown italic', scope: ['markup.italic'] },
  { from: ['MARKDOWN_CODE_SPAN', 'DEFAULT_STRING'], name: 'Markdown code span', scope: ['markup.inline.raw', 'markup.inline.raw.string.markdown'] },
  { from: ['MARKDOWN_CODE_FENCE', 'MARKDOWN_CODE_BLOCK', 'DEFAULT_STRING'], name: 'Markdown code fence', scope: ['markup.fenced_code.block.markdown punctuation.definition.markdown', 'fenced_code.block.language'] },
  { from: ['MARKDOWN_CODE_BLOCK', 'DEFAULT_STRING'], name: 'Markdown code block', scope: ['markup.raw.block.markdown'] },
  { from: ['MARKDOWN_BLOCK_QUOTE', 'MARKDOWN_TEXT', 'TEXT'], name: 'Markdown quote', scope: ['markup.quote'] },
  { from: ['MARKDOWN_BLOCK_QUOTE_MARKER', 'DEFAULT_KEYWORD'], name: 'Markdown quote marker', scope: ['punctuation.definition.quote.begin.markdown'] },
  { from: ['MARKDOWN_LIST_MARKER', 'DEFAULT_KEYWORD'], name: 'Markdown list marker', scope: ['punctuation.definition.list.begin.markdown', 'beginning.punctuation.definition.list.markdown'] },
  { from: ['MARKDOWN_LINK_TEXT', 'HYPERLINK_ATTRIBUTES'], name: 'Markdown link text', scope: ['string.other.link.title.markdown', 'string.other.link.description.markdown'] },
  // The IDE draws the address as a hyperlink, on top of MARKDOWN_LINK_DESTINATION (seen in PyCharm 2026-11-21)
  { from: ['HYPERLINK_ATTRIBUTES'], name: 'Markdown link', scope: ['markup.underline.link', 'markup.underline.link.markdown'] },
  { from: ['DEFAULT_KEYWORD'], name: 'Markdown separator', scope: ['meta.separator.markdown'] },
  { from: ['DIFF_INSERTED', 'CONSOLE_GREEN_OUTPUT'], name: 'Inserted', scope: ['markup.inserted'] },
  { from: ['DIFF_DELETED', 'CONSOLE_RED_OUTPUT'], name: 'Deleted', scope: ['markup.deleted'] },
  { from: ['DIFF_MODIFIED', 'CONSOLE_BLUE_OUTPUT'], name: 'Changed', scope: ['markup.changed'] },

  // XML (XmlHighlighterColors.java) and the custom elements of HTML
  { from: ['XML_TAG', 'DEFAULT_TAG', 'TEXT'], name: 'XML tag', scope: ['punctuation.definition.tag.xml'] },
  { from: ['XML_TAG_NAME', 'DEFAULT_KEYWORD'], name: 'XML tag name', scope: ['entity.name.tag.xml', 'entity.name.tag.localname.xml'] },
  { from: ['XML_ATTRIBUTE_NAME', 'DEFAULT_ATTRIBUTE', 'DEFAULT_INSTANCE_FIELD'], name: 'XML attribute name', scope: ['entity.other.attribute-name.xml', 'entity.other.attribute-name.localname.xml'] },
  // Captured in WebStorm and PyCharm 2026-11-22 (the rainbow brackets of the user's PyCharm had hidden it on screen): a
  // namespace prefix is XML_NS_PREFIX, its `:` part of the tag name (the prefix an `xmlns:` declares is an attribute name
  // to the grammar); the `=` of an attribute is the value, the only text of a tag with no scope of its own; the name in
  // `<?xml` is an attribute name; the CDATA markers are text
  { from: ['XML_NS_PREFIX', 'DEFAULT_INSTANCE_FIELD'], name: 'XML namespace prefix', scope: ['entity.name.tag.namespace.xml'] },
  { from: ['XML_TAG_NAME', 'DEFAULT_KEYWORD'], name: 'XML namespace separator', scope: ['entity.name.tag.xml punctuation.separator.namespace.xml'] },
  { from: ['XML_ATTRIBUTE_NAME'], name: 'XML attribute prefix', scope: ['entity.other.attribute-name.namespace.xml', 'entity.other.attribute-name.xml punctuation.separator.namespace.xml'] },
  { from: ['XML_ATTRIBUTE_VALUE', 'DEFAULT_STRING'], name: 'XML attribute equals', scope: ['meta.tag.xml', 'meta.tag.preprocessor.xml'] },
  { from: ['XML_TAG_DATA', 'TEXT'], name: 'XML CDATA', scope: ['string.unquoted.cdata.xml', 'string.unquoted.cdata.xml punctuation.definition.string'] },
  { from: ['XML_PROLOGUE', 'TEXT'], name: 'XML prologue', scope: ['meta.tag.preprocessor.xml punctuation.definition.tag.xml'] },
  { from: ['XML_ATTRIBUTE_NAME', 'DEFAULT_ATTRIBUTE'], name: 'XML prologue name', scope: ['meta.tag.preprocessor.xml entity.name.tag.xml'] },
  { from: ['HTML_CUSTOM_TAG_NAME', 'HTML_TAG_NAME', 'DEFAULT_KEYWORD'], name: 'HTML custom element', scope: ['meta.tag.custom entity.name.tag'] },

  // Regular expressions (keys and fallbacks of RegExpHighlighter.java), for the regex scopes of the grammars that the
  // rules of a language do not take over (JS regex literals and Python raw strings have one color, above and below).
  // Plain characters are strings; brackets and parentheses have the brace color.
  { from: ['REGEXP.CHARACTER', 'DEFAULT_STRING'], name: 'Regex', scope: ['string.regexp', 'constant.other.character-class.set.regexp', 'constant.other.character-class.range.regexp', 'constant.other.set.regexp', 'constant.character.set.regexp'] },
  { from: ['REGEXP.CHAR_CLASS', 'DEFAULT_ENTITY'], name: 'Regex class', scope: ['constant.other.character-class.regexp', 'support.other.escape.special.regexp'] },
  { from: ['REGEXP.DOT', 'DEFAULT_DOT', 'TEXT'], name: 'Regex dot', scope: ['support.other.match.any.regexp'] },
  { from: ['REGEXP.ESC_CHARACTER', 'DEFAULT_VALID_STRING_ESCAPE'], name: 'Regex escape', scope: ['constant.character.escape.backslash.regexp', 'constant.character.escape.regexp', 'constant.character.control.regexp', 'constant.character.numeric.regexp', 'constant.character.unicode.regexp', 'keyword.other.back-reference.regexp', 'entity.name.tag.backreference.regexp', 'entity.name.tag.named.backreference.regexp'] },
  { from: ['REGEXP.META', 'DEFAULT_KEYWORD'], name: 'Regex meta', scope: ['keyword.operator.quantifier.regexp', 'keyword.control.anchor.regexp', 'keyword.operator.or.regexp', 'keyword.operator.disjunction.regexp', 'keyword.operator.negation.regexp', 'support.other.match.begin.regexp', 'support.other.match.end.regexp'] },
  { from: ['REGEXP.BRACKETS', 'DEFAULT_BRACKETS', 'TEXT'], name: 'Regex brackets', scope: ['punctuation.definition.character-class.regexp', 'punctuation.character.set.begin.regexp', 'punctuation.character.set.end.regexp', 'punctuation.character.set constant.other.set.regexp'] },
  {
    from: ['REGEXP.PARENTHS', 'DEFAULT_PARENTHS', 'TEXT'],
    name: 'Regex parentheses',
    // the IDE reads "(?=", "(?<!", "(?P<" as one parenthesis token
    scope: ['punctuation.definition.group.regexp', 'punctuation.definition.group.assertion.regexp', 'punctuation.definition.group.no-capture.regexp', 'support.other.parenthesis.regexp', 'string.regexp punctuation.parenthesis', 'string.regexp keyword.operator.lookahead', 'string.regexp keyword.operator.lookbehind', 'string.regexp keyword.operator.conditional'],
  },
  { from: ['REGEXP.NAME', 'DEFAULT_IDENTIFIER', 'TEXT'], name: 'Regex group name', scope: ['entity.name.tag.named.group.regexp'] },
  { from: ['REGEXP.OPTIONS', 'DEFAULT_PREDEFINED_SYMBOL'], name: 'Regex flags', scope: ['storage.modifier.flag.regexp'] },

  // JavaScript and TypeScript: a regex literal, its slashes and flags too, has the JS.REGEXP color (the scheme only has
  // it, JS.REGEXP is not in this repository: its fallback is the one the theme had before)
  {
    from: ['JS.REGEXP', 'DEFAULT_VALID_STRING_ESCAPE'],
    name: 'JavaScript regex',
    // one color for the whole literal, its quantifiers, groups and classes too (captured in WebStorm 2026-11-22)
    scope: ['ts', 'tsx', 'js'].flatMap((suffix) => [
      `string.regexp.${suffix}`,
      `string.regexp.${suffix} punctuation.definition.string`,
      `string.regexp.${suffix} keyword.other.${suffix}`,
      ...JS_REGEXP_PARTS.map((part) => `string.regexp.${suffix} ${part}`),
    ]),
  },

  // JavaScript and TypeScript, captured in WebStorm 2026-11-22: a property declaration is a field, a property access and
  // a parameter text, a local variable (declared in a block) its own color, the code of `${…}` code (its braces text), a
  // method declaration the member function color, a type parameter TypeScript's own color. JSX scopes end in `.js.jsx`,
  // so the `.js` rules reach them
  ...['ts', 'tsx', 'js'].flatMap((suffix) => [
    { from: ['DEFAULT_INSTANCE_FIELD'], name: `JavaScript field ${suffix}`, scope: [`meta.definition.property.${suffix} variable.object.property.${suffix}`] },
    { from: ['TEXT'], name: `JavaScript property access ${suffix}`, scope: [`variable.other.property.${suffix}`, `variable.other.object.property.${suffix}`, `variable.parameter.${suffix}`] },
    {
      from: ['JS.LOCAL_VARIABLE', 'DEFAULT_LOCAL_VARIABLE'],
      name: `JavaScript local variable ${suffix}`,
      scope: [`meta.block.${suffix} meta.definition.variable.${suffix} variable.other.constant.${suffix}`, `meta.block.${suffix} meta.definition.variable.${suffix} variable.other.readwrite.${suffix}`],
    },
    { from: ['TEXT'], name: `JavaScript template expression ${suffix}`, scope: [`meta.template.expression.${suffix}`, `punctuation.definition.template-expression.begin.${suffix}`, `punctuation.definition.template-expression.end.${suffix}`] },
    { from: JS_MEMBER_FUNCTION, name: `JavaScript method ${suffix}`, scope: [`meta.definition.method.${suffix} entity.name.function.${suffix}`] },
    { from: JS_TYPE_PARAMETER, name: `TypeScript type parameter ${suffix}`, scope: [`meta.type.parameters.${suffix} entity.name.type.${suffix}`] },
  ]),

  // Shell
  // Shell (ShHighlighterColors.java): an unquoted word (an argument, an option) is text, only quoted strings are strings
  { from: ['BASH.EXTERNAL_COMMAND'], name: 'Shell command', scope: ['entity.name.command.shell'] },
  { from: ['BASH.INTERNAL_COMMAND'], name: 'Shell builtin', scope: ['support.function.builtin.shell'] },
  { from: ['BASH.FUNCTION_DEF_NAME'], name: 'Shell function', scope: ['entity.name.function.shell'] },
  {
    from: ['BASH.VAR_USE'],
    name: 'Shell variable',
    scope: ['variable.other.normal.shell', 'variable.parameter.positional.shell', 'variable.parameter.positional.all.shell', 'variable.language.special.shell', 'punctuation.definition.variable.shell'],
  },
  { from: ['BASH.VAR_DEF'], name: 'Shell variable definition', scope: ['variable.other.assignment.shell'] },
  // A variable inside double quotes is part of the string; the shebang is text, bold (seen in PyCharm 2026-11-21)
  {
    from: ['BASH.STRING'],
    name: 'Shell variable in a string',
    scope: ['string.quoted.double.shell variable.other.normal.shell', 'string.quoted.double.shell variable.parameter.positional.shell', 'string.quoted.double.shell punctuation.definition.variable.shell'],
  },
  { from: ['BASH.SHEBANG', 'TEXT'], name: 'Shell shebang', scope: ['meta.shebang.shell', 'punctuation.definition.comment.shebang.shell'] },
  { from: ['TEXT'], name: 'Shell word', scope: ['string.unquoted.argument.shell', 'constant.other.option.dash.shell', 'meta.statement.command.shell constant.other.option'] },

  // Groovy (GroovySyntaxHighlighter.java, keys named like their settings): like Java, class names are not keywords and the
  // package paths are identifiers; a map key is a string
  { from: ['Class', 'TEXT'], name: 'Groovy class name', scope: ['storage.type.groovy'] },
  { from: ['DEFAULT_IDENTIFIER'], name: 'Groovy package', scope: ['storage.modifier.package.groovy', 'storage.modifier.import.groovy'] },
  { from: ['Map key'], name: 'Groovy map key', scope: ['constant.other.key.groovy'] },
  // GroovyDarcula sets the method declaration to nothing: text (the grammar names it like Java's)
  { from: ['Groovy method declaration', 'TEXT'], name: 'Groovy method declaration', scope: ['meta.definition.method.groovy entity.name.function'] },

  // reStructuredText (RestSyntaxHighlighter.java): a section header is a number, emphasis is text (bold, italic), an inline
  // literal a string on a background (seen in PyCharm 2026-11-21), a reference is a string, a directive is a keyword
  { from: ['REST.SECTION.HEADER'], name: 'reST section header', scope: ['source.rst markup.heading'] },
  { from: ['REST.BOLD', 'TEXT'], name: 'reST bold', scope: ['source.rst markup.bold'] },
  { from: ['REST.ITALIC', 'TEXT'], name: 'reST italic', scope: ['source.rst markup.italic'] },
  { from: ['REST.FIXED', 'DEFAULT_STRING'], name: 'reST literal', scope: ['source.rst string.interpolated'] },
  { from: ['REST.REF.NAME'], name: 'reST reference', scope: ['source.rst entity.name.tag'] },
  { from: ['REST.EXPLICIT'], name: 'reST directive', scope: ['source.rst keyword.control'] },
  { from: ['REST.LINE_COMMENT'], name: 'reST comment', scope: ['source.rst comment.block'] },
];

/**
 * VS Code semantic tokens (language servers: Pylance, TypeScript…), `type.modifier` selectors. The colors of the IDE
 * come from its own analysis, which they replace for the code a language server knows.
 */
// Not `variable.readonly`: TypeScript gives it to every `const`, which the IDE does not color as a constant
export const SEMANTIC_RULES: Record<string, string[]> = {
  '*.deprecated': ['DEPRECATED_ATTRIBUTES'],
  // Rust (rust-analyzer), as RustRover draws it: calls are text, declarations blue, macros blue, lifetimes teal
  'attribute:rust': ['org.rust.ATTRIBUTE'],
  'attributeBracket:rust': ['org.rust.ATTRIBUTE'],
  'builtinType:rust': ['org.rust.PRIMITIVE_TYPE'],
  class: ['DEFAULT_CLASS_NAME', 'DEFAULT_CLASS_REFERENCE', 'TEXT'],
  'class.builtin': ['PY.BUILTIN_NAME', 'DEFAULT_PREDEFINED_SYMBOL', 'DEFAULT_CLASS_REFERENCE', 'TEXT'],
  clsParameter: ['PY.SELF_PARAMETER', 'DEFAULT_KEYWORD'],
  decorator: ['PY.DECORATOR', 'DEFAULT_METADATA'],
  enumMember: ['DEFAULT_CONSTANT'],
  function: ['DEFAULT_FUNCTION_CALL', 'TEXT'],
  'function.builtin': ['PY.BUILTIN_NAME', 'DEFAULT_PREDEFINED_SYMBOL', 'DEFAULT_FUNCTION_CALL', 'TEXT'],
  'function.declaration': ['DEFAULT_FUNCTION_DECLARATION'],
  'function.declaration:rust': ['org.rust.FUNCTION'],
  'function:rust': ['org.rust.FUNCTION_CALL', 'TEXT'],
  interface: ['DEFAULT_INTERFACE_NAME', 'DEFAULT_CLASS_NAME', 'TEXT'],
  'lifetime:rust': ['TYPE_PARAMETER_NAME_ATTRIBUTES'],
  macro: ['DEFAULT_METADATA'],
  'macro:rust': ['DEFAULT_FUNCTION_DECLARATION'],
  method: ['DEFAULT_INSTANCE_METHOD', 'DEFAULT_FUNCTION_CALL', 'TEXT'],
  'method.declaration': ['DEFAULT_FUNCTION_DECLARATION'],
  'method.declaration:python': ['PY.FUNC_DEFINITION', 'DEFAULT_FUNCTION_DECLARATION'],
  'method.declaration:rust': ['org.rust.METHOD'],
  'method.static': ['DEFAULT_STATIC_METHOD', 'DEFAULT_INSTANCE_METHOD', 'TEXT'],
  // JavaScript and TypeScript (keys of the JavaScript plugin that the Islands scheme colors): members, and the globals
  // of the standard and DOM libraries (console, window, Math…), which the language server marks `defaultLibrary`
  'method:javascript': JS_MEMBER_FUNCTION,
  'method:javascriptreact': JS_MEMBER_FUNCTION,
  'method:python': ['PY.METHOD_CALL', 'PY.FUNCTION_CALL', 'DEFAULT_FUNCTION_CALL', 'TEXT'],
  'method:rust': ['org.rust.METHOD_CALL', 'TEXT'],
  'method:typescript': JS_MEMBER_FUNCTION,
  'method:typescriptreact': JS_MEMBER_FUNCTION,
  namespace: ['DEFAULT_IDENTIFIER', 'TEXT'],
  parameter: ['DEFAULT_PARAMETER', 'DEFAULT_IDENTIFIER', 'TEXT'],
  property: ['DEFAULT_INSTANCE_FIELD'],
  'property.readonly': ['DEFAULT_INSTANCE_FIELD'],
  'property.static': ['DEFAULT_STATIC_FIELD', 'DEFAULT_INSTANCE_FIELD'],
  'property:python': ['DEFAULT_IDENTIFIER', 'TEXT'],
  'selfKeyword:rust': ['org.rust.SELF_PARAMETER'],
  selfParameter: ['PY.SELF_PARAMETER', 'DEFAULT_KEYWORD'],
  typeParameter: ['TYPE_PARAMETER_NAME_ATTRIBUTES'],
  'variable.defaultLibrary:javascript': JS_GLOBAL_VARIABLE,
  'variable.defaultLibrary:javascriptreact': JS_GLOBAL_VARIABLE,
  'variable.defaultLibrary:typescript': JS_GLOBAL_VARIABLE,
  'variable.defaultLibrary:typescriptreact': JS_GLOBAL_VARIABLE,
  ...Object.fromEntries(
    JS_LANGUAGES.flatMap((language) => [
      // WebStorm (captured 2026-11-22): a parameter and a property access are text, a declaration a field; locals and type
      // parameters have their keys. A selector scores 100 a modifier and 10 its language (check:semantic), so the
      // modifiers of the general rules (`property.readonly`, `method.declaration`) are repeated here: `this.options` of a
      // readonly property is text, a readonly parameter (a parameter property) a field, a method declaration a member
      [`parameter:${language}`, ['TEXT']],
      [`parameter.declaration.readonly:${language}`, ['DEFAULT_INSTANCE_FIELD']],
      [`property:${language}`, ['TEXT']],
      [`property.readonly:${language}`, ['TEXT']],
      [`property.readonly.static:${language}`, ['DEFAULT_STATIC_FIELD', 'DEFAULT_INSTANCE_FIELD']],
      [`property.declaration:${language}`, ['DEFAULT_INSTANCE_FIELD']],
      [`property.declaration.readonly:${language}`, ['DEFAULT_INSTANCE_FIELD']],
      [`property.declaration.static:${language}`, ['DEFAULT_STATIC_FIELD', 'DEFAULT_INSTANCE_FIELD']],
      [`property.declaration.readonly.static:${language}`, ['DEFAULT_STATIC_FIELD', 'DEFAULT_INSTANCE_FIELD']],
      [`method.declaration:${language}`, JS_MEMBER_FUNCTION],
      [`typeParameter:${language}`, JS_TYPE_PARAMETER],
      [`variable.local:${language}`, ['JS.LOCAL_VARIABLE', 'DEFAULT_LOCAL_VARIABLE']],
    ]),
  ),
  'variable:python': ['PY.LOCAL_VARIABLE', 'DEFAULT_LOCAL_VARIABLE', 'DEFAULT_IDENTIFIER', 'TEXT'],
};
