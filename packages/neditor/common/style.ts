export const CSSStyleDeclarationSample = {
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
  'marginBottom': '',
  'marginLeft': '',
  'marginRight': '',
  'marginTop': '',

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

export type IStyleDeclarationKeys = keyof typeof CSSStyleDeclarationSample;

export type IStyleDeclaration = {
  [k in IStyleDeclarationKeys]: string;
};
