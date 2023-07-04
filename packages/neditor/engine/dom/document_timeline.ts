// Implements the DocumentTimeline IDL interface.
// https://www.w3.org/TR/2015/WD-web-animations-1-20150707/#the-documenttimeline-interface
import type { Document } from './document';
import { BasicClock, OffsetClock } from '../base/clock';
import { TimeDelta } from '@neditor/core/base/time/time';
import { AnimationTimeline } from '../web_animations/animation_timeline';

export class DocumentTimeline extends AnimationTimeline {
  private document_: Document;

  constructor(document: Document, origin_time: number) {
    super(CreateOffsetClock(document, origin_time));
    this.document_ = document;
  }
};

function CreateOffsetClock(document: Document,
                           origin_time: number): BasicClock {
  return new OffsetClock(document.navigation_start_clock(), TimeDelta.FromMilliseconds(origin_time));
}
