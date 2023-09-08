export interface Vector2d {
  x: number;
  y: number;
}

export type PathCommand =
  | 'm'
  | 'M'
  | 'l'
  | 'L'
  | 'v'
  | 'V'
  | 'h'
  | 'H'
  | 'z'
  | 'Z'
  | 'c'
  | 'C'
  | 'q'
  | 'Q'
  | 't'
  | 'T'
  | 's'
  | 'S'
  | 'a'
  | 'A';
export interface PathSegment {
  command: PathCommand,
  points: number[],
  start?: Vector2d,
  pathLength: number
}
