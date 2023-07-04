// Each node inheriting from the CharacterData interface has an associated
// mutable string called data.
//   https://www.w3.org/TR/2015/WD-dom-20150428/#interface-characterdata
import { ConstructionType, Node } from './node';
import { Document } from './document';
import { Optional } from '@neditor/core/base/common/typescript';
import { isString } from '@neditor/core/base/common/type';
import { DCHECK } from '@neditor/core/base/check';

export abstract class CharacterData extends Node {
  private data_: string;
  constructor(type: ConstructionType, data: string)
  constructor(type: ConstructionType, document: Document, data: string)
  constructor(type: ConstructionType, a1: Document | string, a2?: string) {
    DCHECK(type == ConstructionType.kCreateOther || type == ConstructionType.kCreateText ||
      type == ConstructionType.kCreateEditingText);
    if (isString(a1)) {
      super(type);
      this.data_ = a1;
    } else {
      super(type, a1 as Document);
      this.data_ = a2!;
    }
  }

  // Web API: Node
  get nodeValue(): Optional<string> { return this.data_; }
  set nodeValue(node_value: Optional<string>) {
    // Don't use value_or to avoid copying the string.
    if (node_value) {
      this.set_data(node_value);
    } else {
      this.set_data('');
    }
  }

  text_content(): Optional<string> { return this.data_; }
  set_text_content(text_content: Optional<string>) {
    // Don't use value_or to avoid copying the string.
    if (text_content) {
      this.set_data(text_content);
    } else {
      this.set_data('');
    }
  }

  // Web API: CharacterData
  //
  get data(): string { return this.data_; }
  set_data(data: string) {
    // MutationReporter mutation_reporter(this, GatherInclusiveAncestorsObservers());
    // mutation_reporter.ReportCharacterDataMutation(data_);
    this.data_ = data;

    this.InvalidateLayoutBoxesOfNodeAndAncestors();
    this.GetDocument()?.OnDOMMutation();
  }

  // Custom, not in any spec.
  //
  // Unlike data() which returns a copy, returns a reference to the underlying
  // sequence of characters. This can save copying in layout engine where text
  // is broken into words. Should be used carefully to avoid dangling string
  // iterators.
  text() { return this.data_; }

  AsCharacterData(): Optional<CharacterData> {
    return this;
  }
  length(): number {
    return this.data_.length;
  }
}

