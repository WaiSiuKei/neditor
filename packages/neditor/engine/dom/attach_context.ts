import { keys } from '@neditor/core/base/common/objects';

export class AttachContext {
  // Keep track of previously attached in-flow box during attachment so that
  // we don't need to backtrack past display:none/contents and out of flow
  // objects when we need to do whitespace re-attachment.
  // previous_in_flow: Ptr<LayoutObject>;
  // The parent LayoutObject to use when inserting a new child into the layout
  // tree in LayoutTreeBuilder::CreateLayoutObject.
  // parent: Ptr<LayoutObject>;
  // LayoutObject to be used as the next pointer when inserting a LayoutObject
  // into the tree.
  // next_sibling: Ptr<LayoutObject>;
  // Set to true if the AttachLayoutTree is done as part of the
  // RebuildLayoutTree pass.
  performing_reattach = false;
  // True if the previous_in_flow member is up-to-date, even if it is nullptr.
  use_previous_in_flow = false;
  // True if the next_sibling member is up-to-date, even if it is nullptr.
  next_sibling_valid = false;
  // True if we need to force legacy layout objects for the entire subtree.
  force_legacy_layout = false;
  constructor(other?: AttachContext) {
    if (other) {
      keys(other).forEach((k) => {
        Reflect.set(this, k, other[k]);
      });
    }
  }
}
