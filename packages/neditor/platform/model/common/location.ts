import { IIdentifier } from "../../../common/common";
import { Scope } from "../../../canvas/canvasCommon/scope";

export enum DirectionType {
  backward,
  forward,
  inward,
  self,
  ancestors,
  descendants,
}

export interface ILocation {
  ref: IIdentifier;
  direction?: DirectionType;
}

export interface IScopedLocation extends ILocation {
  scope: Scope;
}
