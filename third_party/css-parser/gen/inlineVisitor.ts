// Generated from inline.g4 by ANTLR 4.9.0-SNAPSHOT


import { ParseTreeVisitor } from "antlr4ts/tree/ParseTreeVisitor";

import { GoodOperatorContext } from "./inlineParser";
import { GoodPropertyContext } from "./inlineParser";
import { BadPropertyContext } from "./inlineParser";
import { KnownDeclarationContext } from "./inlineParser";
import { UnknownDeclarationContext } from "./inlineParser";
import { KnownTermContext } from "./inlineParser";
import { UnknownTermContext } from "./inlineParser";
import { InlineStyleContext } from "./inlineParser";
import { DeclarationListContext } from "./inlineParser";
import { Operator_Context } from "./inlineParser";
import { Property_Context } from "./inlineParser";
import { DeclarationContext } from "./inlineParser";
import { ValueContext } from "./inlineParser";
import { ExprContext } from "./inlineParser";
import { TermContext } from "./inlineParser";
import { Function_Context } from "./inlineParser";
import { HexcolorContext } from "./inlineParser";
import { NumberContext } from "./inlineParser";
import { PercentageContext } from "./inlineParser";
import { DimensionContext } from "./inlineParser";
import { UnknownDimensionContext } from "./inlineParser";
import { Any_Context } from "./inlineParser";
import { GeneralEnclosedContext } from "./inlineParser";
import { UnusedContext } from "./inlineParser";
import { Var_Context } from "./inlineParser";
import { CalcContext } from "./inlineParser";
import { CalcSumContext } from "./inlineParser";
import { CalcProductContext } from "./inlineParser";
import { CalcValueContext } from "./inlineParser";
import { IdentContext } from "./inlineParser";
import { WsContext } from "./inlineParser";


/**
 * This interface defines a complete generic visitor for a parse tree produced
 * by `inlineParser`.
 *
 * @param <Result> The return type of the visit operation. Use `void` for
 * operations with no return type.
 */
export interface inlineVisitor<Result> extends ParseTreeVisitor<Result> {
	/**
	 * Visit a parse tree produced by the `goodOperator`
	 * labeled alternative in `inlineParser.operator_`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitGoodOperator?: (ctx: GoodOperatorContext) => Result;

	/**
	 * Visit a parse tree produced by the `goodProperty`
	 * labeled alternative in `inlineParser.property_`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitGoodProperty?: (ctx: GoodPropertyContext) => Result;

	/**
	 * Visit a parse tree produced by the `badProperty`
	 * labeled alternative in `inlineParser.property_`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitBadProperty?: (ctx: BadPropertyContext) => Result;

	/**
	 * Visit a parse tree produced by the `knownDeclaration`
	 * labeled alternative in `inlineParser.declaration`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitKnownDeclaration?: (ctx: KnownDeclarationContext) => Result;

	/**
	 * Visit a parse tree produced by the `unknownDeclaration`
	 * labeled alternative in `inlineParser.declaration`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitUnknownDeclaration?: (ctx: UnknownDeclarationContext) => Result;

	/**
	 * Visit a parse tree produced by the `knownTerm`
	 * labeled alternative in `inlineParser.term`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitKnownTerm?: (ctx: KnownTermContext) => Result;

	/**
	 * Visit a parse tree produced by the `unknownTerm`
	 * labeled alternative in `inlineParser.term`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitUnknownTerm?: (ctx: UnknownTermContext) => Result;

	/**
	 * Visit a parse tree produced by `inlineParser.inlineStyle`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitInlineStyle?: (ctx: InlineStyleContext) => Result;

	/**
	 * Visit a parse tree produced by `inlineParser.declarationList`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitDeclarationList?: (ctx: DeclarationListContext) => Result;

	/**
	 * Visit a parse tree produced by `inlineParser.operator_`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitOperator_?: (ctx: Operator_Context) => Result;

	/**
	 * Visit a parse tree produced by `inlineParser.property_`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitProperty_?: (ctx: Property_Context) => Result;

	/**
	 * Visit a parse tree produced by `inlineParser.declaration`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitDeclaration?: (ctx: DeclarationContext) => Result;

	/**
	 * Visit a parse tree produced by `inlineParser.value`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitValue?: (ctx: ValueContext) => Result;

	/**
	 * Visit a parse tree produced by `inlineParser.expr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitExpr?: (ctx: ExprContext) => Result;

	/**
	 * Visit a parse tree produced by `inlineParser.term`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitTerm?: (ctx: TermContext) => Result;

	/**
	 * Visit a parse tree produced by `inlineParser.function_`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitFunction_?: (ctx: Function_Context) => Result;

	/**
	 * Visit a parse tree produced by `inlineParser.hexcolor`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitHexcolor?: (ctx: HexcolorContext) => Result;

	/**
	 * Visit a parse tree produced by `inlineParser.number`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitNumber?: (ctx: NumberContext) => Result;

	/**
	 * Visit a parse tree produced by `inlineParser.percentage`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitPercentage?: (ctx: PercentageContext) => Result;

	/**
	 * Visit a parse tree produced by `inlineParser.dimension`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitDimension?: (ctx: DimensionContext) => Result;

	/**
	 * Visit a parse tree produced by `inlineParser.unknownDimension`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitUnknownDimension?: (ctx: UnknownDimensionContext) => Result;

	/**
	 * Visit a parse tree produced by `inlineParser.any_`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitAny_?: (ctx: Any_Context) => Result;

	/**
	 * Visit a parse tree produced by `inlineParser.generalEnclosed`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitGeneralEnclosed?: (ctx: GeneralEnclosedContext) => Result;

	/**
	 * Visit a parse tree produced by `inlineParser.unused`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitUnused?: (ctx: UnusedContext) => Result;

	/**
	 * Visit a parse tree produced by `inlineParser.var_`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitVar_?: (ctx: Var_Context) => Result;

	/**
	 * Visit a parse tree produced by `inlineParser.calc`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitCalc?: (ctx: CalcContext) => Result;

	/**
	 * Visit a parse tree produced by `inlineParser.calcSum`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitCalcSum?: (ctx: CalcSumContext) => Result;

	/**
	 * Visit a parse tree produced by `inlineParser.calcProduct`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitCalcProduct?: (ctx: CalcProductContext) => Result;

	/**
	 * Visit a parse tree produced by `inlineParser.calcValue`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitCalcValue?: (ctx: CalcValueContext) => Result;

	/**
	 * Visit a parse tree produced by `inlineParser.ident`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitIdent?: (ctx: IdentContext) => Result;

	/**
	 * Visit a parse tree produced by `inlineParser.ws`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitWs?: (ctx: WsContext) => Result;
}

