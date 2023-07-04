export interface GestureEvent extends MouseEvent {
  initialTarget: EventTarget | undefined;
  translationX: number;
  translationY: number;
  pageX: number;
  pageY: number;
  tapCount: number;
}
