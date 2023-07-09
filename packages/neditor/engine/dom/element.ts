import { DCHECK } from '../../base/check';
import { ConstructionType, LegacyLayout, Node, NodeType, NodeVisitor } from './node';
import type { Document } from './document';
import { TRACE_EVENT1, TRACE_EVENT2 } from '@neditor/core/base/trace_event/common/trace_event_common';
import { Serializer } from './serializer';
import type { HTMLElement } from './html_element';
import { deepClone } from '@neditor/core/base/common/objects';
import { NOTIMPLEMENTED } from '@neditor/core/base/common/notreached';
import { Nullable, Optional, Ptr } from '@neditor/core/base/common/typescript';
import { isNil, isString } from '@neditor/core/base/common/type';
import { ContainerNode } from './container_node';

export const kStyleAttributeName = 'style';

export enum ElementFlags {
  kTabIndexWasSetExplicitly = 1 << 0,
  kStyleAffectedByEmpty = 1 << 1,
  kIsInCanvasSubtree = 1 << 2,
  kContainsFullScreenElement = 1 << 3,
  kIsInTopLayer = 1 << 4,
  kContainsPersistentVideo = 1 << 5,

  kNumberOfElementFlags = 6,  // Size of bitfield used to store the flags.
}

enum NumberFlag {
  kConnectedFrameCountBits = 10,  // Must fit Page::maxNumberOfFrames.
  kNumberOfElementFlags = 6,
  kNumberOfDynamicRestyleFlags = 14
}

export abstract class Element extends ContainerNode {
  protected local_name_: string;
  protected attribute_map_: Map<string, string> = new Map<string, string>();
  private element_flags_ = NumberFlag.kNumberOfElementFlags;

  constructor(type: ConstructionType, local_name: string)
  constructor(type: ConstructionType, document: Document, local_name: string)
  constructor(type: ConstructionType, a1: Document | string, local_name?: string) {
    if (isString(a1)) {
      super(type || ConstructionType.kCreateElement);
      this.local_name_ = a1;
    } else {
      super(type || ConstructionType.kCreateElement, a1);
      this.local_name_ = local_name!;
    }
  }

  Accept(visitor: NodeVisitor): void {
    visitor.VisitElement(this);
  }
  getNodeType(): NodeType {return NodeType.kElementNode;}
  get nodeName() {
    return this.tagName;
  }
  get tagName() {
    return this.local_name_;
  }
  get className(): string {
    return this.getAttribute('class') || '';
  }
  AsElement() {
    return this;
  }
  AsHTMLElement(): Optional<HTMLElement> {
    return undefined;
  }
  get attributes() {
    return this.attribute_map_;
  }

  copyAttributes(other: Element): void {
    this.attribute_map_ = deepClone(other.attribute_map_);
  }

  // Algorithm for SetAttribute:
  //   https://www.w3.org/TR/2014/WD-dom-20140710/#dom-element-setattribute
  setAttribute(name: string, raw_value: string) {
    // TRACK_MEMORY_SCOPE("DOM");
    TRACE_EVENT2('cobalt::dom', 'Element::SetAttribute',
      'name', name, 'value', raw_value);
    let document = this.GetDocument();

    let value = raw_value.toString();
    // 1. Not needed by Cobalt.

    // 2. If the context object is in the HTML namespace and its node document is
    //    an HTML document, let name be converted to ASCII lowercase.
    let attr_name = name.toString();
    if (document /*&& !document.IsXMLDocument()*/) {
      attr_name = attr_name.toLocaleLowerCase();
    }

    // 3. Let attribute be the first attribute in the context object's attribute
    //    list whose name is name, or null if there is no such attribute.
    // 4. If attribute is null, create an attribute whose local name is name and
    //    value is value, and then append this attribute to the context object and
    //    terminate these steps.
    // 5. Change attribute from context object to value.

    // let  old_value = this.getAttribute(attr_name);
    // MutationReporter mutation_reporter(this, GatherInclusiveAncestorsObservers());
    // mutation_reporter.ReportAttributesMutation(attr_name, old_value);

    switch (attr_name.length) {
      case 5:
        if (attr_name == kStyleAttributeName) {
          throw new Error('500');
          // SetStyleAttribute(value);
          // if (named_node_map_) {
          //   named_node_map_.SetAttributeInternal(attr_name, value);
          // }
          // OnSetAttribute(name, value);
          // // Return now as SetStyleAttribute() will call OnDOMMutation() when
          // // necessary.
          // return;
        }
      // fall-through if not style attribute name
      default: {
        let val = this.attribute_map_.get(attr_name);
        if (val === value) return;
        this.attribute_map_.set(attr_name, value);
        break;
      }
    }

    // Custom, not in any spec.
    // Check for specific attributes that require additional caching and update
    // logic.
    switch (attr_name.length) {
      case 2:
        if (attr_name == 'id') {
          NOTIMPLEMENTED();
          // id_attribute_ = attr_name
        }
        break;
      case 5:
        if (attr_name == 'class') {
          // Changing the class name may affect the contents of proxy objects.
          // UpdateGenerationForNodeAndAncestors();
          NOTIMPLEMENTED();
        }
        break;
    }
    // if (named_node_map_) {
    //   named_node_map_.SetAttributeInternal(attr_name, value);
    // }

    if (document && this.GetRootNode() == document) {
      document.OnDOMMutation();
    }
    this.OnSetAttribute(attr_name, value);
  }

  // Algorithm for GetAttribute:
  //   https://www.w3.org/TR/2014/WD-dom-20140710/#dom-element-getattribute
  getAttribute(name: string): Nullable<string> {
    // TRACK_MEMORY_SCOPE("DOM");
    let document = this.GetDocument();

    // 1. If the context object is in the HTML namespace and its node document is
    //    an HTML document, let name be converted to ASCII lowercase.
    let attr_name = name;
    if (document /*&& !document.IsXMLDocument()*/) {
      attr_name = attr_name.toLocaleLowerCase();
    }

    // 2. Return the value of the attribute in element's attribute list whose
    //    namespace is namespace and local name is localName, if it has one, and
    //    null otherwise.
    switch (attr_name.length) {
      case 5:
        if (attr_name == kStyleAttributeName) {
          return this.GetStyleAttribute();
        }
      // fall-through if not style attribute name
      default: {
        // AttributeMap::const_iterator iter = attribute_map_.find(attr_name);
        // if (iter != attribute_map_.end()) {
        //   return iter.second;
        // }
        let val = this.attribute_map_.get(attr_name);
        return val || null;
      }
    }
  }

  // Algorithm for RemoveAttribute:
  //   https://www.w3.org/TR/2014/WD-dom-20140710/#dom-element-removeattribute
  removeAttribute(name: string) {
    TRACE_EVENT1('cobalt::dom', 'Element::RemoveAttribute', 'name', name);
    let document = this.GetDocument();

    // 1. If the context object is in the HTML namespace and its node document is
    //    an HTML document, let name be converted to ASCII lowercase.
    let attr_name = name;
    if (document && !document.IsXMLDocument()) {
      attr_name = attr_name.toLowerCase();
    }

    let old_value = this.getAttribute(attr_name);
    if (old_value) {
      // MutationReporter mutation_reporter(this,
      //   GatherInclusiveAncestorsObservers());
      // mutation_reporter.ReportAttributesMutation(attr_name, old_value);
    }

// 2. Remove the first attribute from the context object whose name is name,
//    if any.
    switch (attr_name.length) {
      case 5:
        if (attr_name == kStyleAttributeName) {
          this.RemoveStyleAttribute();
          break;
        }
      // fall-through if not style attribute name
      default: {
        this.attribute_map_.delete(attr_name);
        break;
      }
    }

// Custom, not in any spec.
// Check for specific attributes that require additional caching and update
// logic.
    switch (attr_name.length) {
      case 2:
        if (attr_name == 'id') {
          // noop
          // this.id_attribute_ = base::Token("");
        }
        break;
      case 5:
        if (attr_name == 'class') {
          // Changing the class name may affect the contents of proxy objects.
          this.UpdateGenerationForNodeAndAncestors();
        }
        break;
    }
// if (this.named_node_map_) {
//   named_node_map_.RemoveAttributeInternal(attr_name);
// }

    if (document && this.GetRootNode() == document) {
      document.OnDOMMutation();
    }
    this.OnRemoveAttribute(attr_name);
  }

  GetStyleAttribute() {
    return this.attribute_map_.get(kStyleAttributeName) || null;
  }
  RemoveStyleAttribute() {
    this.attribute_map_.delete(kStyleAttributeName);
  }

// Algorithm for HasAttribute:
//   https://www.w3.org/TR/2014/WD-dom-20140710/#dom-element-hasattribute
  hasAttribute(name: string) {
    let document = this.GetDocument();

    // 1. If the context object is in the HTML namespace and its node document is
    //    an HTML document, let name be converted to ASCII lowercase.
    let attr_name = name;
    if (document && !document.IsXMLDocument()) {
      attr_name = attr_name.toLowerCase();
    }

// 2. Return true if the context object has an attribute whose name is name,
//    and false otherwise.
    return this.attribute_map_.has(attr_name);
  }

  // Algorithm for inner_html:
//   https://www.w3.org/TR/DOM-Parsing/#widl-Element-innerHTML
  inner_html(): string {
    // TRACK_MEMORY_SCOPE("DOM");
    let serializer = new Serializer();
    serializer.SerializeDescendantsOnly(this);
    return serializer.toString();
  }

  protected abstract OnSetAttribute(name: string, value: string): void
  protected abstract OnRemoveAttribute(name: string): void

  IsInTopLayer() {
    return this.HasElementFlag(ElementFlags.kIsInTopLayer);
  }

  HasElementFlag(mask: ElementFlags): boolean {
    return isNil(this.element_flags_) ? false : !!(this.element_flags_ & mask);
  }

  getBoundingClientRects() {
    const layoutObject = this.GetLayoutObject();
    DCHECK(layoutObject);
    const rect = layoutObject.box.GetClientRect();
    return new DOMRect(rect.x().toFloat(), rect.y().toFloat(), rect.width().toFloat(), rect.height().toFloat());
  }
}
