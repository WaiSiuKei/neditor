import { ColorRGBA } from "./color_rgba";
import { Optional } from "../../base/common/typescript";

export enum PathCommandVerb {
  M = 'M',
  Q = 'Q',
  Z = 'Z'
}

export class Path {
  constructor(
    public d: string,
    public fill: Optional<ColorRGBA>,
    public stroke: Optional<ColorRGBA>,
  ) {
  }
}
