export const CSSStyleDeclarationSample = {
  'align-content': '',
  'align-items': '',
  'align-self': '',

  backgroundColor: '',

  'border-bottom-color': '',
  'border-bottom-left-radius': '',
  'border-bottom-right-radius': '',
  'border-bottom-style': '',
  'border-bottom-width': '',
  'border-left-color': '',
  'border-left-style': '',
  'border-left-width': '',
  'border-right-color': '',
  'border-right-style': '',
  'border-right-width': '',
  'border-top-color': '',
  'border-top-left-radius': '',
  'border-top-right-radius': '',
  'border-top-style': '',
  'border-top-width': '',
  bottom: '',
  'box-shadow': '',
  'box-sizing': '',
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
  'padding-bottom': '',
  'padding-left': '',
  'padding-right': '',
  'padding-top': '',

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
