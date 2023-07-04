import { CharStreams, CommonTokenStream } from 'antlr4ts';
import { InlineErrorListener } from './errorListener';
import { Visitor } from './visitor';
import type { DeclaredStyleDeclaration } from '@neditor/core/engine/cssom/declared_style_declaration';
import { inlineLexer } from '@neditor/css-parser/gen/inlineLexer';
import { inlineParser } from '@neditor/css-parser/gen/inlineParser';

export class Interpretor {
  apply(target: DeclaredStyleDeclaration, styleText: string) {
    const inputStream = CharStreams.fromString(styleText);
    const lexer = new inlineLexer(inputStream);
    const lexerErrorListener = new InlineErrorListener();
    lexer.addErrorListener(lexerErrorListener);
    const commonTokenStream = new CommonTokenStream(lexer);
    const parser = new inlineParser(commonTokenStream);
    parser.buildParseTree = true;
    const parserErrorListener = new InlineErrorListener();
    parser.addErrorListener(parserErrorListener);
    const tree = parser.inlineStyle();
    const visitor = new Visitor(target);
    tree.accept(visitor);
  }
}
