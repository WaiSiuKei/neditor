// The cascaded value represents the result of the cascade: it is the declared
// value that wins the cascade (is sorted first in the output of the cascade).
// If the output of the cascade is an empty list, there is no cascaded value.
//   https://www.w3.org/TR/css-cascade-3/#cascaded

// Given list of rules that match the element, sorts them by specificity and
// applies the declared values contained in the rules on top of the inline style
// according to the cascading algorithm.
//   https://www.w3.org/TR/css-cascade-3/#cascading
import { DeclaredStyleData } from './declared_style_data';
import { ComputedStyleData, MutableComputedStyleData } from './computed_style_data';
import { PropertyKey } from './property_definitions';
import { Optional } from '@neditor/core/base/common/typescript';
import { CascadePrecedence, Origin } from './cascade_precedence';
import { DCHECK_GT, DCHECK_LE } from '@neditor/core/base/check_op';

export function PromoteToCascadedStyle(
  inline_style: DeclaredStyleData,
  // RulesWithCascadePrecedence* matching_rules,
  // GURLMap* property_key_to_base_url_map
): MutableComputedStyleData {
  let cascaded_style = new MutableComputedStyleData();

  // A sparse vector of CascadePrecedence values for all possible property
  // values.
  let cascade_precedences: Optional<CascadePrecedence>[] = new Array(PropertyKey.kNumLonghandProperties);

  if (inline_style) {
    const precedence_normal = new CascadePrecedence(Origin.kImportantMin);
    const precedence_important = new CascadePrecedence(Origin.kImportantMax);
    let background_image_refreshed = SetPropertyValuesOfHigherPrecedence(
      inline_style, precedence_normal, precedence_important,
      cascade_precedences, cascaded_style);
  }

//   if (!matching_rules.empty()) {
//     for (RulesWithCascadePrecedence::const_iterator rule_iterator =
//       matching_rules.begin();
//     rule_iterator != matching_rules.end(); ++rule_iterator) {
//       const scoped_refptr<const CSSDeclaredStyleData>& declared_style =
//         rule_iterator.first.declared_style_data();
//       if (declared_style) {
//         const CascadePrecedence& precedence_normal = rule_iterator.second;
//         CascadePrecedence precedence_important = rule_iterator.second;
//         precedence_important.SetImportant();
//         bool background_image_refreshed = false;
//         SetPropertyValuesOfHigherPrecedence(
//           declared_style, precedence_normal, precedence_important,
//           cascade_precedences, &cascaded_style, &background_image_refreshed);
//
//         if (background_image_refreshed) {
//           const scoped_refptr<CSSStyleSheet>& parent_style_sheet =
//             rule_iterator.first.parent_style_sheet();
// //          if (parent_style_sheet &&
// //              parent_style_sheet.LocationUrl().is_valid()) {
// //            DCHECK(property_key_to_base_url_map);
// //            (*property_key_to_base_url_map)[kBackgroundImageProperty] =
// //                parent_style_sheet.LocationUrl();
// //          }
//         }
//       }
//     }
//   }
  return cascaded_style;
}

function SetPropertyValuesOfHigherPrecedence(
  style: DeclaredStyleData,
  precedence_normal: CascadePrecedence,
  precedence_important: CascadePrecedence,
  cascade_precedences: Optional<CascadePrecedence>[],
  cascaded_style: ComputedStyleData,
): boolean {
  let background_image_refreshed = false;
  let property_values = style.declared_property_values();
  for (let [key, value] of property_values) {
    DCHECK_GT(key, PropertyKey.kNoneProperty);
    DCHECK_LE(key, PropertyKey.kMaxLonghandPropertyKey);

    let precedence =
      style.IsDeclaredPropertyImportant(key) ? precedence_important
        : precedence_normal;
    if (!(cascade_precedences[key]) ||
      cascade_precedences[key]!.LT(precedence)) {
      cascade_precedences[key] = precedence;
      cascaded_style.SetPropertyValue(key, value);
      if (PropertyKey.kBackgroundImageProperty == key) {
        background_image_refreshed = true;
      }
    }
  }
  return background_image_refreshed;
}
