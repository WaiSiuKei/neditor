export enum WrapAtPolicy {
  kWrapAtPolicyBefore,
  kWrapAtPolicyLastOpportunityWithinWidth,
  kWrapAtPolicyLastOpportunity,
  kWrapAtPolicyFirstOpportunity,
}

// Wrapping is only performed at an allowed break point, called a soft wrap
// opportunity.
//   https://www.w3.org/TR/css-text-3/#line-breaking
// 'normal': Lines may break only at allowed break points.
// 'break-word': An unbreakable 'word' may be broken at an an arbitrary point...
//   https://www.w3.org/TR/css-text-3/#overflow-wrap
export enum WrapOpportunityPolicy {
  kWrapOpportunityPolicyNormal,
  kWrapOpportunityPolicyBreakWord,
  kWrapOpportunityPolicyBreakWordOrNormal,
}

export enum WrapResult {
  kWrapResultNoWrap,
  kWrapResultWrapBefore,
  kWrapResultSplitWrap,
}

export function ShouldProcessWrapOpportunityPolicy(
  wrap_opportunity_policy: WrapOpportunityPolicy,
  does_style_allow_break_word: boolean): boolean {
  if (does_style_allow_break_word) {
    return wrap_opportunity_policy !== WrapOpportunityPolicy.kWrapOpportunityPolicyNormal;
  } else {
    return wrap_opportunity_policy !== WrapOpportunityPolicy.kWrapOpportunityPolicyBreakWordOrNormal;
  }
  // return wrap_opportunity_policy != WrapOpportunityPolicy.kWrapOpportunityPolicyBreakWord
  //   || does_style_allow_break_word;
}
