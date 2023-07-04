// In the visual formatting model, each element in the document tree generates
// zero or more boxes.
//   https://www.w3.org/TR/CSS21/visuren.html#box-gen
//
// A box generator recursively visits an HTML subtree that starts with a given
// element, creates a matching forest of boxes, and returns zero or more root
// boxes.
//
// As a side-effect, computed styles of visited HTML elements are updated.
import { NodeVisitor } from '../dom/node';
import { RTree } from './r_tree';
import { UsedStyleProvider } from './used_style';
import type { HTMLElement } from '../dom/html_element';
import { DirState, PseudoElementType } from '../dom/html_element';
import { ComputedStyleDeclaration } from '../cssom/computed_style_declaration';
import { CodePoint, Paragraph, RefCountedParagraphCollection, TextTransform } from './paragraph';
import { Box, Boxes, Level } from './box';
import type { Document } from '../dom/document';
import type { Element } from '../dom/element';
import type { Text } from '../dom/text';
import { NOTIMPLEMENTED, NOTREACHED } from '@neditor/core/base/common/notreached';
import { LOG, WARNING } from '@neditor/core/base/logging';
import { DCHECK } from '@neditor/core/base/check';
import { HTMLBRElement } from '../dom/html_br_element';
import { KeywordValue, Value } from '../cssom/keyword_value';
import { ContainerBox } from './container_box';
import { PropertyKey } from '../cssom/property_definitions';
import { MutableComputedStyleData } from '../cssom/computed_style_data';
import { NotReachedPropertyValueVisitor } from '../cssom/property_value_visitor';
import { BlockLevelBlockContainerBox } from './block_formatting_block_container_box';
import { BaseDirection } from './base_direction';
import { GetComputedStyleOfAnonymousBox } from '../cssom/computed_style';
import {
  CollapseWhiteSpace,
  DoesAllowTextWrapping,
  DoesCollapseSegmentBreaks,
  DoesCollapseWhiteSpace,
  FindNextNewlineSequence
} from './white_space_processing';
import { TextBox } from './text_box';
import { HTMLImageElement } from '../dom/html_image_element';
import { ReplacedBox, ReplacedBoxMode, ReplaceImageCB } from './replaced_box';
import { LayoutUnit } from './layout_unit';
import { Optional } from '@neditor/core/base/common/typescript';
import { SizeF } from '../math/size_f';
import { BlockLevelReplacedBox } from './block_level_replaced_box';
import type { Comment } from '../dom/comment';
import { Size } from '../math/size';
import { InlineLevelReplacedBox } from './inline_level_replaced_box';
import { BreakIterator } from '@neditor/icu';
import { FreehandElement } from '../dom/custom/freehand_element';
import { Path } from '../render_tree/path';
import { Image } from '../render_tree/image';
import { ICopyableReference, IDisposable, IReference } from '../../base/common/lifecycle';
import { ParagraphRefStore } from './layout';
import { InlineContainerBox } from './inline_container_box';
import { LayoutTextes } from './layout_text';

export class Context {
  constructor(
    public readonly used_style_provider: UsedStyleProvider,
    // LayoutStatTracker* layout_stat_tracker,
    public readonly line_break_iterator: BreakIterator,
    public readonly character_break_iterator: BreakIterator,
    // The HTML and BODY tags may have had their background style properties
    // propagated up to the initial containing block.  If so, we should not
    // re-use those properties on that element.  This value will track that
    // element.
    public readonly ignore_background_element: HTMLElement,
    // The maximum element depth for layout.

    public readonly dom_max_element_depth: number,
    public readonly paragraph_collection: RefCountedParagraphCollection,
    public readonly textBoxes: Set<TextBox>,
  ) {
  }
}

export class BoxGenerator extends NodeVisitor {
  static ID = 1;
  public id = BoxGenerator.ID++;
  private parent_css_computed_style_declaration_: ComputedStyleDeclaration;
//  const scoped_refptr<const web_animations::AnimationSet> parent_animations_;
//   The current element depth.
  private dom_element_depth_: number;
  private context_: Context;

  private generating_html_element_?: HTMLElement;

  // The result of a box generator is zero or more root boxes.
  private boxes_: Boxes = [];

  constructor(
    parent_css_computed_style_declaration: ComputedStyleDeclaration,
    // Parent animations are passed separately in order to enable
    // grandparent inheritance of color property animations when the
    // parent is a pseudo element.
    // TODO: Remove this parameter when full support for
    // animation inheritance is implemented.
    //               const scoped_refptr<const web_animations::AnimationSet>&
    //                   parent_animations,
    private paragraph_store_: ParagraphRefStore,
    dom_element_depth_: number,
    context: Context
  ) {
    super();
    this.parent_css_computed_style_declaration_ = parent_css_computed_style_declaration;
    this.dom_element_depth_ = dom_element_depth_;
    this.context_ = context;
  }

  //  void Visit(dom::CDATASection* cdata_section) override;
  //  void Visit(dom::Comment* comment) override;
  VisitDocument(document: Document) {
    NOTREACHED();
  }
  //  void Visit(dom::DocumentType* document_type) override;
  VisitElement(element: Element) {
    if (this.dom_element_depth_ > this.context_.dom_max_element_depth) {
      LOG(WARNING, 'Elements too deep in the DOM tree are ignored in layout.');
      return;
    }

    let html_element = element.AsHTMLElement();
    if (!html_element) {
      return;
    }
    this.generating_html_element_ = html_element;

    let partial_layout_is_enabled = false;

    // If the html element already has layout boxes, we can reuse them.
    if (partial_layout_is_enabled && html_element.layout_boxes()) {
      NOTIMPLEMENTED();
      // let layout_boxes = html_element.layout_boxes() as LayoutBoxes;
      // DCHECK(this.boxes_.length === 0);
      // DCHECK(layout_boxes.boxes().length > 0);
      // if (layout_boxes.boxes()[0].GetLevel() == Level.kBlockLevel) {
      //   this.boxes_ = layout_boxes.boxes();
      //   for (let box of this.boxes_) {
      //     do {
      //       box.InvalidateParent();
      //       let ret = box.GetSplitSibling();
      //       if (!ret) break;
      //       box = ret;
      //     } while (box);
      //   }
      //   return;
      // }
    }

    let freehandElement = html_element.AsFreehandElement();
    if (freehandElement) {
      this.VisitFreehandElement(freehandElement);
      return;
    }

    let img_element = html_element.AsHTMLImageElement();
    if (img_element) {
      this.VisitImageElement(img_element);
      return;
    }

    let br_element = html_element.AsHTMLBRElement();
    if (br_element) {
      this.VisitBrElement(br_element);
      return;
    }

    this.VisitNonReplacedElement(html_element);
  }
  // Append the text from the text node to the text paragraph and create the
  // node's initial text box. The text box has indices that map to the paragraph,
  // which allows it to retrieve its underlying text. Initially, a single text box
  // is created that encompasses the entire node.

  // Prior to layout, the paragraph applies the Unicode bidirectional algorithm
  // to its text (http://www.unicode.org/reports/tr9/) and causes the text boxes
  // referencing it to split at level runs.
  //
  // During layout, the text boxes are potentially split further, as the paragraph
  // determines line breaking locations for its text at soft wrap opportunities
  // (https://www.w3.org/TR/css-text-3/#soft-wrap-opportunity) according to the
  // Unicode line breaking algorithm (http://www.unicode.org/reports/tr14/).
  VisitText(text: Text) {
    let css_computed_style_declaration = new ComputedStyleDeclaration();
    css_computed_style_declaration.SetData(
      GetComputedStyleOfAnonymousBox(this.parent_css_computed_style_declaration_));

    // Copy inheritable animatable properties from the parent.
    // css_computed_style_declaration.set_animations(
    //   GetAnimationsForAnonymousBox(parent_animations_));

    DCHECK(text);
    DCHECK(css_computed_style_declaration.data());

    let original_text = text.text();
    if (original_text.length === 0) {
      return;
    }

    let white_space_property =
      css_computed_style_declaration.data()!.white_space;
    let should_preserve_segment_breaks =
      !DoesCollapseSegmentBreaks(white_space_property);
    let should_collapse_white_space =
      DoesCollapseWhiteSpace(white_space_property);
    let should_prevent_text_wrapping =
      !DoesAllowTextWrapping(white_space_property);

    // Loop until the entire text is consumed. If the white-space property does
    // not have a value of "pre" or "pre-wrap" then the entire text will be
    // processed the first time through the loop; otherwise, the text will be
    // split at newline sequences.
    let start_index = 0;
    while (start_index < original_text.length) {
      let end_index: number;
      let newline_sequence_length: number;

      // Phase I: Segment Break Transformation Rules
      // https://www.w3.org/TR/css3-text/#line-break-transform
      let generates_newline = false;
      if (should_preserve_segment_breaks) {
        let { result, sequence_start, sequence_length } = FindNextNewlineSequence(original_text, start_index);
        generates_newline = result;
        end_index = sequence_start;
        newline_sequence_length = sequence_length;
      } else {
        end_index = original_text.length;
        newline_sequence_length = 0;
      }

      let modifiable_text =
        original_text.substr(start_index, end_index - start_index);

      // Phase I: Collapsing and Transformation
      //   https://www.w3.org/TR/css3-text/#white-space-phase-1
      if (should_collapse_white_space) {
        modifiable_text = CollapseWhiteSpace(modifiable_text);

        // If the paragraph hasn't been started yet and the text only consists of
        // a collapsible space, then return without creating the box. The leading
        // spaces in a line box are collapsed, so this box would be collapsed
        // away during the layout.
        if (this.paragraph_store_.value!.object.GetTextEndPosition() == 0 && modifiable_text == ' ') {
          return;
        }
      }

      let transform: TextTransform;
      if (css_computed_style_declaration.data()!.text_transform ==
        KeywordValue.GetUppercase()) {
        transform = TextTransform.kUppercaseTextTransform;
      } else {
        transform = TextTransform.kNoTextTransform;
      }

      DCHECK(this.paragraph_store_.value);
      let text_start_position = this.paragraph_store_.value.object.AppendUtf8String(modifiable_text, transform);
      let text_end_position = this.paragraph_store_.value.object.GetTextEndPosition();

      let kIsProductOfSplitFalse = false;

      let textBox = new TextBox(
        css_computed_style_declaration,
        this.paragraph_store_.value.copy(),
        text_start_position,
        text_end_position,
        generates_newline,
        kIsProductOfSplitFalse,
        this.context_.used_style_provider/*, context_.layout_stat_tracker*/,
        this.context_);
      textBox.node = text;
      text.SetLayoutObject(new LayoutTextes(text, textBox));
      this.boxes_.push(textBox);
      this.context_.textBoxes.add(textBox);

      // Newline sequences should be transformed into a preserved line feed.
      //   https://www.w3.org/TR/css3-text/#line-break-transform
      if (generates_newline) {
        this.paragraph_store_.value!.object.AppendCodePoint(CodePoint.kLineFeedCodePoint);
      }

      DCHECK(end_index!);
      DCHECK(newline_sequence_length!);
      start_index = end_index! + newline_sequence_length!;
    }

    // If the white-space style prevents text wrapping and the text ends in a
    // space, then add a no-break space to the paragraph, so that the last space
    // will be treated as a no-break space when determining if wrapping can occur
    // before the subsequent box.
    //
    // While CSS3 gives little direction to the user agent as to what should occur
    // in this case, this is guidance given by CSS2, which states that "any
    // sequence of spaces (U+0020) unbroken by an element boundary is treated as a
    // sequence of non-breaking spaces." Furthermore, this matches the behavior of
    // WebKit, Firefox, and IE.
    // https://www.w3.org/TR/css-text-3/#white-space-phase-1
    // https://www.w3.org/TR/CSS2/text.html#white-space-model
    if (should_prevent_text_wrapping &&
      original_text[original_text.length - 1] == ' ') {
      NOTREACHED();
      this.paragraph_store_.value!.object.AppendCodePoint(CodePoint.kNoBreakSpaceCodePoint);
    }
  }

  boxes(): Boxes {
    return this.boxes_;
  }

  private VisitFreehandElement(freehandElement: FreehandElement) {
    let text_position = this.paragraph_store_.value!.object.AppendCodePoint(CodePoint.kObjectReplacementCharacterCodePoint);

    let replaced_box_mode: ReplacedBoxMode = ReplacedBoxMode.kFreehand;

    let size = new Size(1, 1);
    let replaced_box_generator = new ReplacedBoxGenerator<Path>(
      freehandElement.computed_style_declaration(),
      freehandElement.GetPath(),
      this.paragraph_store_.value!,
      text_position,
      new LayoutUnit(size.width()),
      new LayoutUnit(size.height()),
      size.width() / size.height(),
      this.context_,
      replaced_box_mode,
      size,
    );

    freehandElement.computed_style().display.Accept(replaced_box_generator);

    let replaced_box = replaced_box_generator.replaced_box();
    if (!replaced_box) {
      NOTREACHED();
    }

    this.boxes_.push(replaced_box);
  }

  private VisitImageElement(img_element: HTMLImageElement) {
    // For video elements, create a replaced box.

    // A replaced box is formatted as an atomic inline element. It is treated
    // directionally as a neutral character and its line breaking behavior is
    // equivalent to that of the Object Replacement Character.
    //   https://www.w3.org/TR/CSS21/visuren.html#inline-boxes
    //   https://www.w3.org/TR/CSS21/visuren.html#propdef-unicode-bidi
    //   https://www.w3.org/TR/css3-text/#line-break-details
    let text_position = this.paragraph_store_.value!.object.AppendCodePoint(CodePoint.kObjectReplacementCharacterCodePoint);

    let replaced_box_mode: ReplacedBoxMode = ReplacedBoxMode.kImage;

    let img = img_element.GetResource();
    let size: Size;
    if (!img) {
      size = new Size(100, 100);
    } else {
      size = img.GetSize();
    }
    let replaced_box_generator = new ReplacedBoxGenerator<Image>(
      img_element.computed_style_declaration(),
      img,
      this.paragraph_store_.value!,
      text_position,
      new LayoutUnit(size.width()),
      new LayoutUnit(size.height()),
      size.width() / size.height(),
      this.context_,
      replaced_box_mode,
      size,
    );
    img_element.computed_style().display.Accept(replaced_box_generator);

    let replaced_box = replaced_box_generator.replaced_box();
    if (!replaced_box) {
      // The element with "display: none" generates no boxes and has no effect
      // on layout. Descendant elements do not generate any boxes either.
      // This behavior cannot be overridden by setting the "display" property on
      // the descendants.
      //   https://www.w3.org/TR/CSS21/visuren.html#display-prop
      return;
    }

    this.boxes_.push(replaced_box);

    // The content of replaced elements is not considered in the CSS rendering
    // model.
    //   https://www.w3.org/TR/CSS21/conform.html#replaced-element
  }
  private VisitBrElement(br_element: HTMLBRElement) {
    // If the br element has "display: none", then it has no effect on the layout.
    if (br_element.computed_style()!.display == KeywordValue.GetNone()) {
      return;
    }

    let css_computed_style_declaration = new ComputedStyleDeclaration();
    css_computed_style_declaration.SetData(GetComputedStyleOfAnonymousBox(br_element.computed_style_declaration()));

    //  css_computed_style_declaration.set_animations(br_element.animations());

    DCHECK(this.paragraph_store_.value?.object);
    let text_position = this.paragraph_store_.value.object.GetTextEndPosition();

    let kTriggersLineBreakTrue = true;
    let kIsProductOfSplitFalse = false;

    let br_text_box = new TextBox(
      css_computed_style_declaration,
      this.paragraph_store_.value.copy(),
      text_position,
      text_position,
      kTriggersLineBreakTrue,
      kIsProductOfSplitFalse,
      this.context_.used_style_provider,
      this.context_,
      /*this.context_.layout_stat_tracker*/);

    // Add a line feed code point to the paragraph to signify the new line for
    // the line breaking and bidirectional algorithms.
    this.paragraph_store_.value.object.AppendCodePoint(CodePoint.kLineFeedCodePoint);

    // #ifdef COBALT_BOX_DUMP_ENABLED
    br_text_box.SetGeneratingNode(br_element);
    // #endif  // COBALT_BOX_DUMP_ENABLED

//  br_text_box.SetUiNavItem(br_element.GetUiNavItem());
    this.boxes_.push(br_text_box);
  }
//  void VisitLottiePlayer(dom::LottiePlayer* lottie_player);
  private VisitNonReplacedElement(html_element: HTMLElement) {
    let element_style = html_element.computed_style_declaration();

    let container_box_generator = new ContainerBoxGenerator(
      html_element.GetUsedDirState(),
      html_element == this.context_.ignore_background_element ? StripBackground(element_style) : element_style,
      this.context_,
      this.paragraph_store_,
    );
    html_element.computed_style()!.display.Accept(container_box_generator);
    let container_box_before_split = container_box_generator.container_box();
    if (!container_box_before_split) {
      // The element with "display: none" generates no boxes and has no effect
      // on layout. Descendant elements do not generate any boxes either.
      // This behavior cannot be overridden by setting the "display" property on
      // the descendants.
      //   https://www.w3.org/TR/CSS21/visuren.html#display-prop
      return;
    }

    container_box_before_split.SetGeneratingNode(html_element);

//  container_box_before_split.SetUiNavItem(html_element.GetUiNavItem());
    this.boxes_.push(container_box_before_split);

    // We already handle the case where the Intersection Observer root is the
    // viewport with the initial containing block in layout.
//  if (html_element !=
//      html_element.node_document().document_element().AsHTMLElement()) {
//    BoxIntersectionObserverModule::IntersectionObserverRootVector roots =
//        html_element.GetLayoutIntersectionObserverRoots();
//    BoxIntersectionObserverModule::IntersectionObserverTargetVector targets =
//        html_element.GetLayoutIntersectionObserverTargets();
//    container_box_before_split.AddIntersectionObserverRootsAndTargets(
//        std::move(roots), std::move(targets));
//  }

    // this.AppendPseudoElementToLine(html_element, PseudoElementType.kBeforePseudoElementType);

    // Generate child boxes.
    for (let child_node = html_element.firstChild; child_node; child_node = child_node.next_sibling()) {
      let child_box_generator = new BoxGenerator(
        html_element.computed_style_declaration()/*,
        html_element.css_computed_style_declaration().animations()*/,
        this.paragraph_store_,
        this.dom_element_depth_ + 1,
        this.context_);
      child_node.Accept(child_box_generator);
      let child_boxes = child_box_generator.boxes();
      for (let box of child_boxes) {
        this.AppendChildBoxToLine(box);
      }
    }

    // this.AppendPseudoElementToLine(html_element, PseudoElementType.kAfterPseudoElementType);
    container_box_generator.dispose();
  }

  private AppendChildBoxToLine(child_box: Box) {
// When an inline box contains an in-flow block-level box, the inline box
    // (and its inline ancestors within the same block container box*) are
    // broken around the block-level box, splitting the inline box into two
    // boxes (even if either side is empty), one on each side of
    // the block-level box. The line boxes before the break and after
    // the break are enclosed in anonymous block boxes, and the block-level
    // box becomes a sibling of those anonymous boxes.
    //   https://www.w3.org/TR/CSS21/visuren.html#anonymous-block-level
    //
    // * CSS 2.1 says "the same line box" but line boxes are not real boxes
    //   in Cobalt, see |LineBox| for details.
    let last_container_box = this.boxes_[this.boxes_.length - 1] as ContainerBox;

    if (!last_container_box.TryAddChild(child_box)) {
      let next_container_box =
        last_container_box.TrySplitAtEnd()!;
      DCHECK(next_container_box);

      // Attempt to add the box to the next container before adding it to the top
      // level. In the case where a line break was blocking the add in the last
      // container, the child should successfully go into the next container.
      if (!next_container_box.TryAddChild(child_box)) {
        this.boxes_.push(child_box);
      }

      this.boxes_.push(next_container_box);
    }
  }
  private AppendPseudoElementToLine(html_element: HTMLElement, pseudo_element_type: PseudoElementType) {
    NOTIMPLEMENTED();
  }
  VisitComment(c: Comment): void {
    // noop
  }
};

function StripBackground(style: ComputedStyleDeclaration): ComputedStyleDeclaration {
  let new_style = new ComputedStyleDeclaration();
//  new_style.set_animations(style.animations());

  let new_data = new MutableComputedStyleData();
  new_data.AssignFrom(style.data()!);
  new_data.SetPropertyValue(PropertyKey.kBackgroundColorProperty);
  new_data.SetPropertyValue(PropertyKey.kBackgroundImageProperty);
  new_style.SetData(new_data);

  return new_style;
}

enum CloseParagraph {
  kDoNotCloseParagraph,
  kCloseParagraph,
};

let counter = 1;

class ContainerBoxGenerator extends NotReachedPropertyValueVisitor {
  private id_: number;
  private element_dir_: DirState;
  private css_computed_style_declaration_: ComputedStyleDeclaration;
  private context_: Context;

  // If a directional isolate was added to the paragraph by this container box
  // and needs to be popped in the destructor:
  // http://unicode.org/reports/tr9/#Explicit_Directional_Isolates
  private has_scoped_directional_isolate_: boolean;

  private prior_paragraph_?: ICopyableReference<Paragraph>;
  private paragraph_scoped_: boolean;

  private container_box_?: ContainerBox;

  constructor(
    element_dir: DirState,
    css_computed_style_declaration: ComputedStyleDeclaration,
    context: Context,
    private paragraph_store_: ParagraphRefStore
  ) {
    super();
    this.id_ = counter++;
    this.element_dir_ = element_dir;
    this.css_computed_style_declaration_ = css_computed_style_declaration;
    this.context_ = context;
    this.has_scoped_directional_isolate_ = false;
    this.paragraph_scoped_ = false;
  }

  dispose() {
    // If there's a scoped directional isolate, then it needs to popped from
    // the paragraph so that this box does not impact the directionality of later
    // boxes in the paragraph.
    // http://unicode.org/reports/tr9/#Terminating_Explicit_Directional_Isolates
    if (this.has_scoped_directional_isolate_) {
      this.paragraph_store_.value!.object.AppendCodePoint(CodePoint.kPopDirectionalIsolateCodePoint);
    }

    if (this.paragraph_scoped_) {
      if (!this.paragraph_store_.value!.object.IsClosed()) {
        this.paragraph_store_.value!.object.Close();
      }

      // If the prior paragraph was closed, then replace it with a new paragraph
      // that has the same direction as the previous one. Otherwise, restore the
      // prior one.
      DCHECK(this.prior_paragraph_);
      if (this.prior_paragraph_.object.IsClosed()) {
        this.paragraph_store_.value = this.context_.paragraph_collection.acquire(
          Paragraph.ID.toString(),
          this.prior_paragraph_.object.GetLocale(),
          this.prior_paragraph_.object.base_direction(),
          this.prior_paragraph_.object.GetDirectionalFormattingStack(),
          this.context_.line_break_iterator,
          this.context_.character_break_iterator
        );
      } else {
        this.paragraph_store_.value = this.prior_paragraph_.copy();
      }
    }
    this.prior_paragraph_?.dispose();
  }

  VisitKeyword(keyword: KeywordValue) {
// See https://www.w3.org/TR/CSS21/visuren.html#display-prop.
    switch (keyword.value()) {
      // Generate a block-level block container box.
      case Value.kBlock:
        // The block ends the current paragraph and begins a new one that ends
        // with the block, so close the current paragraph, and create a new
        // paragraph that will close when the container box generator is
        // destroyed.
        this.CreateScopedParagraph(CloseParagraph.kCloseParagraph);

        this.container_box_ = new BlockLevelBlockContainerBox(
          this.css_computed_style_declaration_, this.paragraph_store_.value!.object.base_direction(),
          this.context_.used_style_provider,/*  this.context_.layout_stat_tracker*/);
        break;
      case Value.kFlex:
        NOTIMPLEMENTED();
        // this.container_box_ =  new BlockLevelFlexContainerBox(
        //   this.css_computed_style_declaration_,  this.paragraph_.base_direction(),
        //   this.context_.used_style_provider/*,  this.context_.layout_stat_tracker*/);
        break;
      case Value.kInlineFlex: {
        NOTIMPLEMENTED();
        //   // An inline flex container is an atomic inline and therefore is treated
        //   // directionally as a neutral character and its line breaking behavior is
        //   // equivalent to that of the Object Replacement Character.
        //   //   https://www.w3.org/TR/css-display-3/#atomic-inline
        //   //   https://www.w3.org/TR/CSS21/visuren.html#propdef-unicode-bidi
        //   //   https://www.w3.org/TR/css3-text/#line-break-details
        //  let  text_position =
        //     this.paragraph
        // .AppendCodePoint(
        //     CodePoint.  kObjectReplacementCharacterCodePoint);
        //   let  prior_paragraph = this.paragraph;
        //
        //   // The inline flex container creates a new paragraph, which the old
        //   // paragraph flows around. Create a new paragraph, which will close with
        //   // the end of the flex container. However, do not close the old
        //   // paragraph, because it will continue once the scope of the inline block
        //   // ends.
        //   // CreateScopedParagraph(kDoNotCloseParagraph);
        //
        //   this.container_box_ =  new InlineLevelFlexContainerBox(
        //     this.css_computed_style_declaration_,  this.paragraph_.base_direction(),
        //     prior_paragraph, text_position,  this.context_.used_style_provider,
        //     // this.context_.layout_stat_tracker
        //   );
      }
        break;
      // Generate one or more inline boxes. Note that more inline boxes may be
      // generated when the original inline box is split due to participation
      // in the formatting context.
      case Value.kInline:
        // If the creating HTMLElement had an explicit directionality, then append
        // a directional isolate to the paragraph. This will be popped from the
        // paragraph, when the ContainerBoxGenerator goes out of scope.
        // https://dev.w3.org/html5/spec-preview/global-attributes.html#the-directionality
        // http://unicode.org/reports/tr9/#Explicit_Directional_Isolates
        // http://unicode.org/reports/tr9/#Markup_And_Formatting
        if (this.element_dir_ == DirState.kDirLeftToRight) {
          this.has_scoped_directional_isolate_ = true;
          this.paragraph_store_.value!.object.AppendCodePoint(CodePoint.kLeftToRightIsolateCodePoint);
        } else if (this.element_dir_ == DirState.kDirRightToLeft) {
          this.has_scoped_directional_isolate_ = true;
          this.paragraph_store_.value!.object.AppendCodePoint(CodePoint.kRightToLeftIsolateCodePoint);
        }

        // If the paragraph has not started yet, then add a no-break space to it,
        // thereby starting the paragraph without providing a wrappable location,
        // as the line should never wrap at the start of text.
        // http://unicode.org/reports/tr14/#BreakingRules
        //
        // Starting the paragraph ensures that subsequent text nodes create text
        // boxes, even when they consist of only collapsible white-space. This is
        // necessary because empty inline container boxes can justify a line's
        // existence if they have a non-zero margin, border or padding, which
        // means that the collapsible white-space is potentially wrappable
        // regardless of whether any intervening text is added to the paragraph.
        // Not creating the collapsible text box in this case would incorrectly
        // eliminate a wrappable location from the line.
        if (this.paragraph_store_.value!.object.GetTextEndPosition() == 0) {
          this.paragraph_store_.value!.object.AppendCodePoint(CodePoint.kNoBreakSpaceCodePoint);
        }

        this.container_box_ = new InlineContainerBox(
          this.css_computed_style_declaration_,
          this.context_.used_style_provider,
          // this.context_.layout_stat_tracker,
          this.paragraph_store_.value!.object.base_direction()
        );
        break;
      // Generate an inline-level block container box. The inside of
      // an inline-block is formatted as a block box, and the element itself
      // is formatted as an atomic inline-level box.
      //   https://www.w3.org/TR/CSS21/visuren.html#inline-boxes
      case Value.kInlineBlock: {
        NOTIMPLEMENTED();
        // // An inline block is an atomic inline and therefore is treated
        // // directionally as a neutral character and its line breaking behavior is
        // // equivalent to that of the Object Replacement Character.
        // //   https://www.w3.org/TR/css-display-3/#atomic-inline
        // //   https://www.w3.org/TR/CSS21/visuren.html#propdef-unicode-bidi
        // //   https://www.w3.org/TR/css3-text/#line-break-details
        // let text_position =
        //   this.paragraph
        //     .AppendCodePoint(
        //       CodePoint.kObjectReplacementCharacterCodePoint);
        // let prior_paragraph = this.paragraph;
        //
        // // The inline block creates a new paragraph, which the old paragraph
        // // flows around. Create a new paragraph, which will close with the end
        // // of the inline block. However, do not close the old paragraph, because
        // // it will continue once the scope of the inline block ends.
        // CreateScopedParagraph(CloseParagraph. kDoNotCloseParagraph);
        //
        // container_box_ = new InlineLevelBlockContainerBox(
        //   this.css_computed_style_declaration_, this.paragraph_.base_direction(),
        //   prior_paragraph, text_position,
        //   this.context_.used_style_provider,
        //   // this.context_.layout_stat_tracker
        // );
      }
        break;
      // The element generates no boxes and has no effect on layout.
      case Value.kNone:
        // Leave |container_box_| NULL.
        break;
      case Value.kAbsolute:
      case Value.kAlternate:
      case Value.kAlternateReverse:
      case Value.kAuto:
      case Value.kBackwards:
      case Value.kBaseline:
      case Value.kBoth:
      case Value.kBottom:
      case Value.kBreakWord:
      case Value.kCenter:
      case Value.kClip:
      case Value.kCollapse:
      case Value.kColumn:
      case Value.kColumnReverse:
      case Value.kContain:
      case Value.kContent:
      case Value.kCover:
      case Value.kCurrentColor:
      case Value.kCursive:
      case Value.kEllipsis:
      case Value.kEnd:
      case Value.kEquirectangular:
      case Value.kFantasy:
      case Value.kFixed:
      case Value.kFlexEnd:
      case Value.kFlexStart:
      case Value.kForwards:
      case Value.kHidden:
      case Value.kInfinite:
      case Value.kInherit:
      case Value.kInitial:
      case Value.kLeft:
      case Value.kLineThrough:
      case Value.kMiddle:
      case Value.kMonoscopic:
      case Value.kMonospace:
      case Value.kNoRepeat:
      case Value.kNormal:
      case Value.kNowrap:
      case Value.kPre:
      case Value.kPreLine:
      case Value.kPreWrap:
      case Value.kRelative:
      case Value.kRepeat:
      case Value.kReverse:
      case Value.kRight:
      case Value.kRow:
      case Value.kRowReverse:
      case Value.kSansSerif:
      case Value.kScroll:
      case Value.kSerif:
      case Value.kSolid:
      case Value.kSpaceAround:
      case Value.kSpaceBetween:
      case Value.kStart:
      case Value.kStatic:
      case Value.kStereoscopicLeftRight:
      case Value.kStereoscopicTopBottom:
      case Value.kStretch:
      case Value.kTop:
      case Value.kUppercase:
      case Value.kVisible:
      case Value.kWrap:
      case Value.kWrapReverse:
        NOTREACHED();
        break;
      default:
        NOTREACHED();
    }
  }

  container_box() {
    return this.container_box_;
  }

  private CreateScopedParagraph(close_prior_paragraph: CloseParagraph) {
    DCHECK(!this.paragraph_scoped_);

    this.paragraph_scoped_ = true;
    this.prior_paragraph_ = this.paragraph_store_.value;

    // Determine the base direction of the new paragraph based upon the
    // directionality of the creating HTMLElement. If there was no explicit
    // directionality, then it is based upon the prior paragraph, meaning that
    // it is inherited from the parent element.
    // https://dev.w3.org/html5/spec-preview/global-attributes.html#the-directionality
    let base_direction: BaseDirection;
    if (this.element_dir_ == DirState.kDirLeftToRight) {
      base_direction = BaseDirection.kLeftToRightBaseDirection;
    } else if (this.element_dir_ == DirState.kDirRightToLeft) {
      base_direction = BaseDirection.kRightToLeftBaseDirection;
    } else {
      base_direction = this.prior_paragraph_!.object.GetDirectionalFormattingStackDirection();
    }

    if (close_prior_paragraph == CloseParagraph.kCloseParagraph) {
      this.prior_paragraph_!.object.Close();
    }

    this.paragraph_store_.value = (this.context_.paragraph_collection.acquire(
      Paragraph.ID.toString(),
      this.prior_paragraph_!.object.GetLocale(),
      base_direction,
      [],
      this.context_.line_break_iterator,
      this.context_.character_break_iterator
    ));
  }
}

class ReplacedBoxGenerator<T> extends NotReachedPropertyValueVisitor {
  constructor(
    css_computed_style_declaration: ComputedStyleDeclaration,
    content: T,
    paragraph_ref: ICopyableReference<Paragraph>,
    text_position: number,
    maybe_intrinsic_width: Optional<LayoutUnit>,
    maybe_intrinsic_height: Optional<LayoutUnit>,
    maybe_intrinsic_ratio: Optional<number>,
    context: Context,
    replaced_box_mode: Optional<ReplacedBoxMode>,
    content_size: SizeF,
  ) {
    super();
    this.css_computed_style_declaration_ = css_computed_style_declaration;
    this.content_ = content;
    // this.set_bounds_cb_ = set_bounds_cb;
    this.paragraph_ref_ = paragraph_ref;
    this.text_position_ = text_position;
    this.maybe_intrinsic_width_ = maybe_intrinsic_width;
    this.maybe_intrinsic_height_ = maybe_intrinsic_height;
    this.maybe_intrinsic_ratio_ = maybe_intrinsic_ratio;
    this.context_ = context;
    this.replaced_box_mode_ = replaced_box_mode;
    this.content_size_ = content_size;
    // this.lottie_properties_(lottie_properties
  }

  VisitKeyword(keyword: KeywordValue) {
    // See https://www.w3.org/TR/CSS21/visuren.html#display-prop.
    switch (keyword.value()) {
      // Generate a block-level replaced box.
      case Value.kBlock:
      case Value.kFlex:
        this.replaced_box_ = (new BlockLevelReplacedBox(
          this.css_computed_style_declaration_,
          this.content_,
          this.paragraph_ref_.copy(),
          this.text_position_,
          this.maybe_intrinsic_width_,
          this.maybe_intrinsic_height_,
          this.maybe_intrinsic_ratio_,
          this.context_.used_style_provider,
          this.replaced_box_mode_,
          this.content_size_,
          // lottie_properties_, context_.layout_stat_tracker
        ));
        break;
      // Generate an inline-level replaced box. There is no need to distinguish
      // between inline replaced elements and inline-block replaced elements
      // because their widths, heights, and margins are calculated in the same
      // way.
      case Value.kInline:
      case Value.kInlineBlock:
      case Value.kInlineFlex:
        this.replaced_box_ = (new InlineLevelReplacedBox(
          this.css_computed_style_declaration_,
          this.content_,
          this.paragraph_ref_.copy(),
          this.text_position_,
          this.maybe_intrinsic_width_,
          this.maybe_intrinsic_height_,
          this.maybe_intrinsic_ratio_,
          this.context_.used_style_provider,
          this.replaced_box_mode_,
          this.content_size_,
          // lottie_properties_, context_.layout_stat_tracker
        ));
        break;
      // The element generates no boxes and has no effect on layout.
      case Value.kNone:
        // Leave |replaced_box_| NULL.
        break;
      default:
        NOTREACHED();
        break;
    }
  }

  replaced_box(): ReplacedBox<T> {
    return this.replaced_box_!;
  }

  private css_computed_style_declaration_: ComputedStyleDeclaration;
  private content_: T;
  private paragraph_ref_: ICopyableReference<Paragraph>;
  private text_position_: number;
  private maybe_intrinsic_width_: Optional<LayoutUnit>;
  private maybe_intrinsic_height_: Optional<LayoutUnit>;
  private maybe_intrinsic_ratio_: Optional<number>;
  private context_: Context;
  private replaced_box_mode_: Optional<ReplacedBoxMode>;
  private content_size_: SizeF;
  // base::Optional<render_tree::LottieAnimation::LottieProperties>
  // lottie_properties_;

  private replaced_box_?: ReplacedBox<T>;
};
