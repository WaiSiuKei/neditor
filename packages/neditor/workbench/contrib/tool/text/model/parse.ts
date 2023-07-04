import type { Attrs, Schema } from "./schema";
import type { Fragment } from "./fragment";
import type { Mark } from "./mark";

/// A value that describes how to parse a given DOM node or inline
/// style as a ProseMirror node or mark.
export interface ParseRule {
  /// A CSS selector describing the kind of DOM elements to match. A
  /// single rule should have _either_ a `tag` or a `style` property.
  tag?: string

  /// The namespace to match. This should be used with `tag`.
  /// Nodes are only matched when the namespace matches or this property
  /// is null.
  namespace?: string

  /// A CSS property name to match. When given, this rule matches
  /// inline styles that list that property. May also have the form
  /// `"property=value"`, in which case the rule only matches if the
  /// property's value exactly matches the given value. (For more
  /// complicated filters, use [`getAttrs`](#model.ParseRule.getAttrs)
  /// and return false to indicate that the match failed.) Rules
  /// matching styles may only produce [marks](#model.ParseRule.mark),
  /// not nodes.
  style?: string

  /// Can be used to change the order in which the parse rules in a
  /// schema are tried. Those with higher priority come first. Rules
  /// without a priority are counted as having priority 50. This
  /// property is only meaningful in a schema—when directly
  /// constructing a parser, the order of the rule array is used.
  priority?: number

  /// By default, when a rule matches an element or style, no further
  /// rules get a chance to match it. By setting this to `false`, you
  /// indicate that even when this rule matches, other rules that come
  /// after it should also run.
  consuming?: boolean

  /// When given, restricts this rule to only match when the current
  /// context—the parent nodes into which the content is being
  /// parsed—matches this expression. Should contain one or more node
  /// names or node group names followed by single or double slashes.
  /// For example `"paragraph/"` means the rule only matches when the
  /// parent node is a paragraph, `"blockquote/paragraph/"` restricts
  /// it to be in a paragraph that is inside a blockquote, and
  /// `"section//"` matches any position inside a section—a double
  /// slash matches any sequence of ancestor nodes. To allow multiple
  /// different contexts, they can be separated by a pipe (`|`)
  /// character, as in `"blockquote/|list_item/"`.
  context?: string

  /// The name of the node type to create when this rule matches. Only
  /// valid for rules with a `tag` property, not for style rules. Each
  /// rule should have one of a `node`, `mark`, `clearMark`, or
  /// `ignore` property (except when it appears in a
  /// [node](#model.NodeSpec.parseDOM) or [mark
  /// spec](#model.MarkSpec.parseDOM), in which case the `node` or
  /// `mark` property will be derived from its position).
  node?: string

  /// The name of the mark type to wrap the matched content in.
  mark?: string

  /// [Style](#model.ParseRule.style) rules can remove marks from the
  /// set of active marks.
  clearMark?: (mark: Mark) => boolean

  /// When true, ignore content that matches this rule.
  ignore?: boolean

  /// When true, finding an element that matches this rule will close
  /// the current node.
  closeParent?: boolean

  /// When true, ignore the node that matches this rule, but do parse
  /// its content.
  skip?: boolean

  /// Attributes for the node or mark created by this rule. When
  /// `getAttrs` is provided, it takes precedence.
  attrs?: Attrs

  /// A function used to compute the attributes for the node or mark
  /// created by this rule. Can also be used to describe further
  /// conditions the DOM element or style must match. When it returns
  /// `false`, the rule won't match. When it returns null or undefined,
  /// that is interpreted as an empty/default set of attributes.
  ///
  /// Called with a DOM Element for `tag` rules, and with a string (the
  /// style's value) for `style` rules.
  getAttrs?: (node: HTMLElement | string) => Attrs | false | null

  /// For `tag` rules that produce non-leaf nodes or marks, by default
  /// the content of the DOM element is parsed as content of the mark
  /// or node. If the child nodes are in a descendent node, this may be
  /// a CSS selector string that the parser must use to find the actual
  /// content element, or a function that returns the actual content
  /// element to the parser.
  // contentElement?: string | HTMLElement | ((node: DOMNode) => HTMLElement)

  /// Can be used to override the content of a matched node. When
  /// present, instead of parsing the node's child nodes, the result of
  /// this function is used.
  // getContent?: (node: DOMNode, schema: Schema) => Fragment

  /// Controls whether whitespace should be preserved when parsing the
  /// content inside the matched element. `false` means whitespace may
  /// be collapsed, `true` means that whitespace should be preserved
  /// but newlines normalized to spaces, and `"full"` means that
  /// newlines should also be preserved.
  preserveWhitespace?: boolean | "full"
}
