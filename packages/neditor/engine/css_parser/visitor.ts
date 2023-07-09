import { TerminalNode } from 'antlr4ts/tree/TerminalNode';
import { ErrorNode, ParseTree, RuleNode } from 'antlr4ts/tree';
import { NOTIMPLEMENTED, NOTREACHED } from '@neditor/core/base/common/notreached';
import { Any_Context, BadPropertyContext, CalcContext, CalcProductContext, CalcSumContext, CalcValueContext, DeclarationListContext, DimensionContext, ExprContext, Function_Context, GeneralEnclosedContext, GoodOperatorContext, GoodPropertyContext, HexcolorContext, IdentContext, InlineStyleContext, KnownDeclarationContext, KnownTermContext, NumberContext, Operator_Context, PercentageContext, Property_Context, TermContext, UnknownDeclarationContext, UnknownDimensionContext, UnknownTermContext, UnusedContext, ValueContext, Var_Context, WsContext } from '@neditor/css-parser/gen/inlineParser';
import { PropertyValue } from '@neditor/core/engine/cssom/property_value';
import { LengthUnit, LengthValue } from '@neditor/core/engine/cssom/length_value';
import { URLValue } from '@neditor/core/engine/cssom/url_value';
import { KeywordValue } from '@neditor/core/engine/cssom/keyword_value';
import { RGBAColorValue } from '@neditor/core/engine/cssom/rgba_color_value';
import { DCHECK } from '@neditor/core/base/check';
import type { DeclaredStyleDeclaration } from '@neditor/core/engine/cssom/declared_style_declaration';
import type { CobaltCSSStyleDeclaration } from '@neditor/core/engine/cssom/style_declaration';
import { inlineVisitor } from '@neditor/css-parser/gen/inlineVisitor';
import { StringValue } from '../cssom/string_value';
import { GetPropertyKey, PropertyKey } from '../cssom/property_definitions';
import { unpack } from './shorthandToLonghand';

export class Visitor implements inlineVisitor<void> {
  private currentKey: string | null = null;
  private currentValue: PropertyValue | null = null;
  private terms: PropertyValue[] = [];
  private args: any[] = [];

  private currentKeyIsColor() {
    DCHECK(this.currentKey);
    return this.currentKey.endsWith('color') || this.currentKey.endsWith('Color');
  }

  constructor(protected style: DeclaredStyleDeclaration) {
  }
  visitInlineStyle(ctx: InlineStyleContext): void {
    ctx.children!.forEach(c => c.accept(this));
  }
  visitAny_(ctx: Any_Context): void {
    NOTIMPLEMENTED();
  }
  visitBadProperty(ctx: BadPropertyContext): void {
    NOTIMPLEMENTED();
  }
  visitCalc(ctx: CalcContext): void {
    NOTIMPLEMENTED();
  }
  visitCalcProduct(ctx: CalcProductContext): void {
    NOTIMPLEMENTED();
  }
  visitCalcSum(ctx: CalcSumContext): void {
    NOTIMPLEMENTED();
  }
  visitCalcValue(ctx: CalcValueContext): void {
    NOTIMPLEMENTED();
  }
  visitDeclarationList(ctx: DeclarationListContext): void {
    ctx.children!.forEach(c => c.accept(this));
  }
  visitDimension(ctx: DimensionContext): void {
    const { text } = ctx;
    if (text.endsWith('px')) {
      this.terms.push(new LengthValue(parseFloat(text), LengthUnit.kPixelsUnit));
    } else {
      NOTIMPLEMENTED();
    }
  }
  visitExpr(ctx: ExprContext): void {
    if (ctx.children!.length === 1) {
      ctx.children![0].accept(this);
      this.currentValue = this.terms[0];
    } else {
      NOTIMPLEMENTED();
    }
    this.terms.length = 0;
  }
  visitFunction_(ctx: Function_Context): void {
    const func = ctx.Function_().text;
    if (func === 'rgb(') {
      let expr = ctx.expr()!;
      DCHECK(expr);
      DCHECK(expr.children);
      this.args.length = 0;
      expr.children.forEach(c => c.accept(this));
      const [r, g, b, a] = this.args;
      this.args.length = 0;
      this.terms.push(new RGBAColorValue(r, g, b, 255));
    } else if (func === 'rgba(') {
      let expr = ctx.expr()!;
      DCHECK(expr);
      DCHECK(expr.children);
      this.args.length = 0;
      expr.children.forEach(c => c.accept(this));
      const [r, g, b, a] = this.args;
      this.args.length = 0;
      this.terms.push(new RGBAColorValue(r, g, b, a * 255));
    } else {
      NOTIMPLEMENTED();
    }

  }
  visitGeneralEnclosed(ctx: GeneralEnclosedContext): void {
    NOTIMPLEMENTED();
  }
  visitGoodOperator(ctx: GoodOperatorContext): void {
    // noop
  }
  visitGoodProperty(ctx: GoodPropertyContext): void {
    if (ctx.ident()) {
      this.currentKey = ctx.ident()!.text as keyof CobaltCSSStyleDeclaration;
    } else {
      NOTIMPLEMENTED();
    }
  }
  visitHexcolor(ctx: HexcolorContext): void {
    this.terms.push(RGBAColorValue.fromHex(ctx.text));
  }
  visitIdent(ctx: IdentContext): void {
    this.terms.push(KeywordValue.fromString(ctx.text));

  }
  visitKnownDeclaration(ctx: KnownDeclarationContext): void {
    ctx.children!.forEach(c => c.accept(this));
    if (this.currentKey && this.currentValue) {
      const key = GetPropertyKey(this.currentKey);
      DCHECK(key);
      const data = this.style.data();

      if (!unpack(data, key, this.currentValue)) {
        data.SetPropertyValue(key, this.currentValue);
      }

      this.currentKey = null;
      this.currentValue = null;
    } else {
      NOTIMPLEMENTED();
    }
  }
  visitKnownTerm(ctx: KnownTermContext): void {
    if (ctx.number()) {
      this.visitNumber(ctx.number()!);
    } else if (ctx.percentage()) {
      NOTIMPLEMENTED();
    } else if (ctx.dimension()) {
      ctx.dimension()!.accept(this);
    } else if (ctx.String_()) {
      this.terms.push(new StringValue(ctx.String_()!.text));
    } else if (ctx.UnicodeRange()) {
      NOTIMPLEMENTED();
    } else if (ctx.ident()) {
      if (this.currentKeyIsColor()) {
        this.terms.push(RGBAColorValue.fromString(ctx.ident()!.text));
      } else {
        ctx.ident()!.accept(this);
      }
    } else if (ctx.var_()) {
      NOTIMPLEMENTED();
    } else if (ctx.Uri()) {
      this.visitUri(ctx.Uri()!);
    } else if (ctx.hexcolor()) {
      this.visitHexcolor(ctx.hexcolor()!);
    } else if (ctx.calc()) {
      NOTIMPLEMENTED();
    } else if (ctx.function_()) {
      this.visitFunction_(ctx.function_()!);
    } else {
      NOTIMPLEMENTED();
    }
  }
  visitNumber(ctx: NumberContext): void {
    this.args.push(+ctx.text);
  }
  visitOperator_(ctx: Operator_Context): void {
    NOTIMPLEMENTED();
  }
  visitPercentage(ctx: PercentageContext): void {
    NOTIMPLEMENTED();
  }
  visitProperty_(ctx: Property_Context): void {
    NOTIMPLEMENTED();
  }
  visitTerm(ctx: TermContext): void {
    NOTIMPLEMENTED();
  }
  visitUnknownDeclaration(ctx: UnknownDeclarationContext): void {
    NOTIMPLEMENTED();
  }
  visitUnknownDimension(ctx: UnknownDimensionContext): void {
    NOTIMPLEMENTED();
  }
  visitUnknownTerm(ctx: UnknownTermContext): void {
    NOTIMPLEMENTED();
  }
  visitUnused(ctx: UnusedContext): void {
    NOTIMPLEMENTED();
  }
  visitValue(ctx: ValueContext): void {
    NOTIMPLEMENTED();
  }
  visitVar_(ctx: Var_Context): void {
    NOTIMPLEMENTED();
  }
  visitWs(ctx: WsContext): void {
    // noop
  }
  visit(tree: ParseTree): void {
    NOTIMPLEMENTED();
  }
  visitChildren(node: RuleNode): void {
    NOTIMPLEMENTED();
  }
  visitErrorNode(node: ErrorNode): void {
    NOTIMPLEMENTED();
  }
  visitTerminal(node: TerminalNode): void {
  }
  //#region css value
  visitUri(node: TerminalNode): void {
    const match = node.text.match(/^url\('?(.+)'?\)$/i);
    if (!match) {
      NOTREACHED();
    }
    this.terms.push(new URLValue(match[1]));
  }
  //#endregion
}
