import { StyleDeclaration } from './style_declaration';
import { DeclaredStyleData } from './declared_style_data';
import { Optional } from '@neditor/core/base/common/typescript';
import { DCHECK } from '@neditor/core/base/check';
import { NOTIMPLEMENTED } from '@neditor/core/base/common/notreached';
import { GetPropertyName, PropertyKey } from './property_definitions';
import { DCHECK_LE } from '@neditor/core/base/check_op';
import { DLOG, WARNING } from '@neditor/core/base/logging';
import { Interpretor } from '../css_parser/interpretor';

export class DeclaredStyleDeclaration extends StyleDeclaration {
  private data_: Optional<DeclaredStyleData>;
  private css_parser_: Interpretor | undefined = undefined;

  constructor(data?: DeclaredStyleData)
  constructor(arg?: any) {
    super();
    if (arg && arg instanceof DeclaredStyleData) {
      this.data_ = arg;
    } else {
      this.data_ = new DeclaredStyleData();
    }
    this.css_parser_ = new Interpretor();
  }

  data() {
    DCHECK(this.data_);
    return this.data_!;
  }

  setProperty(property_name: string, property_value: string): void {
    DCHECK(this.css_parser_);
    if (!this.data_) {
      this.data_ = new DeclaredStyleData();
    }
    this.css_parser_!.apply(this, `${property_name} : ${property_value};`);

    // this.RecordMutation();
  }

  GetDeclaredPropertyValueStringByKey(key: PropertyKey): string {
    if (key > PropertyKey.kMaxLonghandPropertyKey) {
      // Shorthand properties are never directly stored as declared properties,
      // but are expanded into their longhand property components during parsing.
      // TODO: Implement serialization of css values, see
      // https://www.w3.org/TR/cssom-1/#serializing-css-values
      DCHECK_LE(key, PropertyKey.kMaxEveryPropertyKey);
      NOTIMPLEMENTED();
      DLOG(WARNING, 'Unsupported property query for "', GetPropertyName(key)
        , '": Returning of property value strings is not ',
        'supported for shorthand properties.');
      return '';
    }
    return (this.data_ && key != PropertyKey.kNoneProperty) ? this.data_.GetPropertyValueString(key)
      : '';
  }

  AssignFrom(rhs: DeclaredStyleDeclaration) {
    if (!rhs.data_) {
      this.data_ = undefined;
      return;
    }
    if (!this.data_) {
      this.data_ = new DeclaredStyleData();
    }
    this.data_.AssignFrom(rhs.data_);
  }

  RecordMutation() {
    NOTIMPLEMENTED();
    // if (this.mutation_observer_) {
    //   // Trigger layout update.
    //   mutation_observer_.OnCSSMutation();
    // }
  }

  toString() {
    return this.data_?.toString();
  }
}
