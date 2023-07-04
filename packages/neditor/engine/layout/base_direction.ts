

// BaseDirection is used to indicate the inline direction in which content is
// ordered on a line and defines on which sides "start" and "end" of a line are,
// and also to indicate the zero bidirectional orientation of text in a
// paragraph.
// https://www.w3.org/TR/css-writing-modes-3/#inline-base-direction
// http://unicode.org/reports/tr9/#BD5
export enum BaseDirection {
  kRightToLeftBaseDirection,
  kLeftToRightBaseDirection,
};
