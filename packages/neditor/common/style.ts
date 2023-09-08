export const CommonStyleDeclarationSample = {
  'align-content': '',
  'align-items': '',
  'align-self': '',

  backgroundColor: '',

  borderBottomColor: '',
  borderBottomLeftRadius: '',
  borderBottomRightRadius: '',
  borderBottomStyle: '',
  borderBottomWidth: '',
  borderLeftColor: '',
  borderLeftStyle: '',
  borderLeftWidth: '',
  borderRightColor: '',
  borderRightStyle: '',
  borderRightWidth: '',
  borderTopColor: '',
  borderTopLeftRadius: '',
  borderTopRightRadius: '',
  borderTopStyle: '',
  borderTopWidth: '',
  borderColor: '',
  borderStyle: '',
  borderWidth: '',

  bottom: '',
  'box-shadow': '',
  boxSizing: '',
  color: '',

  'column-gap': '',

  cursor: '',

  display: '',

  fill: '',
  'fill-opacity': '',
  'fill-rule': '',
  // filter: '',
  // 'backdrop-filter': '',
  'flex-basis': '',
  'flex-direction': '',
  'flex-flow': '',
  'flex-grow': '',
  'flex-shrink': '',
  'flex-wrap': '',

  height: '',
  // 'inline-size':'',
  'justify-content': '',
  'justify-items': '',
  'justify-self': '',
  left: '',
  'letter-spacing': '',
  // svg
  // 'lighting-color':'',
  'line-break': '',
  'line-height': '',
  // 'list-style':'',
  // 'list-style-image':'',
  // 'list-style-position': '',
  // 'list-style-type': '',
  marginBottom: '',
  marginLeft: '',
  marginRight: '',
  marginTop: '',

  maxHeight: '',
  maxWidth: '',
  minHeight: '',
  minWidth: '',

  opacity: '',
  paddingBottom: '',
  paddingLeft: '',
  paddingRight: '',
  paddingTop: '',
  padding: '',

  position: '',

  overflowWrap: '',
  right: '',
  'row-gap': '',

  'stroke-dasharray': '',
  'stroke-dashoffset': '',
  'stroke-linecap': '',
  'stroke-linejoin': '',
  'stroke-miterlimit': '',
  'stroke-opacity': '',
  'stroke-width': '',

  top: '',
  transform: '',
  'transform-box': '',
  'transform-origin': '',
  'transform-style': '',
  'vertical-align': '',
  whiteSpace: '',
  width: '',
  'word-break': '',
  'word-spacing': '',
  'word-wrap': '',
  // 'writing-mode':'',
  'z-index': '',
} as const;

const BlockLevelStyleDeclarationSample = {
  overflowWrap: '',
  whiteSpace: '',
  lineHeight: '',
  position: '',
  textPath: '',
  // textAlign: '',
  // 'text-align': '',
  // 'text-align-last': '',
  // 'text-anchor': '',
  // 'text-combine-upright': '',
  // 'text-decoration': '',
  // 'text-decoration-color': '',
  // 'text-decoration-line': '',
  // 'text-decoration-style': '',
  // 'text-emphasis': '',
  // 'text-emphasis-color': '',
  // 'text-emphasis-position': '',
  // 'text-emphasis-style': '',
  // 'text-indent': '',
  // 'text-justify': '',
  // 'text-orientation': '',
  // 'text-overflow': '',
  // 'text-rendering': '',
  // 'text-shadow': '',
  // 'text-transform': '',
  // 'text-underline-position': '',
  // fontSize: '',
  // fontFamily: '',
  // fontWeight: '',
} as const;

const InlineLevelStyleDeclarationSample = {
  display: '',
  position: '',

  color: '',

  fontSize: '',
  fontFamily: '',
  fontWeight: '',
  // 'font-family': '',
  // 'font-feature-settings': '',
  // 'font-kerning': '',
  // 'font-size': '',
  // 'font-size-adjust': '',
  // 'font-stretch': '',
  // 'font-style': '',
  // 'font-synthesis': '',
  // 'font-variant': '',
  // 'font-variant-caps': '',
  // 'font-variant-east-asian': '',
  // 'font-variant-ligatures': '',
  // 'font-variant-numeric': '',
  // 'font-variant-position': '',
  // 'font-weight': '',
} as const;

type CommonStyleDeclarationKeys = keyof typeof CommonStyleDeclarationSample;
type BlockLevelOnlyStyleDeclarationKeys = keyof typeof BlockLevelStyleDeclarationSample;
type InlineLevelStyleDeclarationKeys = keyof typeof InlineLevelStyleDeclarationSample;

export type BlockLevelDeclarationKeys = CommonStyleDeclarationKeys | BlockLevelOnlyStyleDeclarationKeys

export type IStyleDeclaration = {
  [k in BlockLevelDeclarationKeys | InlineLevelStyleDeclarationKeys]: string;
};

export type IBlockStyleDeclaration = Partial<{
  [k in CommonStyleDeclarationKeys | BlockLevelOnlyStyleDeclarationKeys]: string;
}>;

export type IInlineStyleDeclaration = Partial<{
  [k in InlineLevelStyleDeclarationKeys]: string;
}>;
