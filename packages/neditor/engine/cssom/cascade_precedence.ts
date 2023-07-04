// The enum origin here includes both origin and importance in the spec. The
// origin of a declaration is based on where it comes from and its importance
// is whether or not it is declared !important.
//   https://www.w3.org/TR/css-cascade-3/#cascade-origin
// The origin with higher precedence appears later in the enum, and is therefore
// with higher value.
import { DCHECK_GE } from '@neditor/core/base/check_op';
import { NOTREACHED } from '@neditor/core/base/common/notreached';
import { Specificity } from './specificity';

export enum Origin {
  kNormalUserAgent,
  kNormalAuthor,
  kNormalOverride,
  kImportantMin,  // The lowest important origin.
  kImportantAuthor = kImportantMin,
  kImportantOverride,
  kImportantUserAgent,
  kImportantMax = kImportantUserAgent,
};

// Appearance is the position of the declaration in the document.
//   https://www.w3.org/TR/css-cascade-3/#cascade-order
export class Appearance {
  static kUnattached = -1;
  private style_sheet_index_: number = Appearance.kUnattached;
  private rule_index_: number = Appearance.kUnattached;

  constructor(
    style_sheet_index = Appearance.kUnattached,
    rule_index = Appearance.kUnattached
  ) {
    this.style_sheet_index_ = style_sheet_index;
    this.rule_index_ = rule_index;
    DCHECK_GE(style_sheet_index, Appearance.kUnattached, 'Wrong style sheet index.');
    DCHECK_GE(rule_index, Appearance.kUnattached, 'Wrong rule index.');
  }

  // Earlier appearance is smaller. The fields are compared lexicographically.
  LT(rhs: Appearance): boolean {
    return this.style_sheet_index_ < rhs.style_sheet_index_ ||
      (this.style_sheet_index_ == rhs.style_sheet_index_ &&
        this.rule_index_ < rhs.rule_index_);
  }
  EQ(rhs: Appearance): boolean {
    return this.style_sheet_index_ == rhs.style_sheet_index_ &&
      this.rule_index_ == rhs.rule_index_;
  }
};

// Cascade precedence is the value that is used in sorting the declarations in
// the cascade.
//   https://www.w3.org/TR/css-cascade-3/#cascade
// In Cobalt the cascade precedence includes origin, specificity and appearance,
// which is compared lexicographically.
export class CascadePrecedence {
  private origin_: Origin;
  private specificity_: Specificity;
  private appearance_: Appearance;
  constructor(origin: Origin, specificity: Specificity = new Specificity(), appearance: Appearance = new Appearance()) {
    this.origin_ = origin;
    this.specificity_ = specificity;
    this.appearance_ = appearance;
  }

  origin() { return this.origin_; }
  specificity() { return this.specificity_; }
  appearance() { return this.appearance_; }

  SetImportant() {
    switch (this.origin_) {
      case Origin.kNormalUserAgent: {
        this.origin_ = Origin.kImportantUserAgent;
        break;
      }
      case Origin.kNormalAuthor: {
        this.origin_ = Origin.kImportantAuthor;
        break;
      }
      case Origin.kNormalOverride: {
        this.origin_ = Origin.kImportantOverride;
        break;
      }
      case Origin.kImportantAuthor:
      case Origin.kImportantOverride:
      case Origin.kImportantUserAgent:
        NOTREACHED();
    }
  }

  LT(rhs: CascadePrecedence) {
    return this.origin_ < rhs.origin_ ||
      (this.origin_ == rhs.origin_ && (this.specificity_.LT(rhs.specificity_) ||
        (this.specificity_.EQ(rhs.specificity_) &&
          this.appearance_.LT(rhs.appearance_))));
  }
  EQ(rhs: CascadePrecedence) {
    return this.origin_ == rhs.origin_ && this.specificity_ == rhs.specificity_ &&
      this.appearance_ == rhs.appearance_;
  }
};
