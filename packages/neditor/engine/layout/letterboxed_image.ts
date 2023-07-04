import { Optional } from '@neditor/core/base/common/typescript';
import { RectF } from '../math/rect_f';
import { SizeF } from '../math/size_f';
import { DLOG, WARNING } from '@neditor/core/base/logging';
import { PointF } from '../math/point_f';

export interface LetterboxDimensions {
  // The destination dimensions of the image such that its aspect ratio is
  // maintained.
  image_rect: Optional<RectF>;

  // A set of filling rectangles that pad the image.
  fill_rects: RectF[];
};

// This helper function will compute the dimensions of an image and filling
// rectangles such that the image appears at the correct aspect ratio within
// a letterboxed destination rectangle.  This function will return the
// dimensions to use for an image and all filling rectangles (which will
// presumably be filled as solid black) in order to create the letterbox effect.
// It does the above by the following steps:
// 2. If the area of the ImageParser is 0, this function will return a single filling
//    rectangle covering the entire |destination_size|.
// 3. If the aspect ratio of the image is the same as |destination_size|, the
//    image will be stretched to fill the whole destination.
// 4. If the image is wider than the destination, it will be stretched to ensure
//    that its width is the same as the width of the destination.  The image
//    will be centered vertically and two filling rectangles placed on the top
//    and bottom to fill the blank.
// 5. Otherwise, the image is higher than the destination.  it will be stretched
//    to ensure that its height is the same as the height of the destination.
//    The image will be centered horizontally and two filling rectangles placed
//    on the left and right to fill the blank.
export function GetLetterboxDimensions(image_size: SizeF,
                                       destination_size: SizeF): LetterboxDimensions {
  const kEpsilon = 0.01;

  let dimensions: LetterboxDimensions = Object.create(null);

  if (destination_size.GetArea() == 0) {
    DLOG(WARNING, 'destination_size ', destination_size, ' is empty');
    return dimensions;
  }

  if (image_size.GetArea() == 0) {
    dimensions.fill_rects.push(new RectF(destination_size));
    return dimensions;
  }

  let image_aspect_ratio = image_size.width() / image_size.height();
  let destination_aspect_ratio =
    destination_size.width() / destination_size.height();

  if (Math.abs(image_aspect_ratio - destination_aspect_ratio) < kEpsilon) {
    // The aspect ratio of the ImageParser are the same as the destination.
    dimensions.image_rect = new RectF(destination_size);
  } else if (image_aspect_ratio > destination_aspect_ratio) {
    // ImageParser is wider.  We have to put bands on top and bottom.
    let adjusted_size = new SizeF(destination_size.width(),
      destination_size.width() / image_aspect_ratio);
    let band_height =
      (destination_size.height() - adjusted_size.height()) / 2;

    dimensions.image_rect =
      new RectF(new PointF(0, band_height), adjusted_size);
    dimensions.fill_rects.push(
      new RectF(0, 0, destination_size.width(), band_height));
    dimensions.fill_rects.push(
      new RectF(0, destination_size.height() - band_height,
        destination_size.width(), band_height));
  } else {
    // ImageParser is higher.  We have to put bands on left and right.
    let adjusted_size = new SizeF(destination_size.height() * image_aspect_ratio,
      destination_size.height());
    let band_width = (destination_size.width() - adjusted_size.width()) / 2;

    dimensions.image_rect =
      new RectF(new PointF(band_width, 0), adjusted_size);
    dimensions.fill_rects.push(
      new RectF(0, 0, band_width, destination_size.height()));
    dimensions.fill_rects.push(new RectF(destination_size.width() - band_width,
      0, band_width,
      destination_size.height()));
  }

  return dimensions;
}
