

// Returns true if "overflow" should be treated as cropped. This is true for
// overflow "auto", "hidden", and "scroll".
//   https://www.w3.org/TR/CSS21/visufx.html#overflow
import { ComputedStyleData } from './computed_style_data';
import { KeywordValue } from './keyword_value';

export function   IsOverflowCropped(
  computed_style: ComputedStyleData):boolean  {
  return computed_style.overflow == KeywordValue.GetAuto() ||
         computed_style.overflow == KeywordValue.GetHidden() ||
         computed_style.overflow == KeywordValue.GetScroll();
}
