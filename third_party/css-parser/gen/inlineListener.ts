// Generated from inline.g4 by ANTLR 4.9.0-SNAPSHOT


import { ParseTreeListener } from "antlr4ts/tree/ParseTreeListener";

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
 * This interface defines a complete listener for a parse tree produced by
 * `inlineParser`.
 */
export interface inlineListener extends ParseTreeListener {
	/**
	 * Enter a parse tree produced by the `goodOperator`
	 * labeled alternative in `inlineParser.operator_`.
	 * @param ctx the parse tree
	 */
	enterGoodOperator?: (ctx: GoodOperatorContext) => void;
	/**
	 * Exit a parse tree produced by the `goodOperator`
	 * labeled alternative in `inlineParser.operator_`.
	 * @param ctx the parse tree
	 */
	exitGoodOperator?: (ctx: GoodOperatorContext) => void;

	/**
	 * Enter a parse tree produced by the `goodProperty`
	 * labeled alternative in `inlineParser.property_`.
	 * @param ctx the parse tree
	 */
	enterGoodProperty?: (ctx: GoodPropertyContext) => void;
	/**
	 * Exit a parse tree produced by the `goodProperty`
	 * labeled alternative in `inlineParser.property_`.
	 * @param ctx the parse tree
	 */
	exitGoodProperty?: (ctx: GoodPropertyContext) => void;

	/**
	 * Enter a parse tree produced by the `badProperty`
	 * labeled alternative in `inlineParser.property_`.
	 * @param ctx the parse tree
	 */
	enterBadProperty?: (ctx: BadPropertyContext) => void;
	/**
	 * Exit a parse tree produced by the `badProperty`
	 * labeled alternative in `inlineParser.property_`.
	 * @param ctx the parse tree
	 */
	exitBadProperty?: (ctx: BadPropertyContext) => void;

	/**
	 * Enter a parse tree produced by the `knownDeclaration`
	 * labeled alternative in `inlineParser.declaration`.
	 * @param ctx the parse tree
	 */
	enterKnownDeclaration?: (ctx: KnownDeclarationContext) => void;
	/**
	 * Exit a parse tree produced by the `knownDeclaration`
	 * labeled alternative in `inlineParser.declaration`.
	 * @param ctx the parse tree
	 */
	exitKnownDeclaration?: (ctx: KnownDeclarationContext) => void;

	/**
	 * Enter a parse tree produced by the `unknownDeclaration`
	 * labeled alternative in `inlineParser.declaration`.
	 * @param ctx the parse tree
	 */
	enterUnknownDeclaration?: (ctx: UnknownDeclarationContext) => void;
	/**
	 * Exit a parse tree produced by the `unknownDeclaration`
	 * labeled alternative in `inlineParser.declaration`.
	 * @param ctx the parse tree
	 */
	exitUnknownDeclaration?: (ctx: UnknownDeclarationContext) => void;

	/**
	 * Enter a parse tree produced by the `knownTerm`
	 * labeled alternative in `inlineParser.term`.
	 * @param ctx the parse tree
	 */
	enterKnownTerm?: (ctx: KnownTermContext) => void;
	/**
	 * Exit a parse tree produced by the `knownTerm`
	 * labeled alternative in `inlineParser.term`.
	 * @param ctx the parse tree
	 */
	exitKnownTerm?: (ctx: KnownTermContext) => void;

	/**
	 * Enter a parse tree produced by the `unknownTerm`
	 * labeled alternative in `inlineParser.term`.
	 * @param ctx the parse tree
	 */
	enterUnknownTerm?: (ctx: UnknownTermContext) => void;
	/**
	 * Exit a parse tree produced by the `unknownTerm`
	 * labeled alternative in `inlineParser.term`.
	 * @param ctx the parse tree
	 */
	exitUnknownTerm?: (ctx: UnknownTermContext) => void;

	/**
	 * Enter a parse tree produced by `inlineParser.inlineStyle`.
	 * @param ctx the parse tree
	 */
	enterInlineStyle?: (ctx: InlineStyleContext) => void;
	/**
	 * Exit a parse tree produced by `inlineParser.inlineStyle`.
	 * @param ctx the parse tree
	 */
	exitInlineStyle?: (ctx: InlineStyleContext) => void;

	/**
	 * Enter a parse tree produced by `inlineParser.declarationList`.
	 * @param ctx the parse tree
	 */
	enterDeclarationList?: (ctx: DeclarationListContext) => void;
	/**
	 * Exit a parse tree produced by `inlineParser.declarationList`.
	 * @param ctx the parse tree
	 */
	exitDeclarationList?: (ctx: DeclarationListContext) => void;

	/**
	 * Enter a parse tree produced by `inlineParser.operator_`.
	 * @param ctx the parse tree
	 */
	enterOperator_?: (ctx: Operator_Context) => void;
	/**
	 * Exit a parse tree produced by `inlineParser.operator_`.
	 * @param ctx the parse tree
	 */
	exitOperator_?: (ctx: Operator_Context) => void;

	/**
	 * Enter a parse tree produced by `inlineParser.property_`.
	 * @param ctx the parse tree
	 */
	enterProperty_?: (ctx: Property_Context) => void;
	/**
	 * Exit a parse tree produced by `inlineParser.property_`.
	 * @param ctx the parse tree
	 */
	exitProperty_?: (ctx: Property_Context) => void;

	/**
	 * Enter a parse tree produced by `inlineParser.declaration`.
	 * @param ctx the parse tree
	 */
	enterDeclaration?: (ctx: DeclarationContext) => void;
	/**
	 * Exit a parse tree produced by `inlineParser.declaration`.
	 * @param ctx the parse tree
	 */
	exitDeclaration?: (ctx: DeclarationContext) => void;

	/**
	 * Enter a parse tree produced by `inlineParser.value`.
	 * @param ctx the parse tree
	 */
	enterValue?: (ctx: ValueContext) => void;
	/**
	 * Exit a parse tree produced by `inlineParser.value`.
	 * @param ctx the parse tree
	 */
	exitValue?: (ctx: ValueContext) => void;

	/**
	 * Enter a parse tree produced by `inlineParser.expr`.
	 * @param ctx the parse tree
	 */
	enterExpr?: (ctx: ExprContext) => void;
	/**
	 * Exit a parse tree produced by `inlineParser.expr`.
	 * @param ctx the parse tree
	 */
	exitExpr?: (ctx: ExprContext) => void;

	/**
	 * Enter a parse tree produced by `inlineParser.term`.
	 * @param ctx the parse tree
	 */
	enterTerm?: (ctx: TermContext) => void;
	/**
	 * Exit a parse tree produced by `inlineParser.term`.
	 * @param ctx the parse tree
	 */
	exitTerm?: (ctx: TermContext) => void;

	/**
	 * Enter a parse tree produced by `inlineParser.function_`.
	 * @param ctx the parse tree
	 */
	enterFunction_?: (ctx: Function_Context) => void;
	/**
	 * Exit a parse tree produced by `inlineParser.function_`.
	 * @param ctx the parse tree
	 */
	exitFunction_?: (ctx: Function_Context) => void;

	/**
	 * Enter a parse tree produced by `inlineParser.hexcolor`.
	 * @param ctx the parse tree
	 */
	enterHexcolor?: (ctx: HexcolorContext) => void;
	/**
	 * Exit a parse tree produced by `inlineParser.hexcolor`.
	 * @param ctx the parse tree
	 */
	exitHexcolor?: (ctx: HexcolorContext) => void;

	/**
	 * Enter a parse tree produced by `inlineParser.number`.
	 * @param ctx the parse tree
	 */
	enterNumber?: (ctx: NumberContext) => void;
	/**
	 * Exit a parse tree produced by `inlineParser.number`.
	 * @param ctx the parse tree
	 */
	exitNumber?: (ctx: NumberContext) => void;

	/**
	 * Enter a parse tree produced by `inlineParser.percentage`.
	 * @param ctx the parse tree
	 */
	enterPercentage?: (ctx: PercentageContext) => void;
	/**
	 * Exit a parse tree produced by `inlineParser.percentage`.
	 * @param ctx the parse tree
	 */
	exitPercentage?: (ctx: PercentageContext) => void;

	/**
	 * Enter a parse tree produced by `inlineParser.dimension`.
	 * @param ctx the parse tree
	 */
	enterDimension?: (ctx: DimensionContext) => void;
	/**
	 * Exit a parse tree produced by `inlineParser.dimension`.
	 * @param ctx the parse tree
	 */
	exitDimension?: (ctx: DimensionContext) => void;

	/**
	 * Enter a parse tree produced by `inlineParser.unknownDimension`.
	 * @param ctx the parse tree
	 */
	enterUnknownDimension?: (ctx: UnknownDimensionContext) => void;
	/**
	 * Exit a parse tree produced by `inlineParser.unknownDimension`.
	 * @param ctx the parse tree
	 */
	exitUnknownDimension?: (ctx: UnknownDimensionContext) => void;

	/**
	 * Enter a parse tree produced by `inlineParser.any_`.
	 * @param ctx the parse tree
	 */
	enterAny_?: (ctx: Any_Context) => void;
	/**
	 * Exit a parse tree produced by `inlineParser.any_`.
	 * @param ctx the parse tree
	 */
	exitAny_?: (ctx: Any_Context) => void;

	/**
	 * Enter a parse tree produced by `inlineParser.generalEnclosed`.
	 * @param ctx the parse tree
	 */
	enterGeneralEnclosed?: (ctx: GeneralEnclosedContext) => void;
	/**
	 * Exit a parse tree produced by `inlineParser.generalEnclosed`.
	 * @param ctx the parse tree
	 */
	exitGeneralEnclosed?: (ctx: GeneralEnclosedContext) => void;

	/**
	 * Enter a parse tree produced by `inlineParser.unused`.
	 * @param ctx the parse tree
	 */
	enterUnused?: (ctx: UnusedContext) => void;
	/**
	 * Exit a parse tree produced by `inlineParser.unused`.
	 * @param ctx the parse tree
	 */
	exitUnused?: (ctx: UnusedContext) => void;

	/**
	 * Enter a parse tree produced by `inlineParser.var_`.
	 * @param ctx the parse tree
	 */
	enterVar_?: (ctx: Var_Context) => void;
	/**
	 * Exit a parse tree produced by `inlineParser.var_`.
	 * @param ctx the parse tree
	 */
	exitVar_?: (ctx: Var_Context) => void;

	/**
	 * Enter a parse tree produced by `inlineParser.calc`.
	 * @param ctx the parse tree
	 */
	enterCalc?: (ctx: CalcContext) => void;
	/**
	 * Exit a parse tree produced by `inlineParser.calc`.
	 * @param ctx the parse tree
	 */
	exitCalc?: (ctx: CalcContext) => void;

	/**
	 * Enter a parse tree produced by `inlineParser.calcSum`.
	 * @param ctx the parse tree
	 */
	enterCalcSum?: (ctx: CalcSumContext) => void;
	/**
	 * Exit a parse tree produced by `inlineParser.calcSum`.
	 * @param ctx the parse tree
	 */
	exitCalcSum?: (ctx: CalcSumContext) => void;

	/**
	 * Enter a parse tree produced by `inlineParser.calcProduct`.
	 * @param ctx the parse tree
	 */
	enterCalcProduct?: (ctx: CalcProductContext) => void;
	/**
	 * Exit a parse tree produced by `inlineParser.calcProduct`.
	 * @param ctx the parse tree
	 */
	exitCalcProduct?: (ctx: CalcProductContext) => void;

	/**
	 * Enter a parse tree produced by `inlineParser.calcValue`.
	 * @param ctx the parse tree
	 */
	enterCalcValue?: (ctx: CalcValueContext) => void;
	/**
	 * Exit a parse tree produced by `inlineParser.calcValue`.
	 * @param ctx the parse tree
	 */
	exitCalcValue?: (ctx: CalcValueContext) => void;

	/**
	 * Enter a parse tree produced by `inlineParser.ident`.
	 * @param ctx the parse tree
	 */
	enterIdent?: (ctx: IdentContext) => void;
	/**
	 * Exit a parse tree produced by `inlineParser.ident`.
	 * @param ctx the parse tree
	 */
	exitIdent?: (ctx: IdentContext) => void;

	/**
	 * Enter a parse tree produced by `inlineParser.ws`.
	 * @param ctx the parse tree
	 */
	enterWs?: (ctx: WsContext) => void;
	/**
	 * Exit a parse tree produced by `inlineParser.ws`.
	 * @param ctx the parse tree
	 */
	exitWs?: (ctx: WsContext) => void;
}

