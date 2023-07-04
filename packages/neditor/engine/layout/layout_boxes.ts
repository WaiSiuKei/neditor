// All classes implementing this interface have a unique Type value.
import { RectF } from '../math/rect_f';
import { Box, Boxes } from './box';
import { DCHECK } from '@neditor/core/base/check';
import { KeywordValue } from '../cssom/keyword_value';

enum Type {
  kLayoutLayoutBoxes,
};

export class LayoutBoxes {
// Returns the bounding rectangle of the border edges of the boxes.
//   private GetBoundingBorderRectangle(): RectF {}

  // private GetClientRectBoxes(boxes: Boxes, client_rect_boxes: Boxes) {
  //
  // }

  private boxes_: Boxes;

  constructor(boxes: Boxes) {
    this.boxes_ = boxes;
  }

  type(): Type {
    return Type.kLayoutLayoutBoxes;
  }
// // Algorithm for GetClientRects:
// //   https://www.w3.org/TR/2013/WD-cssom-view-20131217/#dom-element-getclientrects
//   GetClientRects() : DOMRectList {
//     // 1. If the element on which it was invoked does not have an associated
//     // layout box return an empty DOMRectList object and stop this algorithm.
//
//     // 2. If the element has an associated SVG layout box return a DOMRectList
//     // object containing a single DOMRect object that describes the bounding box
//     // of the element as defined by the SVG specification, applying the transforms
//     // that apply to the element and its ancestors.
//
//     // 3. Return a DOMRectList object containing a list of DOMRect objects in
//     // content order describing the bounding border boxes (including those with a
//     // height or width of zero) with the following constraints:
//     //  . Apply the transforms that apply to the element and its ancestors.
//     //  . If the element on which the method was invoked has a computed value for
//     //    the 'display' property of 'table' or 'inline-table' include both the
//     //    table box and the caption box, if any, but not the anonymous container
//     //    box.
//     //  . Replace each anonymous block box with its child box(es) and repeat this
//     //    until no anonymous block boxes are left in the final list.
//
//     Boxes client_rect_boxes;
//     GetClientRectBoxes(boxes_, &client_rect_boxes);
//
//     scoped_refptr<dom::DOMRectList> dom_rect_list(new dom::DOMRectList());
//     for (Boxes::const_iterator box_iterator = client_rect_boxes.begin();
//     box_iterator != client_rect_boxes.end(); ++box_iterator) {
//       RectLayoutUnit transformed_border_box(
//         (*box_iterator)
//     ->GetTransformedBoxFromRootWithScroll(
//         (*box_iterator)->GetBorderBoxFromMarginBox()));
//       dom_rect_list->AppendDOMRect(
//         new dom::DOMRect(transformed_border_box.x().toFloat(),
//           transformed_border_box.y().toFloat(),
//           transformed_border_box.width().toFloat(),
//           transformed_border_box.height().toFloat()));
//     }
//
//     return dom_rect_list;
//   }
  IsInline() {
    DCHECK(this.boxes_.length);
    return this.boxes_[0].computed_style()!.display == KeywordValue.GetInline();
  }

// float GetBorderEdgeLeft() const override;
// float GetBorderEdgeTop() const override;
// float GetBorderEdgeWidth() const override;
// float GetBorderEdgeHeight() const override;

// float GetBorderLeftWidth() const override;
// float GetBorderTopWidth() const override;

// float GetMarginEdgeWidth() const override;
// float GetMarginEdgeHeight() const override;

// math::Vector2dF GetPaddingEdgeOffset() const override;
// float GetPaddingEdgeWidth() const override;
// float GetPaddingEdgeHeight() const override;

//  math::RectF GetScrollArea(dom::Directionality dir) const override;

  InvalidateSizes() {
    for (let box of this.boxes_) {
      do {
        box.InvalidateUpdateSizeInputsOfBoxAndAncestors();
        let ret = box.GetSplitSibling();
        if (!ret) break;
        box = ret;
      } while (box);
    }
  }
  InvalidateCrossReferences() {
    for (let box of this.boxes_) {
      do {
        box.InvalidateCrossReferencesOfBoxAndAncestors();
        let ret = box.GetSplitSibling();
        if (!ret) break;
        box = ret;
      } while (box);
    }
//  scroll_area_cache_.reset();
  }
  InvalidateRenderTreeNodes() {}
//  void SetUiNavItem(const scoped_refptr<ui_navigation::NavItem>& item) override;

// Other

  boxes() { return this.boxes_; }
}
