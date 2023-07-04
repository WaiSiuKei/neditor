import { ReplacedBox } from './replaced_box';
import { LayoutUnit } from './layout_unit';
import { Optional } from '@neditor/core/base/common/typescript';
import { Level } from './box';
import { BaseDirection } from './base_direction';

export class BlockLevelReplacedBox<T> extends ReplacedBox<T> {
  // From |Box|.
  GetLevel(): Level {return Level.kBlockLevel;}

  // From |Box|.
  DumpClassName(stream: string) {
    stream += 'BlockLevelReplacedBox ';
    return stream;
  }

  // From |ReplacedBox|.
  UpdateHorizontalMargins(
    containing_block_direction: BaseDirection,
    containing_block_width: LayoutUnit,
    border_box_width: LayoutUnit,
    maybe_margin_left: Optional<LayoutUnit>,
    maybe_margin_right: Optional<LayoutUnit>) {
    // Calculate the horizonal margins for block-level, replaced elements in
    // normal flow.
    //   https://www.w3.org/TR/CSS21/visudet.html#block-replaced-width
    this.UpdateHorizontalMarginsAssumingBlockLevelInFlowBox(
      containing_block_direction, containing_block_width,
      border_box_width, maybe_margin_left, maybe_margin_right);
  }
};
