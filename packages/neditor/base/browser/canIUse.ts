/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as browser from './browser';
import * as platform from '../common/platform';

export const enum KeyboardSupport {
	Always,
	FullScreen,
	None
}

/**
 * Browser feature we can support in current platform, browser and environment.
 */
export const BrowserFeatures = {
	clipboard: {
		writeText: (
			platform.isNative
			|| (document.queryCommandSupported && document.queryCommandSupported('copy'))
			|| !!(navigator && navigator.clipboard && navigator.clipboard.writeText)
		),
		readText: (
			platform.isNative
			|| !!(navigator && navigator.clipboard && navigator.clipboard.readText)
		),
		richText: (() => {
			if (browser.isIE) {
				return false;
			}

			if (browser.isEdge) {
				let index = navigator.userAgent.indexOf('Edge/');
				let version = parseInt(navigator.userAgent.substring(index + 5, navigator.userAgent.indexOf('.', index)), 10);

				if (!version || (version >= 12 && version <= 16)) {
					return false;
				}
			}

			return true;
		})()
	},
	keyboard: (() => {
		if (platform.isNative || browser.isStandalone) {
			return KeyboardSupport.Always;
		}

		if ((<any>navigator).keyboard || browser.isSafari) {
			return KeyboardSupport.FullScreen;
		}

		return KeyboardSupport.None;
	})(),
  // @ts-ignore
	touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.navigator.msMaxTouchPoints > 0,
  // @ts-ignore
  pointerEvents: window.PointerEvent && ('ontouchstart' in window || window.navigator.maxTouchPoints > 0 || navigator.maxTouchPoints > 0 || window.navigator.msMaxTouchPoints > 0)
};
