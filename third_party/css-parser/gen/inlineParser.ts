// Generated from inline.g4 by ANTLR 4.9.0-SNAPSHOT


import { ATN } from "antlr4ts/atn/ATN";
import { ATNDeserializer } from "antlr4ts/atn/ATNDeserializer";
import { FailedPredicateException } from "antlr4ts/FailedPredicateException";
import { NotNull } from "antlr4ts/Decorators";
import { NoViableAltException } from "antlr4ts/NoViableAltException";
import { Override } from "antlr4ts/Decorators";
import { Parser } from "antlr4ts/Parser";
import { ParserRuleContext } from "antlr4ts/ParserRuleContext";
import { ParserATNSimulator } from "antlr4ts/atn/ParserATNSimulator";
import { ParseTreeListener } from "antlr4ts/tree/ParseTreeListener";
import { ParseTreeVisitor } from "antlr4ts/tree/ParseTreeVisitor";
import { RecognitionException } from "antlr4ts/RecognitionException";
import { RuleContext } from "antlr4ts/RuleContext";
//import { RuleVersion } from "antlr4ts/RuleVersion";
import { TerminalNode } from "antlr4ts/tree/TerminalNode";
import { Token } from "antlr4ts/Token";
import { TokenStream } from "antlr4ts/TokenStream";
import { Vocabulary } from "antlr4ts/Vocabulary";
import { VocabularyImpl } from "antlr4ts/VocabularyImpl";

import * as Utils from "antlr4ts/misc/Utils";

import { inlineListener } from "./inlineListener";
import { inlineVisitor } from "./inlineVisitor";


export class inlineParser extends Parser {
	public static readonly T__0 = 1;
	public static readonly T__1 = 2;
	public static readonly T__2 = 3;
	public static readonly T__3 = 4;
	public static readonly T__4 = 5;
	public static readonly T__5 = 6;
	public static readonly T__6 = 7;
	public static readonly T__7 = 8;
	public static readonly T__8 = 9;
	public static readonly Comment = 10;
	public static readonly Space = 11;
	public static readonly Includes = 12;
	public static readonly DashMatch = 13;
	public static readonly Hash = 14;
	public static readonly Important = 15;
	public static readonly Percentage = 16;
	public static readonly Uri = 17;
	public static readonly UnicodeRange = 18;
	public static readonly Dimension = 19;
	public static readonly UnknownDimension = 20;
	public static readonly Plus = 21;
	public static readonly Minus = 22;
	public static readonly Greater = 23;
	public static readonly Comma = 24;
	public static readonly Tilde = 25;
	public static readonly PseudoNot = 26;
	public static readonly Number = 27;
	public static readonly String_ = 28;
	public static readonly PrefixMatch = 29;
	public static readonly SuffixMatch = 30;
	public static readonly SubstringMatch = 31;
	public static readonly Or = 32;
	public static readonly Calc = 33;
	public static readonly Variable = 34;
	public static readonly Var = 35;
	public static readonly Ident = 36;
	public static readonly Function_ = 37;
	public static readonly RULE_inlineStyle = 0;
	public static readonly RULE_declarationList = 1;
	public static readonly RULE_operator_ = 2;
	public static readonly RULE_property_ = 3;
	public static readonly RULE_declaration = 4;
	public static readonly RULE_value = 5;
	public static readonly RULE_expr = 6;
	public static readonly RULE_term = 7;
	public static readonly RULE_function_ = 8;
	public static readonly RULE_hexcolor = 9;
	public static readonly RULE_number = 10;
	public static readonly RULE_percentage = 11;
	public static readonly RULE_dimension = 12;
	public static readonly RULE_unknownDimension = 13;
	public static readonly RULE_any_ = 14;
	public static readonly RULE_generalEnclosed = 15;
	public static readonly RULE_unused = 16;
	public static readonly RULE_var_ = 17;
	public static readonly RULE_calc = 18;
	public static readonly RULE_calcSum = 19;
	public static readonly RULE_calcProduct = 20;
	public static readonly RULE_calcValue = 21;
	public static readonly RULE_ident = 22;
	public static readonly RULE_ws = 23;
	// tslint:disable:no-trailing-whitespace
	public static readonly ruleNames: string[] = [
		"inlineStyle", "declarationList", "operator_", "property_", "declaration", 
		"value", "expr", "term", "function_", "hexcolor", "number", "percentage", 
		"dimension", "unknownDimension", "any_", "generalEnclosed", "unused", 
		"var_", "calc", "calcSum", "calcProduct", "calcValue", "ident", "ws",
	];

	private static readonly _LITERAL_NAMES: Array<string | undefined> = [
		undefined, "';'", "'/'", "'*'", "'_'", "':'", "')'", "'('", "'['", "']'", 
		undefined, undefined, "'~='", "'|='", undefined, undefined, undefined, 
		undefined, undefined, undefined, undefined, "'+'", "'-'", "'>'", "','", 
		"'~'", undefined, undefined, undefined, "'^='", "'$='", "'*='", undefined, 
		"'calc('", undefined, "'var('",
	];
	private static readonly _SYMBOLIC_NAMES: Array<string | undefined> = [
		undefined, undefined, undefined, undefined, undefined, undefined, undefined, 
		undefined, undefined, undefined, "Comment", "Space", "Includes", "DashMatch", 
		"Hash", "Important", "Percentage", "Uri", "UnicodeRange", "Dimension", 
		"UnknownDimension", "Plus", "Minus", "Greater", "Comma", "Tilde", "PseudoNot", 
		"Number", "String_", "PrefixMatch", "SuffixMatch", "SubstringMatch", "Or", 
		"Calc", "Variable", "Var", "Ident", "Function_",
	];
	public static readonly VOCABULARY: Vocabulary = new VocabularyImpl(inlineParser._LITERAL_NAMES, inlineParser._SYMBOLIC_NAMES, []);

	// @Override
	// @NotNull
	public get vocabulary(): Vocabulary {
		return inlineParser.VOCABULARY;
	}
	// tslint:enable:no-trailing-whitespace

	// @Override
	public get grammarFileName(): string { return "inline.g4"; }

	// @Override
	public get ruleNames(): string[] { return inlineParser.ruleNames; }

	// @Override
	public get serializedATN(): string { return inlineParser._serializedATN; }

	protected createFailedPredicateException(predicate?: string, message?: string): FailedPredicateException {
		return new FailedPredicateException(this, predicate, message);
	}

	constructor(input: TokenStream) {
		super(input);
		this._interp = new ParserATNSimulator(inlineParser._ATN, this);
	}
	// @RuleVersion(0)
	public inlineStyle(): InlineStyleContext {
		let _localctx: InlineStyleContext = new InlineStyleContext(this._ctx, this.state);
		this.enterRule(_localctx, 0, inlineParser.RULE_inlineStyle);
		try {
			let _alt: number;
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 48;
			this.ws();
			this.state = 55;
			this._errHandler.sync(this);
			_alt = this.interpreter.adaptivePredict(this._input, 1, this._ctx);
			while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
				if (_alt === 1) {
					{
					this.state = 53;
					this._errHandler.sync(this);
					switch ( this.interpreter.adaptivePredict(this._input, 0, this._ctx) ) {
					case 1:
						{
						this.state = 49;
						this.declarationList();
						}
						break;

					case 2:
						{
						this.state = 50;
						this.any_();
						}
						break;

					case 3:
						{
						this.state = 51;
						this.match(inlineParser.T__0);
						this.state = 52;
						this.ws();
						}
						break;
					}
					}
				}
				this.state = 57;
				this._errHandler.sync(this);
				_alt = this.interpreter.adaptivePredict(this._input, 1, this._ctx);
			}
			this.state = 58;
			this.ws();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public declarationList(): DeclarationListContext {
		let _localctx: DeclarationListContext = new DeclarationListContext(this._ctx, this.state);
		this.enterRule(_localctx, 2, inlineParser.RULE_declarationList);
		let _la: number;
		try {
			let _alt: number;
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 64;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === inlineParser.T__0) {
				{
				{
				this.state = 60;
				this.match(inlineParser.T__0);
				this.state = 61;
				this.ws();
				}
				}
				this.state = 66;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 67;
			this.declaration();
			this.state = 68;
			this.ws();
			this.state = 76;
			this._errHandler.sync(this);
			_alt = this.interpreter.adaptivePredict(this._input, 4, this._ctx);
			while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
				if (_alt === 1) {
					{
					{
					this.state = 69;
					this.match(inlineParser.T__0);
					this.state = 70;
					this.ws();
					this.state = 72;
					this._errHandler.sync(this);
					switch ( this.interpreter.adaptivePredict(this._input, 3, this._ctx) ) {
					case 1:
						{
						this.state = 71;
						this.declaration();
						}
						break;
					}
					}
					}
				}
				this.state = 78;
				this._errHandler.sync(this);
				_alt = this.interpreter.adaptivePredict(this._input, 4, this._ctx);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public operator_(): Operator_Context {
		let _localctx: Operator_Context = new Operator_Context(this._ctx, this.state);
		this.enterRule(_localctx, 4, inlineParser.RULE_operator_);
		try {
			this.state = 85;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case inlineParser.T__1:
				_localctx = new GoodOperatorContext(_localctx);
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 79;
				this.match(inlineParser.T__1);
				this.state = 80;
				this.ws();
				}
				break;
			case inlineParser.Comma:
				_localctx = new GoodOperatorContext(_localctx);
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 81;
				this.match(inlineParser.Comma);
				this.state = 82;
				this.ws();
				}
				break;
			case inlineParser.Space:
				_localctx = new GoodOperatorContext(_localctx);
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 83;
				this.match(inlineParser.Space);
				this.state = 84;
				this.ws();
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public property_(): Property_Context {
		let _localctx: Property_Context = new Property_Context(this._ctx, this.state);
		this.enterRule(_localctx, 6, inlineParser.RULE_property_);
		try {
			this.state = 96;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case inlineParser.Ident:
				_localctx = new GoodPropertyContext(_localctx);
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 87;
				this.ident();
				this.state = 88;
				this.ws();
				}
				break;
			case inlineParser.Variable:
				_localctx = new GoodPropertyContext(_localctx);
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 90;
				this.match(inlineParser.Variable);
				this.state = 91;
				this.ws();
				}
				break;
			case inlineParser.T__2:
				_localctx = new BadPropertyContext(_localctx);
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 92;
				this.match(inlineParser.T__2);
				this.state = 93;
				this.ident();
				}
				break;
			case inlineParser.T__3:
				_localctx = new BadPropertyContext(_localctx);
				this.enterOuterAlt(_localctx, 4);
				{
				this.state = 94;
				this.match(inlineParser.T__3);
				this.state = 95;
				this.ident();
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public declaration(): DeclarationContext {
		let _localctx: DeclarationContext = new DeclarationContext(this._ctx, this.state);
		this.enterRule(_localctx, 8, inlineParser.RULE_declaration);
		try {
			this.state = 108;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 7, this._ctx) ) {
			case 1:
				_localctx = new KnownDeclarationContext(_localctx);
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 98;
				this.property_();
				this.state = 99;
				this.match(inlineParser.T__4);
				this.state = 100;
				this.ws();
				this.state = 101;
				this.expr();
				}
				break;

			case 2:
				_localctx = new UnknownDeclarationContext(_localctx);
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 103;
				this.property_();
				this.state = 104;
				this.match(inlineParser.T__4);
				this.state = 105;
				this.ws();
				this.state = 106;
				this.value();
				}
				break;
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public value(): ValueContext {
		let _localctx: ValueContext = new ValueContext(this._ctx, this.state);
		this.enterRule(_localctx, 10, inlineParser.RULE_value);
		try {
			let _alt: number;
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 111;
			this._errHandler.sync(this);
			_alt = 1;
			do {
				switch (_alt) {
				case 1:
					{
					{
					this.state = 110;
					this.any_();
					}
					}
					break;
				default:
					throw new NoViableAltException(this);
				}
				this.state = 113;
				this._errHandler.sync(this);
				_alt = this.interpreter.adaptivePredict(this._input, 8, this._ctx);
			} while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public expr(): ExprContext {
		let _localctx: ExprContext = new ExprContext(this._ctx, this.state);
		this.enterRule(_localctx, 12, inlineParser.RULE_expr);
		let _la: number;
		try {
			let _alt: number;
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 115;
			this.term();
			this.state = 122;
			this._errHandler.sync(this);
			_alt = this.interpreter.adaptivePredict(this._input, 10, this._ctx);
			while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
				if (_alt === 1) {
					{
					{
					this.state = 117;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
					if ((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << inlineParser.T__1) | (1 << inlineParser.Space) | (1 << inlineParser.Comma))) !== 0)) {
						{
						this.state = 116;
						this.operator_();
						}
					}

					this.state = 119;
					this.term();
					}
					}
				}
				this.state = 124;
				this._errHandler.sync(this);
				_alt = this.interpreter.adaptivePredict(this._input, 10, this._ctx);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public term(): TermContext {
		let _localctx: TermContext = new TermContext(this._ctx, this.state);
		this.enterRule(_localctx, 14, inlineParser.RULE_term);
		try {
			this.state = 150;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 11, this._ctx) ) {
			case 1:
				_localctx = new KnownTermContext(_localctx);
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 125;
				this.number();
				this.state = 126;
				this.ws();
				}
				break;

			case 2:
				_localctx = new KnownTermContext(_localctx);
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 128;
				this.percentage();
				this.state = 129;
				this.ws();
				}
				break;

			case 3:
				_localctx = new KnownTermContext(_localctx);
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 131;
				this.dimension();
				this.state = 132;
				this.ws();
				}
				break;

			case 4:
				_localctx = new KnownTermContext(_localctx);
				this.enterOuterAlt(_localctx, 4);
				{
				this.state = 134;
				this.match(inlineParser.String_);
				this.state = 135;
				this.ws();
				}
				break;

			case 5:
				_localctx = new KnownTermContext(_localctx);
				this.enterOuterAlt(_localctx, 5);
				{
				this.state = 136;
				this.match(inlineParser.UnicodeRange);
				this.state = 137;
				this.ws();
				}
				break;

			case 6:
				_localctx = new KnownTermContext(_localctx);
				this.enterOuterAlt(_localctx, 6);
				{
				this.state = 138;
				this.ident();
				this.state = 139;
				this.ws();
				}
				break;

			case 7:
				_localctx = new KnownTermContext(_localctx);
				this.enterOuterAlt(_localctx, 7);
				{
				this.state = 141;
				this.var_();
				}
				break;

			case 8:
				_localctx = new KnownTermContext(_localctx);
				this.enterOuterAlt(_localctx, 8);
				{
				this.state = 142;
				this.match(inlineParser.Uri);
				this.state = 143;
				this.ws();
				}
				break;

			case 9:
				_localctx = new KnownTermContext(_localctx);
				this.enterOuterAlt(_localctx, 9);
				{
				this.state = 144;
				this.hexcolor();
				}
				break;

			case 10:
				_localctx = new KnownTermContext(_localctx);
				this.enterOuterAlt(_localctx, 10);
				{
				this.state = 145;
				this.calc();
				}
				break;

			case 11:
				_localctx = new KnownTermContext(_localctx);
				this.enterOuterAlt(_localctx, 11);
				{
				this.state = 146;
				this.function_();
				}
				break;

			case 12:
				_localctx = new UnknownTermContext(_localctx);
				this.enterOuterAlt(_localctx, 12);
				{
				this.state = 147;
				this.unknownDimension();
				this.state = 148;
				this.ws();
				}
				break;
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public function_(): Function_Context {
		let _localctx: Function_Context = new Function_Context(this._ctx, this.state);
		this.enterRule(_localctx, 16, inlineParser.RULE_function_);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 152;
			this.match(inlineParser.Function_);
			this.state = 153;
			this.ws();
			this.state = 154;
			this.expr();
			this.state = 155;
			this.match(inlineParser.T__5);
			this.state = 156;
			this.ws();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public hexcolor(): HexcolorContext {
		let _localctx: HexcolorContext = new HexcolorContext(this._ctx, this.state);
		this.enterRule(_localctx, 18, inlineParser.RULE_hexcolor);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 158;
			this.match(inlineParser.Hash);
			this.state = 159;
			this.ws();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public number(): NumberContext {
		let _localctx: NumberContext = new NumberContext(this._ctx, this.state);
		this.enterRule(_localctx, 20, inlineParser.RULE_number);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 162;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === inlineParser.Plus || _la === inlineParser.Minus) {
				{
				this.state = 161;
				_la = this._input.LA(1);
				if (!(_la === inlineParser.Plus || _la === inlineParser.Minus)) {
				this._errHandler.recoverInline(this);
				} else {
					if (this._input.LA(1) === Token.EOF) {
						this.matchedEOF = true;
					}

					this._errHandler.reportMatch(this);
					this.consume();
				}
				}
			}

			this.state = 164;
			this.match(inlineParser.Number);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public percentage(): PercentageContext {
		let _localctx: PercentageContext = new PercentageContext(this._ctx, this.state);
		this.enterRule(_localctx, 22, inlineParser.RULE_percentage);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 167;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === inlineParser.Plus || _la === inlineParser.Minus) {
				{
				this.state = 166;
				_la = this._input.LA(1);
				if (!(_la === inlineParser.Plus || _la === inlineParser.Minus)) {
				this._errHandler.recoverInline(this);
				} else {
					if (this._input.LA(1) === Token.EOF) {
						this.matchedEOF = true;
					}

					this._errHandler.reportMatch(this);
					this.consume();
				}
				}
			}

			this.state = 169;
			this.match(inlineParser.Percentage);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public dimension(): DimensionContext {
		let _localctx: DimensionContext = new DimensionContext(this._ctx, this.state);
		this.enterRule(_localctx, 24, inlineParser.RULE_dimension);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 172;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === inlineParser.Plus || _la === inlineParser.Minus) {
				{
				this.state = 171;
				_la = this._input.LA(1);
				if (!(_la === inlineParser.Plus || _la === inlineParser.Minus)) {
				this._errHandler.recoverInline(this);
				} else {
					if (this._input.LA(1) === Token.EOF) {
						this.matchedEOF = true;
					}

					this._errHandler.reportMatch(this);
					this.consume();
				}
				}
			}

			this.state = 174;
			this.match(inlineParser.Dimension);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public unknownDimension(): UnknownDimensionContext {
		let _localctx: UnknownDimensionContext = new UnknownDimensionContext(this._ctx, this.state);
		this.enterRule(_localctx, 26, inlineParser.RULE_unknownDimension);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 177;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === inlineParser.Plus || _la === inlineParser.Minus) {
				{
				this.state = 176;
				_la = this._input.LA(1);
				if (!(_la === inlineParser.Plus || _la === inlineParser.Minus)) {
				this._errHandler.recoverInline(this);
				} else {
					if (this._input.LA(1) === Token.EOF) {
						this.matchedEOF = true;
					}

					this._errHandler.reportMatch(this);
					this.consume();
				}
				}
			}

			this.state = 179;
			this.match(inlineParser.UnknownDimension);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public any_(): Any_Context {
		let _localctx: Any_Context = new Any_Context(this._ctx, this.state);
		this.enterRule(_localctx, 28, inlineParser.RULE_any_);
		let _la: number;
		try {
			this.state = 246;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 22, this._ctx) ) {
			case 1:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 181;
				this.ident();
				this.state = 182;
				this.ws();
				}
				break;

			case 2:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 184;
				this.number();
				this.state = 185;
				this.ws();
				}
				break;

			case 3:
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 187;
				this.percentage();
				this.state = 188;
				this.ws();
				}
				break;

			case 4:
				this.enterOuterAlt(_localctx, 4);
				{
				this.state = 190;
				this.dimension();
				this.state = 191;
				this.ws();
				}
				break;

			case 5:
				this.enterOuterAlt(_localctx, 5);
				{
				this.state = 193;
				this.unknownDimension();
				this.state = 194;
				this.ws();
				}
				break;

			case 6:
				this.enterOuterAlt(_localctx, 6);
				{
				this.state = 196;
				this.match(inlineParser.String_);
				this.state = 197;
				this.ws();
				}
				break;

			case 7:
				this.enterOuterAlt(_localctx, 7);
				{
				this.state = 198;
				this.match(inlineParser.Uri);
				this.state = 199;
				this.ws();
				}
				break;

			case 8:
				this.enterOuterAlt(_localctx, 8);
				{
				this.state = 200;
				this.match(inlineParser.Hash);
				this.state = 201;
				this.ws();
				}
				break;

			case 9:
				this.enterOuterAlt(_localctx, 9);
				{
				this.state = 202;
				this.match(inlineParser.UnicodeRange);
				this.state = 203;
				this.ws();
				}
				break;

			case 10:
				this.enterOuterAlt(_localctx, 10);
				{
				this.state = 204;
				this.match(inlineParser.Includes);
				this.state = 205;
				this.ws();
				}
				break;

			case 11:
				this.enterOuterAlt(_localctx, 11);
				{
				this.state = 206;
				this.match(inlineParser.DashMatch);
				this.state = 207;
				this.ws();
				}
				break;

			case 12:
				this.enterOuterAlt(_localctx, 12);
				{
				this.state = 208;
				this.match(inlineParser.T__4);
				this.state = 209;
				this.ws();
				}
				break;

			case 13:
				this.enterOuterAlt(_localctx, 13);
				{
				this.state = 210;
				this.match(inlineParser.Function_);
				this.state = 211;
				this.ws();
				this.state = 216;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while ((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << inlineParser.T__0) | (1 << inlineParser.T__4) | (1 << inlineParser.T__6) | (1 << inlineParser.T__7) | (1 << inlineParser.Includes) | (1 << inlineParser.DashMatch) | (1 << inlineParser.Hash) | (1 << inlineParser.Percentage) | (1 << inlineParser.Uri) | (1 << inlineParser.UnicodeRange) | (1 << inlineParser.Dimension) | (1 << inlineParser.UnknownDimension) | (1 << inlineParser.Plus) | (1 << inlineParser.Minus) | (1 << inlineParser.Number) | (1 << inlineParser.String_))) !== 0) || _la === inlineParser.Ident || _la === inlineParser.Function_) {
					{
					this.state = 214;
					this._errHandler.sync(this);
					switch (this._input.LA(1)) {
					case inlineParser.T__4:
					case inlineParser.T__6:
					case inlineParser.T__7:
					case inlineParser.Includes:
					case inlineParser.DashMatch:
					case inlineParser.Hash:
					case inlineParser.Percentage:
					case inlineParser.Uri:
					case inlineParser.UnicodeRange:
					case inlineParser.Dimension:
					case inlineParser.UnknownDimension:
					case inlineParser.Plus:
					case inlineParser.Minus:
					case inlineParser.Number:
					case inlineParser.String_:
					case inlineParser.Ident:
					case inlineParser.Function_:
						{
						this.state = 212;
						this.any_();
						}
						break;
					case inlineParser.T__0:
						{
						this.state = 213;
						this.unused();
						}
						break;
					default:
						throw new NoViableAltException(this);
					}
					}
					this.state = 218;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
				this.state = 219;
				this.match(inlineParser.T__5);
				this.state = 220;
				this.ws();
				}
				break;

			case 14:
				this.enterOuterAlt(_localctx, 14);
				{
				this.state = 222;
				this.match(inlineParser.T__6);
				this.state = 223;
				this.ws();
				this.state = 228;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while ((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << inlineParser.T__0) | (1 << inlineParser.T__4) | (1 << inlineParser.T__6) | (1 << inlineParser.T__7) | (1 << inlineParser.Includes) | (1 << inlineParser.DashMatch) | (1 << inlineParser.Hash) | (1 << inlineParser.Percentage) | (1 << inlineParser.Uri) | (1 << inlineParser.UnicodeRange) | (1 << inlineParser.Dimension) | (1 << inlineParser.UnknownDimension) | (1 << inlineParser.Plus) | (1 << inlineParser.Minus) | (1 << inlineParser.Number) | (1 << inlineParser.String_))) !== 0) || _la === inlineParser.Ident || _la === inlineParser.Function_) {
					{
					this.state = 226;
					this._errHandler.sync(this);
					switch (this._input.LA(1)) {
					case inlineParser.T__4:
					case inlineParser.T__6:
					case inlineParser.T__7:
					case inlineParser.Includes:
					case inlineParser.DashMatch:
					case inlineParser.Hash:
					case inlineParser.Percentage:
					case inlineParser.Uri:
					case inlineParser.UnicodeRange:
					case inlineParser.Dimension:
					case inlineParser.UnknownDimension:
					case inlineParser.Plus:
					case inlineParser.Minus:
					case inlineParser.Number:
					case inlineParser.String_:
					case inlineParser.Ident:
					case inlineParser.Function_:
						{
						this.state = 224;
						this.any_();
						}
						break;
					case inlineParser.T__0:
						{
						this.state = 225;
						this.unused();
						}
						break;
					default:
						throw new NoViableAltException(this);
					}
					}
					this.state = 230;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
				this.state = 231;
				this.match(inlineParser.T__5);
				this.state = 232;
				this.ws();
				}
				break;

			case 15:
				this.enterOuterAlt(_localctx, 15);
				{
				this.state = 234;
				this.match(inlineParser.T__7);
				this.state = 235;
				this.ws();
				this.state = 240;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while ((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << inlineParser.T__0) | (1 << inlineParser.T__4) | (1 << inlineParser.T__6) | (1 << inlineParser.T__7) | (1 << inlineParser.Includes) | (1 << inlineParser.DashMatch) | (1 << inlineParser.Hash) | (1 << inlineParser.Percentage) | (1 << inlineParser.Uri) | (1 << inlineParser.UnicodeRange) | (1 << inlineParser.Dimension) | (1 << inlineParser.UnknownDimension) | (1 << inlineParser.Plus) | (1 << inlineParser.Minus) | (1 << inlineParser.Number) | (1 << inlineParser.String_))) !== 0) || _la === inlineParser.Ident || _la === inlineParser.Function_) {
					{
					this.state = 238;
					this._errHandler.sync(this);
					switch (this._input.LA(1)) {
					case inlineParser.T__4:
					case inlineParser.T__6:
					case inlineParser.T__7:
					case inlineParser.Includes:
					case inlineParser.DashMatch:
					case inlineParser.Hash:
					case inlineParser.Percentage:
					case inlineParser.Uri:
					case inlineParser.UnicodeRange:
					case inlineParser.Dimension:
					case inlineParser.UnknownDimension:
					case inlineParser.Plus:
					case inlineParser.Minus:
					case inlineParser.Number:
					case inlineParser.String_:
					case inlineParser.Ident:
					case inlineParser.Function_:
						{
						this.state = 236;
						this.any_();
						}
						break;
					case inlineParser.T__0:
						{
						this.state = 237;
						this.unused();
						}
						break;
					default:
						throw new NoViableAltException(this);
					}
					}
					this.state = 242;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
				this.state = 243;
				this.match(inlineParser.T__8);
				this.state = 244;
				this.ws();
				}
				break;
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public generalEnclosed(): GeneralEnclosedContext {
		let _localctx: GeneralEnclosedContext = new GeneralEnclosedContext(this._ctx, this.state);
		this.enterRule(_localctx, 30, inlineParser.RULE_generalEnclosed);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 248;
			_la = this._input.LA(1);
			if (!(_la === inlineParser.T__6 || _la === inlineParser.Function_)) {
			this._errHandler.recoverInline(this);
			} else {
				if (this._input.LA(1) === Token.EOF) {
					this.matchedEOF = true;
				}

				this._errHandler.reportMatch(this);
				this.consume();
			}
			this.state = 253;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while ((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << inlineParser.T__0) | (1 << inlineParser.T__4) | (1 << inlineParser.T__6) | (1 << inlineParser.T__7) | (1 << inlineParser.Includes) | (1 << inlineParser.DashMatch) | (1 << inlineParser.Hash) | (1 << inlineParser.Percentage) | (1 << inlineParser.Uri) | (1 << inlineParser.UnicodeRange) | (1 << inlineParser.Dimension) | (1 << inlineParser.UnknownDimension) | (1 << inlineParser.Plus) | (1 << inlineParser.Minus) | (1 << inlineParser.Number) | (1 << inlineParser.String_))) !== 0) || _la === inlineParser.Ident || _la === inlineParser.Function_) {
				{
				this.state = 251;
				this._errHandler.sync(this);
				switch (this._input.LA(1)) {
				case inlineParser.T__4:
				case inlineParser.T__6:
				case inlineParser.T__7:
				case inlineParser.Includes:
				case inlineParser.DashMatch:
				case inlineParser.Hash:
				case inlineParser.Percentage:
				case inlineParser.Uri:
				case inlineParser.UnicodeRange:
				case inlineParser.Dimension:
				case inlineParser.UnknownDimension:
				case inlineParser.Plus:
				case inlineParser.Minus:
				case inlineParser.Number:
				case inlineParser.String_:
				case inlineParser.Ident:
				case inlineParser.Function_:
					{
					this.state = 249;
					this.any_();
					}
					break;
				case inlineParser.T__0:
					{
					this.state = 250;
					this.unused();
					}
					break;
				default:
					throw new NoViableAltException(this);
				}
				}
				this.state = 255;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 256;
			this.match(inlineParser.T__5);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public unused(): UnusedContext {
		let _localctx: UnusedContext = new UnusedContext(this._ctx, this.state);
		this.enterRule(_localctx, 32, inlineParser.RULE_unused);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 258;
			this.match(inlineParser.T__0);
			this.state = 259;
			this.ws();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public var_(): Var_Context {
		let _localctx: Var_Context = new Var_Context(this._ctx, this.state);
		this.enterRule(_localctx, 34, inlineParser.RULE_var_);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 261;
			this.match(inlineParser.Var);
			this.state = 262;
			this.ws();
			this.state = 263;
			this.match(inlineParser.Variable);
			this.state = 264;
			this.ws();
			this.state = 265;
			this.match(inlineParser.T__5);
			this.state = 266;
			this.ws();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public calc(): CalcContext {
		let _localctx: CalcContext = new CalcContext(this._ctx, this.state);
		this.enterRule(_localctx, 36, inlineParser.RULE_calc);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 268;
			this.match(inlineParser.Calc);
			this.state = 269;
			this.ws();
			this.state = 270;
			this.calcSum();
			this.state = 271;
			this.match(inlineParser.T__5);
			this.state = 272;
			this.ws();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public calcSum(): CalcSumContext {
		let _localctx: CalcSumContext = new CalcSumContext(this._ctx, this.state);
		this.enterRule(_localctx, 38, inlineParser.RULE_calcSum);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 274;
			this.calcProduct();
			this.state = 285;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === inlineParser.Space) {
				{
				{
				this.state = 275;
				this.match(inlineParser.Space);
				this.state = 276;
				this.ws();
				this.state = 277;
				_la = this._input.LA(1);
				if (!(_la === inlineParser.Plus || _la === inlineParser.Minus)) {
				this._errHandler.recoverInline(this);
				} else {
					if (this._input.LA(1) === Token.EOF) {
						this.matchedEOF = true;
					}

					this._errHandler.reportMatch(this);
					this.consume();
				}
				this.state = 278;
				this.ws();
				this.state = 279;
				this.match(inlineParser.Space);
				this.state = 280;
				this.ws();
				this.state = 281;
				this.calcProduct();
				}
				}
				this.state = 287;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public calcProduct(): CalcProductContext {
		let _localctx: CalcProductContext = new CalcProductContext(this._ctx, this.state);
		this.enterRule(_localctx, 40, inlineParser.RULE_calcProduct);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 288;
			this.calcValue();
			this.state = 300;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === inlineParser.T__1 || _la === inlineParser.T__2) {
				{
				this.state = 298;
				this._errHandler.sync(this);
				switch (this._input.LA(1)) {
				case inlineParser.T__2:
					{
					this.state = 289;
					this.match(inlineParser.T__2);
					this.state = 290;
					this.ws();
					this.state = 291;
					this.calcValue();
					}
					break;
				case inlineParser.T__1:
					{
					this.state = 293;
					this.match(inlineParser.T__1);
					this.state = 294;
					this.ws();
					this.state = 295;
					this.number();
					this.state = 296;
					this.ws();
					}
					break;
				default:
					throw new NoViableAltException(this);
				}
				}
				this.state = 302;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public calcValue(): CalcValueContext {
		let _localctx: CalcValueContext = new CalcValueContext(this._ctx, this.state);
		this.enterRule(_localctx, 42, inlineParser.RULE_calcValue);
		try {
			this.state = 321;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 28, this._ctx) ) {
			case 1:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 303;
				this.number();
				this.state = 304;
				this.ws();
				}
				break;

			case 2:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 306;
				this.dimension();
				this.state = 307;
				this.ws();
				}
				break;

			case 3:
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 309;
				this.unknownDimension();
				this.state = 310;
				this.ws();
				}
				break;

			case 4:
				this.enterOuterAlt(_localctx, 4);
				{
				this.state = 312;
				this.percentage();
				this.state = 313;
				this.ws();
				}
				break;

			case 5:
				this.enterOuterAlt(_localctx, 5);
				{
				this.state = 315;
				this.match(inlineParser.T__6);
				this.state = 316;
				this.ws();
				this.state = 317;
				this.calcSum();
				this.state = 318;
				this.match(inlineParser.T__5);
				this.state = 319;
				this.ws();
				}
				break;
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public ident(): IdentContext {
		let _localctx: IdentContext = new IdentContext(this._ctx, this.state);
		this.enterRule(_localctx, 44, inlineParser.RULE_ident);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 323;
			this.match(inlineParser.Ident);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public ws(): WsContext {
		let _localctx: WsContext = new WsContext(this._ctx, this.state);
		this.enterRule(_localctx, 46, inlineParser.RULE_ws);
		let _la: number;
		try {
			let _alt: number;
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 328;
			this._errHandler.sync(this);
			_alt = this.interpreter.adaptivePredict(this._input, 29, this._ctx);
			while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
				if (_alt === 1) {
					{
					{
					this.state = 325;
					_la = this._input.LA(1);
					if (!(_la === inlineParser.Comment || _la === inlineParser.Space)) {
					this._errHandler.recoverInline(this);
					} else {
						if (this._input.LA(1) === Token.EOF) {
							this.matchedEOF = true;
						}

						this._errHandler.reportMatch(this);
						this.consume();
					}
					}
					}
				}
				this.state = 330;
				this._errHandler.sync(this);
				_alt = this.interpreter.adaptivePredict(this._input, 29, this._ctx);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}

	public static readonly _serializedATN: string =
		"\x03\uC91D\uCABA\u058D\uAFBA\u4F53\u0607\uEA8B\uC241\x03\'\u014E\x04\x02" +
		"\t\x02\x04\x03\t\x03\x04\x04\t\x04\x04\x05\t\x05\x04\x06\t\x06\x04\x07" +
		"\t\x07\x04\b\t\b\x04\t\t\t\x04\n\t\n\x04\v\t\v\x04\f\t\f\x04\r\t\r\x04" +
		"\x0E\t\x0E\x04\x0F\t\x0F\x04\x10\t\x10\x04\x11\t\x11\x04\x12\t\x12\x04" +
		"\x13\t\x13\x04\x14\t\x14\x04\x15\t\x15\x04\x16\t\x16\x04\x17\t\x17\x04" +
		"\x18\t\x18\x04\x19\t\x19\x03\x02\x03\x02\x03\x02\x03\x02\x03\x02\x07\x02" +
		"8\n\x02\f\x02\x0E\x02;\v\x02\x03\x02\x03\x02\x03\x03\x03\x03\x07\x03A" +
		"\n\x03\f\x03\x0E\x03D\v\x03\x03\x03\x03\x03\x03\x03\x03\x03\x03\x03\x05" +
		"\x03K\n\x03\x07\x03M\n\x03\f\x03\x0E\x03P\v\x03\x03\x04\x03\x04\x03\x04" +
		"\x03\x04\x03\x04\x03\x04\x05\x04X\n\x04\x03\x05\x03\x05\x03\x05\x03\x05" +
		"\x03\x05\x03\x05\x03\x05\x03\x05\x03\x05\x05\x05c\n\x05\x03\x06\x03\x06" +
		"\x03\x06\x03\x06\x03\x06\x03\x06\x03\x06\x03\x06\x03\x06\x03\x06\x05\x06" +
		"o\n\x06\x03\x07\x06\x07r\n\x07\r\x07\x0E\x07s\x03\b\x03\b\x05\bx\n\b\x03" +
		"\b\x07\b{\n\b\f\b\x0E\b~\v\b\x03\t\x03\t\x03\t\x03\t\x03\t\x03\t\x03\t" +
		"\x03\t\x03\t\x03\t\x03\t\x03\t\x03\t\x03\t\x03\t\x03\t\x03\t\x03\t\x03" +
		"\t\x03\t\x03\t\x03\t\x03\t\x03\t\x03\t\x05\t\x99\n\t\x03\n\x03\n\x03\n" +
		"\x03\n\x03\n\x03\n\x03\v\x03\v\x03\v\x03\f\x05\f\xA5\n\f\x03\f\x03\f\x03" +
		"\r\x05\r\xAA\n\r\x03\r\x03\r\x03\x0E\x05\x0E\xAF\n\x0E\x03\x0E\x03\x0E" +
		"\x03\x0F\x05\x0F\xB4\n\x0F\x03\x0F\x03\x0F\x03\x10\x03\x10\x03\x10\x03" +
		"\x10\x03\x10\x03\x10\x03\x10\x03\x10\x03\x10\x03\x10\x03\x10\x03\x10\x03" +
		"\x10\x03\x10\x03\x10\x03\x10\x03\x10\x03\x10\x03\x10\x03\x10\x03\x10\x03" +
		"\x10\x03\x10\x03\x10\x03\x10\x03\x10\x03\x10\x03\x10\x03\x10\x03\x10\x03" +
		"\x10\x03\x10\x03\x10\x07\x10\xD9\n\x10\f\x10\x0E\x10\xDC\v\x10\x03\x10" +
		"\x03\x10\x03\x10\x03\x10\x03\x10\x03\x10\x03\x10\x07\x10\xE5\n\x10\f\x10" +
		"\x0E\x10\xE8\v\x10\x03\x10\x03\x10\x03\x10\x03\x10\x03\x10\x03\x10\x03" +
		"\x10\x07\x10\xF1\n\x10\f\x10\x0E\x10\xF4\v\x10\x03\x10\x03\x10\x03\x10" +
		"\x05\x10\xF9\n\x10\x03\x11\x03\x11\x03\x11\x07\x11\xFE\n\x11\f\x11\x0E" +
		"\x11\u0101\v\x11\x03\x11\x03\x11\x03\x12\x03\x12\x03\x12\x03\x13\x03\x13" +
		"\x03\x13\x03\x13\x03\x13\x03\x13\x03\x13\x03\x14\x03\x14\x03\x14\x03\x14" +
		"\x03\x14\x03\x14\x03\x15\x03\x15\x03\x15\x03\x15\x03\x15\x03\x15\x03\x15" +
		"\x03\x15\x03\x15\x07\x15\u011E\n\x15\f\x15\x0E\x15\u0121\v\x15\x03\x16" +
		"\x03\x16\x03\x16\x03\x16\x03\x16\x03\x16\x03\x16\x03\x16\x03\x16\x03\x16" +
		"\x07\x16\u012D\n\x16\f\x16\x0E\x16\u0130\v\x16\x03\x17\x03\x17\x03\x17" +
		"\x03\x17\x03\x17\x03\x17\x03\x17\x03\x17\x03\x17\x03\x17\x03\x17\x03\x17" +
		"\x03\x17\x03\x17\x03\x17\x03\x17\x03\x17\x03\x17\x05\x17\u0144\n\x17\x03" +
		"\x18\x03\x18\x03\x19\x07\x19\u0149\n\x19\f\x19\x0E\x19\u014C\v\x19\x03" +
		"\x19\x02\x02\x02\x1A\x02\x02\x04\x02\x06\x02\b\x02\n\x02\f\x02\x0E\x02" +
		"\x10\x02\x12\x02\x14\x02\x16\x02\x18\x02\x1A\x02\x1C\x02\x1E\x02 \x02" +
		"\"\x02$\x02&\x02(\x02*\x02,\x02.\x020\x02\x02\x05\x03\x02\x17\x18\x04" +
		"\x02\t\t\'\'\x03\x02\f\r\x02\u0171\x022\x03\x02\x02\x02\x04B\x03\x02\x02" +
		"\x02\x06W\x03\x02\x02\x02\bb\x03\x02\x02\x02\nn\x03\x02\x02\x02\fq\x03" +
		"\x02\x02\x02\x0Eu\x03\x02\x02\x02\x10\x98\x03\x02\x02\x02\x12\x9A\x03" +
		"\x02\x02\x02\x14\xA0\x03\x02\x02\x02\x16\xA4\x03\x02\x02\x02\x18\xA9\x03" +
		"\x02\x02\x02\x1A\xAE\x03\x02\x02\x02\x1C\xB3\x03\x02\x02\x02\x1E\xF8\x03" +
		"\x02\x02\x02 \xFA\x03\x02\x02\x02\"\u0104\x03\x02\x02\x02$\u0107\x03\x02" +
		"\x02\x02&\u010E\x03\x02\x02\x02(\u0114\x03\x02\x02\x02*\u0122\x03\x02" +
		"\x02\x02,\u0143\x03\x02\x02\x02.\u0145\x03\x02\x02\x020\u014A\x03\x02" +
		"\x02\x0229\x050\x19\x0238\x05\x04\x03\x0248\x05\x1E\x10\x0256\x07\x03" +
		"\x02\x0268\x050\x19\x0273\x03\x02\x02\x0274\x03\x02\x02\x0275\x03\x02" +
		"\x02\x028;\x03\x02\x02\x0297\x03\x02\x02\x029:\x03\x02\x02\x02:<\x03\x02" +
		"\x02\x02;9\x03\x02\x02\x02<=\x050\x19\x02=\x03\x03\x02\x02\x02>?\x07\x03" +
		"\x02\x02?A\x050\x19\x02@>\x03\x02\x02\x02AD\x03\x02\x02\x02B@\x03\x02" +
		"\x02\x02BC\x03\x02\x02\x02CE\x03\x02\x02\x02DB\x03\x02\x02\x02EF\x05\n" +
		"\x06\x02FN\x050\x19\x02GH\x07\x03\x02\x02HJ\x050\x19\x02IK\x05\n\x06\x02" +
		"JI\x03\x02\x02\x02JK\x03\x02\x02\x02KM\x03\x02\x02\x02LG\x03\x02\x02\x02" +
		"MP\x03\x02\x02\x02NL\x03\x02\x02\x02NO\x03\x02\x02\x02O\x05\x03\x02\x02" +
		"\x02PN\x03\x02\x02\x02QR\x07\x04\x02\x02RX\x050\x19\x02ST\x07\x1A\x02" +
		"\x02TX\x050\x19\x02UV\x07\r\x02\x02VX\x050\x19\x02WQ\x03\x02\x02\x02W" +
		"S\x03\x02\x02\x02WU\x03\x02\x02\x02X\x07\x03\x02\x02\x02YZ\x05.\x18\x02" +
		"Z[\x050\x19\x02[c\x03\x02\x02\x02\\]\x07$\x02\x02]c\x050\x19\x02^_\x07" +
		"\x05\x02\x02_c\x05.\x18\x02`a\x07\x06\x02\x02ac\x05.\x18\x02bY\x03\x02" +
		"\x02\x02b\\\x03\x02\x02\x02b^\x03\x02\x02\x02b`\x03\x02\x02\x02c\t\x03" +
		"\x02\x02\x02de\x05\b\x05\x02ef\x07\x07\x02\x02fg\x050\x19\x02gh\x05\x0E" +
		"\b\x02ho\x03\x02\x02\x02ij\x05\b\x05\x02jk\x07\x07\x02\x02kl\x050\x19" +
		"\x02lm\x05\f\x07\x02mo\x03\x02\x02\x02nd\x03\x02\x02\x02ni\x03\x02\x02" +
		"\x02o\v\x03\x02\x02\x02pr\x05\x1E\x10\x02qp\x03\x02\x02\x02rs\x03\x02" +
		"\x02\x02sq\x03\x02\x02\x02st\x03\x02\x02\x02t\r\x03\x02\x02\x02u|\x05" +
		"\x10\t\x02vx\x05\x06\x04\x02wv\x03\x02\x02\x02wx\x03\x02\x02\x02xy\x03" +
		"\x02\x02\x02y{\x05\x10\t\x02zw\x03\x02\x02\x02{~\x03\x02\x02\x02|z\x03" +
		"\x02\x02\x02|}\x03\x02\x02\x02}\x0F\x03\x02\x02\x02~|\x03\x02\x02\x02" +
		"\x7F\x80\x05\x16\f\x02\x80\x81\x050\x19\x02\x81\x99\x03\x02\x02\x02\x82" +
		"\x83\x05\x18\r\x02\x83\x84\x050\x19\x02\x84\x99\x03\x02\x02\x02\x85\x86" +
		"\x05\x1A\x0E\x02\x86\x87\x050\x19\x02\x87\x99\x03\x02\x02\x02\x88\x89" +
		"\x07\x1E\x02\x02\x89\x99\x050\x19\x02\x8A\x8B\x07\x14\x02\x02\x8B\x99" +
		"\x050\x19\x02\x8C\x8D\x05.\x18\x02\x8D\x8E\x050\x19\x02\x8E\x99\x03\x02" +
		"\x02\x02\x8F\x99\x05$\x13\x02\x90\x91\x07\x13\x02\x02\x91\x99\x050\x19" +
		"\x02\x92\x99\x05\x14\v\x02\x93\x99\x05&\x14\x02\x94\x99\x05\x12\n\x02" +
		"\x95\x96\x05\x1C\x0F\x02\x96\x97\x050\x19\x02\x97\x99\x03\x02\x02\x02" +
		"\x98\x7F\x03\x02\x02\x02\x98\x82\x03\x02\x02\x02\x98\x85\x03\x02\x02\x02" +
		"\x98\x88\x03\x02\x02\x02\x98\x8A\x03\x02\x02\x02\x98\x8C\x03\x02\x02\x02" +
		"\x98\x8F\x03\x02\x02\x02\x98\x90\x03\x02\x02\x02\x98\x92\x03\x02\x02\x02" +
		"\x98\x93\x03\x02\x02\x02\x98\x94\x03\x02\x02\x02\x98\x95\x03\x02\x02\x02" +
		"\x99\x11\x03\x02\x02\x02\x9A\x9B\x07\'\x02\x02\x9B\x9C\x050\x19\x02\x9C" +
		"\x9D\x05\x0E\b\x02\x9D\x9E\x07\b\x02\x02\x9E\x9F\x050\x19\x02\x9F\x13" +
		"\x03\x02\x02\x02\xA0\xA1\x07\x10\x02\x02\xA1\xA2\x050\x19\x02\xA2\x15" +
		"\x03\x02\x02\x02\xA3\xA5\t\x02\x02\x02\xA4\xA3\x03\x02\x02\x02\xA4\xA5" +
		"\x03\x02\x02\x02\xA5\xA6\x03\x02\x02\x02\xA6\xA7\x07\x1D\x02\x02\xA7\x17" +
		"\x03\x02\x02\x02\xA8\xAA\t\x02\x02\x02\xA9\xA8\x03\x02\x02\x02\xA9\xAA" +
		"\x03\x02\x02\x02\xAA\xAB\x03\x02\x02\x02\xAB\xAC\x07\x12\x02\x02\xAC\x19" +
		"\x03\x02\x02\x02\xAD\xAF\t\x02\x02\x02\xAE\xAD\x03\x02\x02\x02\xAE\xAF" +
		"\x03\x02\x02\x02\xAF\xB0\x03\x02\x02\x02\xB0\xB1\x07\x15\x02\x02\xB1\x1B" +
		"\x03\x02\x02\x02\xB2\xB4\t\x02\x02\x02\xB3\xB2\x03\x02\x02\x02\xB3\xB4" +
		"\x03\x02\x02\x02\xB4\xB5\x03\x02\x02\x02\xB5\xB6\x07\x16\x02\x02\xB6\x1D" +
		"\x03\x02\x02\x02\xB7\xB8\x05.\x18\x02\xB8\xB9\x050\x19\x02\xB9\xF9\x03" +
		"\x02\x02\x02\xBA\xBB\x05\x16\f\x02\xBB\xBC\x050\x19\x02\xBC\xF9\x03\x02" +
		"\x02\x02\xBD\xBE\x05\x18\r\x02\xBE\xBF\x050\x19\x02\xBF\xF9\x03\x02\x02" +
		"\x02\xC0\xC1\x05\x1A\x0E\x02\xC1\xC2\x050\x19\x02\xC2\xF9\x03\x02\x02" +
		"\x02\xC3\xC4\x05\x1C\x0F\x02\xC4\xC5\x050\x19\x02\xC5\xF9\x03\x02\x02" +
		"\x02\xC6\xC7\x07\x1E\x02\x02\xC7\xF9\x050\x19\x02\xC8\xC9\x07\x13\x02" +
		"\x02\xC9\xF9\x050\x19\x02\xCA\xCB\x07\x10\x02\x02\xCB\xF9\x050\x19\x02" +
		"\xCC\xCD\x07\x14\x02\x02\xCD\xF9\x050\x19\x02\xCE\xCF\x07\x0E\x02\x02" +
		"\xCF\xF9\x050\x19\x02\xD0\xD1\x07\x0F\x02\x02\xD1\xF9\x050\x19\x02\xD2" +
		"\xD3\x07\x07\x02\x02\xD3\xF9\x050\x19\x02\xD4\xD5\x07\'\x02\x02\xD5\xDA" +
		"\x050\x19\x02\xD6\xD9\x05\x1E\x10\x02\xD7\xD9\x05\"\x12\x02\xD8\xD6\x03" +
		"\x02\x02\x02\xD8\xD7\x03\x02\x02\x02\xD9\xDC\x03\x02\x02\x02\xDA\xD8\x03" +
		"\x02\x02\x02\xDA\xDB\x03\x02\x02\x02\xDB\xDD\x03\x02\x02\x02\xDC\xDA\x03" +
		"\x02\x02\x02\xDD\xDE\x07\b\x02\x02\xDE\xDF\x050\x19\x02\xDF\xF9\x03\x02" +
		"\x02\x02\xE0\xE1\x07\t\x02\x02\xE1\xE6\x050\x19\x02\xE2\xE5\x05\x1E\x10" +
		"\x02\xE3\xE5\x05\"\x12\x02\xE4\xE2\x03\x02\x02\x02\xE4\xE3\x03\x02\x02" +
		"\x02\xE5\xE8\x03\x02\x02\x02\xE6\xE4\x03\x02\x02\x02\xE6\xE7\x03\x02\x02" +
		"\x02\xE7\xE9\x03\x02\x02\x02\xE8\xE6\x03\x02\x02\x02\xE9\xEA\x07\b\x02" +
		"\x02\xEA\xEB\x050\x19\x02\xEB\xF9\x03\x02\x02\x02\xEC\xED\x07\n\x02\x02" +
		"\xED\xF2\x050\x19\x02\xEE\xF1\x05\x1E\x10\x02\xEF\xF1\x05\"\x12\x02\xF0" +
		"\xEE\x03\x02\x02\x02\xF0\xEF\x03\x02\x02\x02\xF1\xF4\x03\x02\x02\x02\xF2" +
		"\xF0\x03\x02\x02\x02\xF2\xF3\x03\x02\x02\x02\xF3\xF5\x03\x02\x02\x02\xF4" +
		"\xF2\x03\x02\x02\x02\xF5\xF6\x07\v\x02\x02\xF6\xF7\x050\x19\x02\xF7\xF9" +
		"\x03\x02\x02\x02\xF8\xB7\x03\x02\x02\x02\xF8\xBA\x03\x02\x02\x02\xF8\xBD" +
		"\x03\x02\x02\x02\xF8\xC0\x03\x02\x02\x02\xF8\xC3\x03\x02\x02\x02\xF8\xC6" +
		"\x03\x02\x02\x02\xF8\xC8\x03\x02\x02\x02\xF8\xCA\x03\x02\x02\x02\xF8\xCC" +
		"\x03\x02\x02\x02\xF8\xCE\x03\x02\x02\x02\xF8\xD0\x03\x02\x02\x02\xF8\xD2" +
		"\x03\x02\x02\x02\xF8\xD4\x03\x02\x02\x02\xF8\xE0\x03\x02\x02\x02\xF8\xEC" +
		"\x03\x02\x02\x02\xF9\x1F\x03\x02\x02\x02\xFA\xFF\t\x03\x02\x02\xFB\xFE" +
		"\x05\x1E\x10\x02\xFC\xFE\x05\"\x12\x02\xFD\xFB\x03\x02\x02\x02\xFD\xFC" +
		"\x03\x02\x02\x02\xFE\u0101\x03\x02\x02\x02\xFF\xFD\x03\x02\x02\x02\xFF" +
		"\u0100\x03\x02\x02\x02\u0100\u0102\x03\x02\x02\x02\u0101\xFF\x03\x02\x02" +
		"\x02\u0102\u0103\x07\b\x02\x02\u0103!\x03\x02\x02\x02\u0104\u0105\x07" +
		"\x03\x02\x02\u0105\u0106\x050\x19\x02\u0106#\x03\x02\x02\x02\u0107\u0108" +
		"\x07%\x02\x02\u0108\u0109\x050\x19\x02\u0109\u010A\x07$\x02\x02\u010A" +
		"\u010B\x050\x19\x02\u010B\u010C\x07\b\x02\x02\u010C\u010D\x050\x19\x02" +
		"\u010D%\x03\x02\x02\x02\u010E\u010F\x07#\x02\x02\u010F\u0110\x050\x19" +
		"\x02\u0110\u0111\x05(\x15\x02\u0111\u0112\x07\b\x02\x02\u0112\u0113\x05" +
		"0\x19\x02\u0113\'\x03\x02\x02\x02\u0114\u011F\x05*\x16\x02\u0115\u0116" +
		"\x07\r\x02\x02\u0116\u0117\x050\x19\x02\u0117\u0118\t\x02\x02\x02\u0118" +
		"\u0119\x050\x19\x02\u0119\u011A\x07\r\x02\x02\u011A\u011B\x050\x19\x02" +
		"\u011B\u011C\x05*\x16\x02\u011C\u011E\x03\x02\x02\x02\u011D\u0115\x03" +
		"\x02\x02\x02\u011E\u0121\x03\x02\x02\x02\u011F\u011D\x03\x02\x02\x02\u011F" +
		"\u0120\x03\x02\x02\x02\u0120)\x03\x02\x02\x02\u0121\u011F\x03\x02\x02" +
		"\x02\u0122\u012E\x05,\x17\x02\u0123\u0124\x07\x05\x02\x02\u0124\u0125" +
		"\x050\x19\x02\u0125\u0126\x05,\x17\x02\u0126\u012D\x03\x02\x02\x02\u0127" +
		"\u0128\x07\x04\x02\x02\u0128\u0129\x050\x19\x02\u0129\u012A\x05\x16\f" +
		"\x02\u012A\u012B\x050\x19\x02\u012B\u012D\x03\x02\x02\x02\u012C\u0123" +
		"\x03\x02\x02\x02\u012C\u0127\x03\x02\x02\x02\u012D\u0130\x03\x02\x02\x02" +
		"\u012E\u012C\x03\x02\x02\x02\u012E\u012F\x03\x02\x02\x02\u012F+\x03\x02" +
		"\x02\x02\u0130\u012E\x03\x02\x02\x02\u0131\u0132\x05\x16\f\x02\u0132\u0133" +
		"\x050\x19\x02\u0133\u0144\x03\x02\x02\x02\u0134\u0135\x05\x1A\x0E\x02" +
		"\u0135\u0136\x050\x19\x02\u0136\u0144\x03\x02\x02\x02\u0137\u0138\x05" +
		"\x1C\x0F\x02\u0138\u0139\x050\x19\x02\u0139\u0144\x03\x02\x02\x02\u013A" +
		"\u013B\x05\x18\r\x02\u013B\u013C\x050\x19\x02\u013C\u0144\x03\x02\x02" +
		"\x02\u013D\u013E\x07\t\x02\x02\u013E\u013F\x050\x19\x02\u013F\u0140\x05" +
		"(\x15\x02\u0140\u0141\x07\b\x02\x02\u0141\u0142\x050\x19\x02\u0142\u0144" +
		"\x03\x02\x02\x02\u0143\u0131\x03\x02\x02\x02\u0143\u0134\x03\x02\x02\x02" +
		"\u0143\u0137\x03\x02\x02\x02\u0143\u013A\x03\x02\x02\x02\u0143\u013D\x03" +
		"\x02\x02\x02\u0144-\x03\x02\x02\x02\u0145\u0146\x07&\x02\x02\u0146/\x03" +
		"\x02\x02\x02\u0147\u0149\t\x04\x02\x02\u0148\u0147\x03\x02\x02\x02\u0149" +
		"\u014C\x03\x02\x02\x02\u014A\u0148\x03\x02\x02\x02\u014A\u014B\x03\x02" +
		"\x02\x02\u014B1\x03\x02\x02\x02\u014C\u014A\x03\x02\x02\x02 79BJNWbns" +
		"w|\x98\xA4\xA9\xAE\xB3\xD8\xDA\xE4\xE6\xF0\xF2\xF8\xFD\xFF\u011F\u012C" +
		"\u012E\u0143\u014A";
	public static __ATN: ATN;
	public static get _ATN(): ATN {
		if (!inlineParser.__ATN) {
			inlineParser.__ATN = new ATNDeserializer().deserialize(Utils.toCharArray(inlineParser._serializedATN));
		}

		return inlineParser.__ATN;
	}

}

export class InlineStyleContext extends ParserRuleContext {
	public ws(): WsContext[];
	public ws(i: number): WsContext;
	public ws(i?: number): WsContext | WsContext[] {
		if (i === undefined) {
			return this.getRuleContexts(WsContext);
		} else {
			return this.getRuleContext(i, WsContext);
		}
	}
	public declarationList(): DeclarationListContext[];
	public declarationList(i: number): DeclarationListContext;
	public declarationList(i?: number): DeclarationListContext | DeclarationListContext[] {
		if (i === undefined) {
			return this.getRuleContexts(DeclarationListContext);
		} else {
			return this.getRuleContext(i, DeclarationListContext);
		}
	}
	public any_(): Any_Context[];
	public any_(i: number): Any_Context;
	public any_(i?: number): Any_Context | Any_Context[] {
		if (i === undefined) {
			return this.getRuleContexts(Any_Context);
		} else {
			return this.getRuleContext(i, Any_Context);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return inlineParser.RULE_inlineStyle; }
	// @Override
	public enterRule(listener: inlineListener): void {
		if (listener.enterInlineStyle) {
			listener.enterInlineStyle(this);
		}
	}
	// @Override
	public exitRule(listener: inlineListener): void {
		if (listener.exitInlineStyle) {
			listener.exitInlineStyle(this);
		}
	}
	// @Override
	public accept<Result>(visitor: inlineVisitor<Result>): Result {
		if (visitor.visitInlineStyle) {
			return visitor.visitInlineStyle(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class DeclarationListContext extends ParserRuleContext {
	public declaration(): DeclarationContext[];
	public declaration(i: number): DeclarationContext;
	public declaration(i?: number): DeclarationContext | DeclarationContext[] {
		if (i === undefined) {
			return this.getRuleContexts(DeclarationContext);
		} else {
			return this.getRuleContext(i, DeclarationContext);
		}
	}
	public ws(): WsContext[];
	public ws(i: number): WsContext;
	public ws(i?: number): WsContext | WsContext[] {
		if (i === undefined) {
			return this.getRuleContexts(WsContext);
		} else {
			return this.getRuleContext(i, WsContext);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return inlineParser.RULE_declarationList; }
	// @Override
	public enterRule(listener: inlineListener): void {
		if (listener.enterDeclarationList) {
			listener.enterDeclarationList(this);
		}
	}
	// @Override
	public exitRule(listener: inlineListener): void {
		if (listener.exitDeclarationList) {
			listener.exitDeclarationList(this);
		}
	}
	// @Override
	public accept<Result>(visitor: inlineVisitor<Result>): Result {
		if (visitor.visitDeclarationList) {
			return visitor.visitDeclarationList(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class Operator_Context extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return inlineParser.RULE_operator_; }
	public copyFrom(ctx: Operator_Context): void {
		super.copyFrom(ctx);
	}
}
export class GoodOperatorContext extends Operator_Context {
	public ws(): WsContext {
		return this.getRuleContext(0, WsContext);
	}
	public Comma(): TerminalNode | undefined { return this.tryGetToken(inlineParser.Comma, 0); }
	public Space(): TerminalNode | undefined { return this.tryGetToken(inlineParser.Space, 0); }
	constructor(ctx: Operator_Context) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: inlineListener): void {
		if (listener.enterGoodOperator) {
			listener.enterGoodOperator(this);
		}
	}
	// @Override
	public exitRule(listener: inlineListener): void {
		if (listener.exitGoodOperator) {
			listener.exitGoodOperator(this);
		}
	}
	// @Override
	public accept<Result>(visitor: inlineVisitor<Result>): Result {
		if (visitor.visitGoodOperator) {
			return visitor.visitGoodOperator(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class Property_Context extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return inlineParser.RULE_property_; }
	public copyFrom(ctx: Property_Context): void {
		super.copyFrom(ctx);
	}
}
export class GoodPropertyContext extends Property_Context {
	public ident(): IdentContext | undefined {
		return this.tryGetRuleContext(0, IdentContext);
	}
	public ws(): WsContext {
		return this.getRuleContext(0, WsContext);
	}
	public Variable(): TerminalNode | undefined { return this.tryGetToken(inlineParser.Variable, 0); }
	constructor(ctx: Property_Context) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: inlineListener): void {
		if (listener.enterGoodProperty) {
			listener.enterGoodProperty(this);
		}
	}
	// @Override
	public exitRule(listener: inlineListener): void {
		if (listener.exitGoodProperty) {
			listener.exitGoodProperty(this);
		}
	}
	// @Override
	public accept<Result>(visitor: inlineVisitor<Result>): Result {
		if (visitor.visitGoodProperty) {
			return visitor.visitGoodProperty(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class BadPropertyContext extends Property_Context {
	public ident(): IdentContext {
		return this.getRuleContext(0, IdentContext);
	}
	constructor(ctx: Property_Context) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: inlineListener): void {
		if (listener.enterBadProperty) {
			listener.enterBadProperty(this);
		}
	}
	// @Override
	public exitRule(listener: inlineListener): void {
		if (listener.exitBadProperty) {
			listener.exitBadProperty(this);
		}
	}
	// @Override
	public accept<Result>(visitor: inlineVisitor<Result>): Result {
		if (visitor.visitBadProperty) {
			return visitor.visitBadProperty(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class DeclarationContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return inlineParser.RULE_declaration; }
	public copyFrom(ctx: DeclarationContext): void {
		super.copyFrom(ctx);
	}
}
export class KnownDeclarationContext extends DeclarationContext {
	public property_(): Property_Context {
		return this.getRuleContext(0, Property_Context);
	}
	public ws(): WsContext {
		return this.getRuleContext(0, WsContext);
	}
	public expr(): ExprContext {
		return this.getRuleContext(0, ExprContext);
	}
	constructor(ctx: DeclarationContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: inlineListener): void {
		if (listener.enterKnownDeclaration) {
			listener.enterKnownDeclaration(this);
		}
	}
	// @Override
	public exitRule(listener: inlineListener): void {
		if (listener.exitKnownDeclaration) {
			listener.exitKnownDeclaration(this);
		}
	}
	// @Override
	public accept<Result>(visitor: inlineVisitor<Result>): Result {
		if (visitor.visitKnownDeclaration) {
			return visitor.visitKnownDeclaration(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class UnknownDeclarationContext extends DeclarationContext {
	public property_(): Property_Context {
		return this.getRuleContext(0, Property_Context);
	}
	public ws(): WsContext {
		return this.getRuleContext(0, WsContext);
	}
	public value(): ValueContext {
		return this.getRuleContext(0, ValueContext);
	}
	constructor(ctx: DeclarationContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: inlineListener): void {
		if (listener.enterUnknownDeclaration) {
			listener.enterUnknownDeclaration(this);
		}
	}
	// @Override
	public exitRule(listener: inlineListener): void {
		if (listener.exitUnknownDeclaration) {
			listener.exitUnknownDeclaration(this);
		}
	}
	// @Override
	public accept<Result>(visitor: inlineVisitor<Result>): Result {
		if (visitor.visitUnknownDeclaration) {
			return visitor.visitUnknownDeclaration(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class ValueContext extends ParserRuleContext {
	public any_(): Any_Context[];
	public any_(i: number): Any_Context;
	public any_(i?: number): Any_Context | Any_Context[] {
		if (i === undefined) {
			return this.getRuleContexts(Any_Context);
		} else {
			return this.getRuleContext(i, Any_Context);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return inlineParser.RULE_value; }
	// @Override
	public enterRule(listener: inlineListener): void {
		if (listener.enterValue) {
			listener.enterValue(this);
		}
	}
	// @Override
	public exitRule(listener: inlineListener): void {
		if (listener.exitValue) {
			listener.exitValue(this);
		}
	}
	// @Override
	public accept<Result>(visitor: inlineVisitor<Result>): Result {
		if (visitor.visitValue) {
			return visitor.visitValue(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class ExprContext extends ParserRuleContext {
	public term(): TermContext[];
	public term(i: number): TermContext;
	public term(i?: number): TermContext | TermContext[] {
		if (i === undefined) {
			return this.getRuleContexts(TermContext);
		} else {
			return this.getRuleContext(i, TermContext);
		}
	}
	public operator_(): Operator_Context[];
	public operator_(i: number): Operator_Context;
	public operator_(i?: number): Operator_Context | Operator_Context[] {
		if (i === undefined) {
			return this.getRuleContexts(Operator_Context);
		} else {
			return this.getRuleContext(i, Operator_Context);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return inlineParser.RULE_expr; }
	// @Override
	public enterRule(listener: inlineListener): void {
		if (listener.enterExpr) {
			listener.enterExpr(this);
		}
	}
	// @Override
	public exitRule(listener: inlineListener): void {
		if (listener.exitExpr) {
			listener.exitExpr(this);
		}
	}
	// @Override
	public accept<Result>(visitor: inlineVisitor<Result>): Result {
		if (visitor.visitExpr) {
			return visitor.visitExpr(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class TermContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return inlineParser.RULE_term; }
	public copyFrom(ctx: TermContext): void {
		super.copyFrom(ctx);
	}
}
export class KnownTermContext extends TermContext {
	public number(): NumberContext | undefined {
		return this.tryGetRuleContext(0, NumberContext);
	}
	public ws(): WsContext | undefined {
		return this.tryGetRuleContext(0, WsContext);
	}
	public percentage(): PercentageContext | undefined {
		return this.tryGetRuleContext(0, PercentageContext);
	}
	public dimension(): DimensionContext | undefined {
		return this.tryGetRuleContext(0, DimensionContext);
	}
	public String_(): TerminalNode | undefined { return this.tryGetToken(inlineParser.String_, 0); }
	public UnicodeRange(): TerminalNode | undefined { return this.tryGetToken(inlineParser.UnicodeRange, 0); }
	public ident(): IdentContext | undefined {
		return this.tryGetRuleContext(0, IdentContext);
	}
	public var_(): Var_Context | undefined {
		return this.tryGetRuleContext(0, Var_Context);
	}
	public Uri(): TerminalNode | undefined { return this.tryGetToken(inlineParser.Uri, 0); }
	public hexcolor(): HexcolorContext | undefined {
		return this.tryGetRuleContext(0, HexcolorContext);
	}
	public calc(): CalcContext | undefined {
		return this.tryGetRuleContext(0, CalcContext);
	}
	public function_(): Function_Context | undefined {
		return this.tryGetRuleContext(0, Function_Context);
	}
	constructor(ctx: TermContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: inlineListener): void {
		if (listener.enterKnownTerm) {
			listener.enterKnownTerm(this);
		}
	}
	// @Override
	public exitRule(listener: inlineListener): void {
		if (listener.exitKnownTerm) {
			listener.exitKnownTerm(this);
		}
	}
	// @Override
	public accept<Result>(visitor: inlineVisitor<Result>): Result {
		if (visitor.visitKnownTerm) {
			return visitor.visitKnownTerm(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class UnknownTermContext extends TermContext {
	public unknownDimension(): UnknownDimensionContext {
		return this.getRuleContext(0, UnknownDimensionContext);
	}
	public ws(): WsContext {
		return this.getRuleContext(0, WsContext);
	}
	constructor(ctx: TermContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: inlineListener): void {
		if (listener.enterUnknownTerm) {
			listener.enterUnknownTerm(this);
		}
	}
	// @Override
	public exitRule(listener: inlineListener): void {
		if (listener.exitUnknownTerm) {
			listener.exitUnknownTerm(this);
		}
	}
	// @Override
	public accept<Result>(visitor: inlineVisitor<Result>): Result {
		if (visitor.visitUnknownTerm) {
			return visitor.visitUnknownTerm(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class Function_Context extends ParserRuleContext {
	public Function_(): TerminalNode { return this.getToken(inlineParser.Function_, 0); }
	public ws(): WsContext[];
	public ws(i: number): WsContext;
	public ws(i?: number): WsContext | WsContext[] {
		if (i === undefined) {
			return this.getRuleContexts(WsContext);
		} else {
			return this.getRuleContext(i, WsContext);
		}
	}
	public expr(): ExprContext {
		return this.getRuleContext(0, ExprContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return inlineParser.RULE_function_; }
	// @Override
	public enterRule(listener: inlineListener): void {
		if (listener.enterFunction_) {
			listener.enterFunction_(this);
		}
	}
	// @Override
	public exitRule(listener: inlineListener): void {
		if (listener.exitFunction_) {
			listener.exitFunction_(this);
		}
	}
	// @Override
	public accept<Result>(visitor: inlineVisitor<Result>): Result {
		if (visitor.visitFunction_) {
			return visitor.visitFunction_(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class HexcolorContext extends ParserRuleContext {
	public Hash(): TerminalNode { return this.getToken(inlineParser.Hash, 0); }
	public ws(): WsContext {
		return this.getRuleContext(0, WsContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return inlineParser.RULE_hexcolor; }
	// @Override
	public enterRule(listener: inlineListener): void {
		if (listener.enterHexcolor) {
			listener.enterHexcolor(this);
		}
	}
	// @Override
	public exitRule(listener: inlineListener): void {
		if (listener.exitHexcolor) {
			listener.exitHexcolor(this);
		}
	}
	// @Override
	public accept<Result>(visitor: inlineVisitor<Result>): Result {
		if (visitor.visitHexcolor) {
			return visitor.visitHexcolor(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class NumberContext extends ParserRuleContext {
	public Number(): TerminalNode { return this.getToken(inlineParser.Number, 0); }
	public Plus(): TerminalNode | undefined { return this.tryGetToken(inlineParser.Plus, 0); }
	public Minus(): TerminalNode | undefined { return this.tryGetToken(inlineParser.Minus, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return inlineParser.RULE_number; }
	// @Override
	public enterRule(listener: inlineListener): void {
		if (listener.enterNumber) {
			listener.enterNumber(this);
		}
	}
	// @Override
	public exitRule(listener: inlineListener): void {
		if (listener.exitNumber) {
			listener.exitNumber(this);
		}
	}
	// @Override
	public accept<Result>(visitor: inlineVisitor<Result>): Result {
		if (visitor.visitNumber) {
			return visitor.visitNumber(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class PercentageContext extends ParserRuleContext {
	public Percentage(): TerminalNode { return this.getToken(inlineParser.Percentage, 0); }
	public Plus(): TerminalNode | undefined { return this.tryGetToken(inlineParser.Plus, 0); }
	public Minus(): TerminalNode | undefined { return this.tryGetToken(inlineParser.Minus, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return inlineParser.RULE_percentage; }
	// @Override
	public enterRule(listener: inlineListener): void {
		if (listener.enterPercentage) {
			listener.enterPercentage(this);
		}
	}
	// @Override
	public exitRule(listener: inlineListener): void {
		if (listener.exitPercentage) {
			listener.exitPercentage(this);
		}
	}
	// @Override
	public accept<Result>(visitor: inlineVisitor<Result>): Result {
		if (visitor.visitPercentage) {
			return visitor.visitPercentage(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class DimensionContext extends ParserRuleContext {
	public Dimension(): TerminalNode { return this.getToken(inlineParser.Dimension, 0); }
	public Plus(): TerminalNode | undefined { return this.tryGetToken(inlineParser.Plus, 0); }
	public Minus(): TerminalNode | undefined { return this.tryGetToken(inlineParser.Minus, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return inlineParser.RULE_dimension; }
	// @Override
	public enterRule(listener: inlineListener): void {
		if (listener.enterDimension) {
			listener.enterDimension(this);
		}
	}
	// @Override
	public exitRule(listener: inlineListener): void {
		if (listener.exitDimension) {
			listener.exitDimension(this);
		}
	}
	// @Override
	public accept<Result>(visitor: inlineVisitor<Result>): Result {
		if (visitor.visitDimension) {
			return visitor.visitDimension(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class UnknownDimensionContext extends ParserRuleContext {
	public UnknownDimension(): TerminalNode { return this.getToken(inlineParser.UnknownDimension, 0); }
	public Plus(): TerminalNode | undefined { return this.tryGetToken(inlineParser.Plus, 0); }
	public Minus(): TerminalNode | undefined { return this.tryGetToken(inlineParser.Minus, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return inlineParser.RULE_unknownDimension; }
	// @Override
	public enterRule(listener: inlineListener): void {
		if (listener.enterUnknownDimension) {
			listener.enterUnknownDimension(this);
		}
	}
	// @Override
	public exitRule(listener: inlineListener): void {
		if (listener.exitUnknownDimension) {
			listener.exitUnknownDimension(this);
		}
	}
	// @Override
	public accept<Result>(visitor: inlineVisitor<Result>): Result {
		if (visitor.visitUnknownDimension) {
			return visitor.visitUnknownDimension(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class Any_Context extends ParserRuleContext {
	public ident(): IdentContext | undefined {
		return this.tryGetRuleContext(0, IdentContext);
	}
	public ws(): WsContext[];
	public ws(i: number): WsContext;
	public ws(i?: number): WsContext | WsContext[] {
		if (i === undefined) {
			return this.getRuleContexts(WsContext);
		} else {
			return this.getRuleContext(i, WsContext);
		}
	}
	public number(): NumberContext | undefined {
		return this.tryGetRuleContext(0, NumberContext);
	}
	public percentage(): PercentageContext | undefined {
		return this.tryGetRuleContext(0, PercentageContext);
	}
	public dimension(): DimensionContext | undefined {
		return this.tryGetRuleContext(0, DimensionContext);
	}
	public unknownDimension(): UnknownDimensionContext | undefined {
		return this.tryGetRuleContext(0, UnknownDimensionContext);
	}
	public String_(): TerminalNode | undefined { return this.tryGetToken(inlineParser.String_, 0); }
	public Uri(): TerminalNode | undefined { return this.tryGetToken(inlineParser.Uri, 0); }
	public Hash(): TerminalNode | undefined { return this.tryGetToken(inlineParser.Hash, 0); }
	public UnicodeRange(): TerminalNode | undefined { return this.tryGetToken(inlineParser.UnicodeRange, 0); }
	public Includes(): TerminalNode | undefined { return this.tryGetToken(inlineParser.Includes, 0); }
	public DashMatch(): TerminalNode | undefined { return this.tryGetToken(inlineParser.DashMatch, 0); }
	public Function_(): TerminalNode | undefined { return this.tryGetToken(inlineParser.Function_, 0); }
	public any_(): Any_Context[];
	public any_(i: number): Any_Context;
	public any_(i?: number): Any_Context | Any_Context[] {
		if (i === undefined) {
			return this.getRuleContexts(Any_Context);
		} else {
			return this.getRuleContext(i, Any_Context);
		}
	}
	public unused(): UnusedContext[];
	public unused(i: number): UnusedContext;
	public unused(i?: number): UnusedContext | UnusedContext[] {
		if (i === undefined) {
			return this.getRuleContexts(UnusedContext);
		} else {
			return this.getRuleContext(i, UnusedContext);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return inlineParser.RULE_any_; }
	// @Override
	public enterRule(listener: inlineListener): void {
		if (listener.enterAny_) {
			listener.enterAny_(this);
		}
	}
	// @Override
	public exitRule(listener: inlineListener): void {
		if (listener.exitAny_) {
			listener.exitAny_(this);
		}
	}
	// @Override
	public accept<Result>(visitor: inlineVisitor<Result>): Result {
		if (visitor.visitAny_) {
			return visitor.visitAny_(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class GeneralEnclosedContext extends ParserRuleContext {
	public Function_(): TerminalNode { return this.getToken(inlineParser.Function_, 0); }
	public any_(): Any_Context[];
	public any_(i: number): Any_Context;
	public any_(i?: number): Any_Context | Any_Context[] {
		if (i === undefined) {
			return this.getRuleContexts(Any_Context);
		} else {
			return this.getRuleContext(i, Any_Context);
		}
	}
	public unused(): UnusedContext[];
	public unused(i: number): UnusedContext;
	public unused(i?: number): UnusedContext | UnusedContext[] {
		if (i === undefined) {
			return this.getRuleContexts(UnusedContext);
		} else {
			return this.getRuleContext(i, UnusedContext);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return inlineParser.RULE_generalEnclosed; }
	// @Override
	public enterRule(listener: inlineListener): void {
		if (listener.enterGeneralEnclosed) {
			listener.enterGeneralEnclosed(this);
		}
	}
	// @Override
	public exitRule(listener: inlineListener): void {
		if (listener.exitGeneralEnclosed) {
			listener.exitGeneralEnclosed(this);
		}
	}
	// @Override
	public accept<Result>(visitor: inlineVisitor<Result>): Result {
		if (visitor.visitGeneralEnclosed) {
			return visitor.visitGeneralEnclosed(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class UnusedContext extends ParserRuleContext {
	public ws(): WsContext {
		return this.getRuleContext(0, WsContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return inlineParser.RULE_unused; }
	// @Override
	public enterRule(listener: inlineListener): void {
		if (listener.enterUnused) {
			listener.enterUnused(this);
		}
	}
	// @Override
	public exitRule(listener: inlineListener): void {
		if (listener.exitUnused) {
			listener.exitUnused(this);
		}
	}
	// @Override
	public accept<Result>(visitor: inlineVisitor<Result>): Result {
		if (visitor.visitUnused) {
			return visitor.visitUnused(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class Var_Context extends ParserRuleContext {
	public Var(): TerminalNode { return this.getToken(inlineParser.Var, 0); }
	public ws(): WsContext[];
	public ws(i: number): WsContext;
	public ws(i?: number): WsContext | WsContext[] {
		if (i === undefined) {
			return this.getRuleContexts(WsContext);
		} else {
			return this.getRuleContext(i, WsContext);
		}
	}
	public Variable(): TerminalNode { return this.getToken(inlineParser.Variable, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return inlineParser.RULE_var_; }
	// @Override
	public enterRule(listener: inlineListener): void {
		if (listener.enterVar_) {
			listener.enterVar_(this);
		}
	}
	// @Override
	public exitRule(listener: inlineListener): void {
		if (listener.exitVar_) {
			listener.exitVar_(this);
		}
	}
	// @Override
	public accept<Result>(visitor: inlineVisitor<Result>): Result {
		if (visitor.visitVar_) {
			return visitor.visitVar_(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class CalcContext extends ParserRuleContext {
	public Calc(): TerminalNode { return this.getToken(inlineParser.Calc, 0); }
	public ws(): WsContext[];
	public ws(i: number): WsContext;
	public ws(i?: number): WsContext | WsContext[] {
		if (i === undefined) {
			return this.getRuleContexts(WsContext);
		} else {
			return this.getRuleContext(i, WsContext);
		}
	}
	public calcSum(): CalcSumContext {
		return this.getRuleContext(0, CalcSumContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return inlineParser.RULE_calc; }
	// @Override
	public enterRule(listener: inlineListener): void {
		if (listener.enterCalc) {
			listener.enterCalc(this);
		}
	}
	// @Override
	public exitRule(listener: inlineListener): void {
		if (listener.exitCalc) {
			listener.exitCalc(this);
		}
	}
	// @Override
	public accept<Result>(visitor: inlineVisitor<Result>): Result {
		if (visitor.visitCalc) {
			return visitor.visitCalc(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class CalcSumContext extends ParserRuleContext {
	public calcProduct(): CalcProductContext[];
	public calcProduct(i: number): CalcProductContext;
	public calcProduct(i?: number): CalcProductContext | CalcProductContext[] {
		if (i === undefined) {
			return this.getRuleContexts(CalcProductContext);
		} else {
			return this.getRuleContext(i, CalcProductContext);
		}
	}
	public Space(): TerminalNode[];
	public Space(i: number): TerminalNode;
	public Space(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(inlineParser.Space);
		} else {
			return this.getToken(inlineParser.Space, i);
		}
	}
	public ws(): WsContext[];
	public ws(i: number): WsContext;
	public ws(i?: number): WsContext | WsContext[] {
		if (i === undefined) {
			return this.getRuleContexts(WsContext);
		} else {
			return this.getRuleContext(i, WsContext);
		}
	}
	public Plus(): TerminalNode[];
	public Plus(i: number): TerminalNode;
	public Plus(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(inlineParser.Plus);
		} else {
			return this.getToken(inlineParser.Plus, i);
		}
	}
	public Minus(): TerminalNode[];
	public Minus(i: number): TerminalNode;
	public Minus(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(inlineParser.Minus);
		} else {
			return this.getToken(inlineParser.Minus, i);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return inlineParser.RULE_calcSum; }
	// @Override
	public enterRule(listener: inlineListener): void {
		if (listener.enterCalcSum) {
			listener.enterCalcSum(this);
		}
	}
	// @Override
	public exitRule(listener: inlineListener): void {
		if (listener.exitCalcSum) {
			listener.exitCalcSum(this);
		}
	}
	// @Override
	public accept<Result>(visitor: inlineVisitor<Result>): Result {
		if (visitor.visitCalcSum) {
			return visitor.visitCalcSum(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class CalcProductContext extends ParserRuleContext {
	public calcValue(): CalcValueContext[];
	public calcValue(i: number): CalcValueContext;
	public calcValue(i?: number): CalcValueContext | CalcValueContext[] {
		if (i === undefined) {
			return this.getRuleContexts(CalcValueContext);
		} else {
			return this.getRuleContext(i, CalcValueContext);
		}
	}
	public ws(): WsContext[];
	public ws(i: number): WsContext;
	public ws(i?: number): WsContext | WsContext[] {
		if (i === undefined) {
			return this.getRuleContexts(WsContext);
		} else {
			return this.getRuleContext(i, WsContext);
		}
	}
	public number(): NumberContext[];
	public number(i: number): NumberContext;
	public number(i?: number): NumberContext | NumberContext[] {
		if (i === undefined) {
			return this.getRuleContexts(NumberContext);
		} else {
			return this.getRuleContext(i, NumberContext);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return inlineParser.RULE_calcProduct; }
	// @Override
	public enterRule(listener: inlineListener): void {
		if (listener.enterCalcProduct) {
			listener.enterCalcProduct(this);
		}
	}
	// @Override
	public exitRule(listener: inlineListener): void {
		if (listener.exitCalcProduct) {
			listener.exitCalcProduct(this);
		}
	}
	// @Override
	public accept<Result>(visitor: inlineVisitor<Result>): Result {
		if (visitor.visitCalcProduct) {
			return visitor.visitCalcProduct(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class CalcValueContext extends ParserRuleContext {
	public number(): NumberContext | undefined {
		return this.tryGetRuleContext(0, NumberContext);
	}
	public ws(): WsContext[];
	public ws(i: number): WsContext;
	public ws(i?: number): WsContext | WsContext[] {
		if (i === undefined) {
			return this.getRuleContexts(WsContext);
		} else {
			return this.getRuleContext(i, WsContext);
		}
	}
	public dimension(): DimensionContext | undefined {
		return this.tryGetRuleContext(0, DimensionContext);
	}
	public unknownDimension(): UnknownDimensionContext | undefined {
		return this.tryGetRuleContext(0, UnknownDimensionContext);
	}
	public percentage(): PercentageContext | undefined {
		return this.tryGetRuleContext(0, PercentageContext);
	}
	public calcSum(): CalcSumContext | undefined {
		return this.tryGetRuleContext(0, CalcSumContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return inlineParser.RULE_calcValue; }
	// @Override
	public enterRule(listener: inlineListener): void {
		if (listener.enterCalcValue) {
			listener.enterCalcValue(this);
		}
	}
	// @Override
	public exitRule(listener: inlineListener): void {
		if (listener.exitCalcValue) {
			listener.exitCalcValue(this);
		}
	}
	// @Override
	public accept<Result>(visitor: inlineVisitor<Result>): Result {
		if (visitor.visitCalcValue) {
			return visitor.visitCalcValue(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class IdentContext extends ParserRuleContext {
	public Ident(): TerminalNode { return this.getToken(inlineParser.Ident, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return inlineParser.RULE_ident; }
	// @Override
	public enterRule(listener: inlineListener): void {
		if (listener.enterIdent) {
			listener.enterIdent(this);
		}
	}
	// @Override
	public exitRule(listener: inlineListener): void {
		if (listener.exitIdent) {
			listener.exitIdent(this);
		}
	}
	// @Override
	public accept<Result>(visitor: inlineVisitor<Result>): Result {
		if (visitor.visitIdent) {
			return visitor.visitIdent(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class WsContext extends ParserRuleContext {
	public Comment(): TerminalNode[];
	public Comment(i: number): TerminalNode;
	public Comment(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(inlineParser.Comment);
		} else {
			return this.getToken(inlineParser.Comment, i);
		}
	}
	public Space(): TerminalNode[];
	public Space(i: number): TerminalNode;
	public Space(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(inlineParser.Space);
		} else {
			return this.getToken(inlineParser.Space, i);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return inlineParser.RULE_ws; }
	// @Override
	public enterRule(listener: inlineListener): void {
		if (listener.enterWs) {
			listener.enterWs(this);
		}
	}
	// @Override
	public exitRule(listener: inlineListener): void {
		if (listener.exitWs) {
			listener.exitWs(this);
		}
	}
	// @Override
	public accept<Result>(visitor: inlineVisitor<Result>): Result {
		if (visitor.visitWs) {
			return visitor.visitWs(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


