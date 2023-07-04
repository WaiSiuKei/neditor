import type { Size } from '../math/size';
import { ComputedStyleData, MutableComputedStyleData } from './computed_style_data';
import { RGBAColorValue } from './rgba_color_value';
import { KeywordValue } from './keyword_value';
import { LengthUnit, LengthValue } from './length_value';
import { PropertyKey } from './property_definitions';

export function CreateInitialComputedStyle(
  viewport_size: Size
): ComputedStyleData {
  let initial_containing_block_computed_style = new MutableComputedStyleData();
  initial_containing_block_computed_style.set_background_color(new RGBAColorValue(0x00000000));
  initial_containing_block_computed_style.set_display(KeywordValue.GetBlock());
  initial_containing_block_computed_style.set_is_inline_before_blockification(false);
  initial_containing_block_computed_style.set_width(new LengthValue(viewport_size.width(), LengthUnit.kPixelsUnit));
  initial_containing_block_computed_style.set_height(new LengthValue(viewport_size.height(), LengthUnit.kPixelsUnit));
  return initial_containing_block_computed_style;
}
