/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */
export abstract class Part {
 protected parent: HTMLElement | undefined;
  // private contentArea: HTMLElement | undefined;

  constructor(public id: string) {
  }

  // create(parent: HTMLElement, options?: object): void {
  //   this.parent = parent;
  //   this.contentArea = this.createContentArea(parent, options);
  // }
  //
  //
  // /**
  //  * Subclasses override to provide a content area implementation.
  //  */
  // protected createContentArea(parent: HTMLElement, options?: object): HTMLElement | undefined {
  //   return undefined;
  // }
  //
  // element!: HTMLElement;
  // // #endregion
}
