export enum MapCoordinatesMode {
  // Only needed in some special cases to intentionally ignore transforms.
  kIgnoreTransforms = 1 << 2,

  kTraverseDocumentBoundaries = 1 << 3,

  // Ignore offset adjustments caused by position:sticky calculations when
  // walking the chain.
  kIgnoreStickyOffset = 1 << 4,

  // Ignore scroll offset from container, i.e. scrolling has no effect on mapped
  // position.
  kIgnoreScrollOffset = 1 << 5,

  // If the local root frame has a remote frame parent, apply the transformation
  // from the local root frame to the remote main frame.
  kApplyRemoteMainFrameTransform = 1 << 6,
}
export type MapCoordinatesFlags = number
