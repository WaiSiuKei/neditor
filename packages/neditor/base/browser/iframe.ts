/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Represents a window in a possible chain of iframes
 */
export interface IWindowChainElement {
  /**
   * The window object for it
   */
  window: Window;
  /**
   * The iframe element inside the window.parent corresponding to window
   */
  iframeElement: Element | null;
}

let hasDifferentOriginAncestorFlag: boolean = false;
let sameOriginWindowChainCache: IWindowChainElement[] | null = null;

function getParentWindowIfSameOrigin(w: Window): Window | null {
  if (!w.parent || w.parent === w) {
    return null;
  }

  // Cannot really tell if we have access to the parent window unless we try to access something in it
  try {
    let location = w.location;
    let parentLocation = w.parent.location;
    if (location.origin !== 'null' && parentLocation.origin !== 'null') {
      if (location.protocol !== parentLocation.protocol || location.hostname !== parentLocation.hostname || location.port !== parentLocation.port) {
        hasDifferentOriginAncestorFlag = true;
        return null;
      }
    }
  } catch (e) {
    hasDifferentOriginAncestorFlag = true;
    return null;
  }

  return w.parent;
}

/**
 * Returns a chain of embedded windows with the same origin (which can be accessed programmatically).
 * Having a chain of length 1 might mean that the current execution environment is running outside of an iframe or inside an iframe embedded in a window with a different origin.
 * To distinguish if at one point the current execution environment is running inside a window with a different origin, see hasDifferentOriginAncestor()
 */
export function getSameOriginWindowChain(win: Window = window): IWindowChainElement[] {
  if (!sameOriginWindowChainCache) {
    sameOriginWindowChainCache = [];
    let w: Window | null = win;
    let parent: Window | null;
    do {
      parent = getParentWindowIfSameOrigin(w);
      if (parent) {
        sameOriginWindowChainCache.push({
          window: w,
          iframeElement: w.frameElement || null
        });
      } else {
        sameOriginWindowChainCache.push({
          window: w,
          iframeElement: null
        });
      }
      w = parent;
    } while (w);
  }
  return sameOriginWindowChainCache.slice(0);
}

/**
 * Returns the position of `childWindow` relative to `ancestorWindow`
 */
export function getPositionOfChildWindowRelativeToAncestorWindow(childWindow: Window, ancestorWindow: Window | null) {
  if (!ancestorWindow || childWindow === ancestorWindow) {
    return {
      top: 0,
      left: 0
    };
  }

  let top = 0, left = 0;

  let windowChain = getSameOriginWindowChain(childWindow);

  for (const windowChainEl of windowChain) {

    top += windowChainEl.window.scrollY;
    left += windowChainEl.window.scrollX;

    if (windowChainEl.window === ancestorWindow) {
      break;
    }

    if (!windowChainEl.iframeElement) {
      break;
    }

    let boundingRect = windowChainEl.iframeElement.getBoundingClientRect();
    top += boundingRect.top;
    left += boundingRect.left;
  }

  return {
    top: top,
    left: left
  };
}
