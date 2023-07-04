// Note: while ContainerNode itself isn't web-exposed, a number of methods it
import { DCHECK } from '../../base/check';
import { DCHECK_EQ } from '../../base/check_op';
import { Optional } from '../../base/common/typescript';
import { SubtreeModificationAction } from './container_action';
// implements (such as firstChild, lastChild) use web-style naming to shadow
// the corresponding methods on Node. This is a performance optimization, as it
// avoids a virtual dispatch if the type is statically known to be
// ContainerNode.
import { Node } from './node';

export abstract class ContainerNode extends Node {
  ChildrenChangedAllChildrenRemovedNeedsList() {
    return false;
  }
  // https://source.chromium.org/chromium/chromium/src/+/refs/tags/116.0.5808.2:third_party/blink/renderer/core/dom/container_node.cc;l=840
  // This differs from other remove functions because it forcibly removes all the
  // children, regardless of read-only status or event exceptions, e.g.
  RemoveChildren(action: SubtreeModificationAction) {
    if (!this.first_child_)
      return;

    // Do any prep work needed before actually starting to detach
    // and remove... e.g. stop loading frames, fire unload events.
    this.WillRemoveChildren();

    // {
    //   // Removing focus can cause frames to load, either via events (focusout,
    //   // blur) or widget updates (e.g., for <embed>).
    //   SubframeLoadingDisabler disabler(*this);
    //
    //   // Exclude this node when looking for removed focusedElement since only
    //   // children will be removed.
    //   // This must be later than willRemoveChildren, which might change focus
    //   // state of a child.
    //   GetDocument().RemoveFocusedElementOfSubtree(*this, true);
    //
    //   // Removing a node from a selection can cause widget updates.
    //   GetDocument().NodeChildrenWillBeRemoved(*this);
    // }

    // HeapVector<Member<Node>> removed_nodes;
    const children_changed = this.ChildrenChangedAllChildrenRemovedNeedsList();
    {
      //     HTMLFrameOwnerElement::PluginDisposeSuspendScope suspend_plugin_dispose;
      //     TreeOrderedMap::RemoveScope tree_remove_scope;
      //     StyleEngine& engine = GetDocument().GetStyleEngine();
      //     StyleEngine::DetachLayoutTreeScope detach_scope(engine);
      //     bool has_element_child = false;
      {
        //       SlotAssignmentRecalcForbiddenScope forbid_slot_recalc(GetDocument());
        //       StyleEngine::DOMRemovalScope style_scope(engine);
        //       EventDispatchForbiddenScope assert_no_event_dispatch;
        //       ScriptForbiddenScope forbid_script;

        let child: Node;
        while (child = this.first_child_) {
          // if (child->IsElementNode()) {
          //   has_element_child = true;
          // }
          this.RemoveBetween(undefined, child.nextSibling, child);
          // this.NotifyNodeRemoved(child);
          // if (children_changed)
          //   removed_nodes.push_back(child);
        }
      }

      //     ChildrenChange change = {
      //     .type = ChildrenChangeType::kAllChildrenRemoved,
      //     .by_parser = ChildrenChangeSource::kAPI,
      //     .affects_elements = has_element_child
      //       ? ChildrenChangeAffectsElements::kYes
      //       : ChildrenChangeAffectsElements::kNo,
      //     .removed_nodes = std::move(removed_nodes)};
      //     ChildrenChanged(change);
      //   }
      //
      if (action == SubtreeModificationAction.kDispatchSubtreeModifiedEvent) {
        this.DispatchSubtreeModifiedEvent();
      }
    }
  }

  RemoveBetween(previous_child: Optional<Node>,
                next_child: Optional<Node>,
                old_child: Node) {
    // EventDispatchForbiddenScope assert_no_event_dispatch;

    DCHECK_EQ(old_child.parentNode!, this);

    // if (InActiveDocument()) {
    //   old_child.DetachLayoutTree();
    // }

    if (next_child) {
      next_child.SetPreviousSibling(previous_child);
    }
    if (previous_child) {
      previous_child.SetNextSibling(next_child);
    }
    if (this.first_child_ == old_child) {
      this.SetFirstChild(next_child);
    }
    if (this.last_child_ == old_child) {
      this.SetLastChild(previous_child);
    }

    old_child.SetPreviousSibling(undefined);
    old_child.SetNextSibling(undefined);
    old_child.SetParentNode(undefined);

    // this.GetDocument()!.AdoptIfNeeded(old_child);
  }

  GetChildNodes() {
    let nodes: Node[] = [];
    for (let child = this.firstChild; child; child = child.nextSibling)
      nodes.push(child);
    return nodes;
  }
  WillRemoveChildren() {
    // NodeVector children;
    let children = this.GetChildNodes();

    // ChildListMutationScope mutation(*this);
    for (let child of children) {
      DCHECK(child);
      // mutation.WillRemoveChild(child);
      // child.NotifyMutationObserversNodeWillDetach();
      this.DispatchChildRemovalEvents(child);
    }

    // ChildFrameDisconnector(*this).Disconnect(
    //   ChildFrameDisconnector::kDescendantsOnly);
  }
  DispatchChildRemovalEvents(child: Node) {
    // if (child.IsInShadowTree()) {
    //   probe::WillRemoveDOMNode(&child);
    //   return;
    // }

    // probe::WillRemoveDOMNode(&child);

    // Node* c = &child;
    // Document& document = child.GetDocument();

    // Dispatch pre-removal mutation events.
    // if (c->parentNode() &&
    //   document.HasListenerType(Document::kDOMNodeRemovedListener)) {
    //   NodeChildRemovalTracker scope(child);
    //   c->DispatchScopedEvent(
    //     *MutationEvent::Create(event_type_names::kDOMNodeRemoved,
    //       Event::Bubbles::kYes, c->parentNode()));
    // }

    // Dispatch the DOMNodeRemovedFromDocument event to all descendants.
    // if (c->isConnected() &&
    //   document.HasListenerType(Document::kDOMNodeRemovedFromDocumentListener)) {
    //   NodeChildRemovalTracker scope(child);
    //   for (; c; c = NodeTraversal::Next(*c, &child)) {
    //     c->DispatchScopedEvent(*MutationEvent::Create(
    //       event_type_names::kDOMNodeRemovedFromDocument, Event::Bubbles::kNo));
    //   }
    // }
  }
  NotifyNodeRemoved(root: Node) {
    // ScriptForbiddenScope forbid_script;
    // EventDispatchForbiddenScope assert_no_event_dispatch;
    //
    // for (Node& node : NodeTraversal::InclusiveDescendantsOf(root)) {
    //   // As an optimization we skip notifying Text nodes and other leaf nodes
    //   // of removal when they're not in the Document tree and not in a shadow root
    //   // since the virtual call to removedFrom is not needed.
    //   if (!node.IsContainerNode() && !node.IsInTreeScope())
    //     continue;
    //   node.RemovedFrom(*this);
    //   if (ShadowRoot* shadow_root = node.GetShadowRoot())
    //     NotifyNodeRemoved(*shadow_root);
    // }
  }

  AsContainerNode() {
    return this;
  }

  SetFirstChild(child: Optional<Node>) {
    this.first_child_ = child;
  }
  SetLastChild(child: Optional<Node>) {
    this.last_child_ = child;
  }
}
