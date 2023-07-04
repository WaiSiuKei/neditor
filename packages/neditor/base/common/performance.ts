/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */


export interface PerformanceMark {
  readonly name: string;
  readonly startTime: number;
}

function _definePolyfillMarks(timeOrigin?: number) {
  const _data: Array<string | number> = [];
  if (typeof timeOrigin === 'number') {
    _data.push('code/timeOrigin', timeOrigin);
  }

  function mark(name: string) {
    _data.push(name, Date.now());
  }

  function getMarks(): PerformanceMark[] {
    const result: PerformanceMark[] = [];
    for (let i = 0; i < _data.length; i += 2) {
      result.push({
        name: _data[i] as string,
        startTime: _data[i + 1] as number,
      });
    }
    return result;
  }

  return { mark, getMarks };
}

const obj = (function () {
  // Identify browser environment when following property is not present
  // https://nodejs.org/dist/latest-v16.x/docs/api/perf_hooks.html#performancenodetiming
  if (
    typeof performance === 'object' &&
    typeof performance.mark === 'function' &&
    !Reflect.has(performance, 'nodeTiming')
  ) {
    // in a browser context, reuse performance-util

    if (typeof performance.timeOrigin !== 'number' && !performance.timing) {
      // safari & webworker: because there is no timeOrigin and no workaround
      // we use the `Date.now`-based polyfill.
      return _definePolyfillMarks();
    } else {
      // use "native" performance for mark and getMarks
      return {
        mark(name: string) {
          performance.mark(name);
        },
        getMarks() {
          let timeOrigin = performance.timeOrigin;
          if (typeof timeOrigin !== 'number') {
            // safari: there is no timerOrigin but in renderers there is the timing-property
            // see https://bugs.webkit.org/show_bug.cgi?id=174862
            timeOrigin =
              performance.timing.navigationStart ||
              performance.timing.redirectStart ||
              performance.timing.fetchStart;
          }
          const result = [{ name: 'code/timeOrigin', startTime: Math.round(timeOrigin) }];
          for (const entry of performance.getEntriesByType('mark')) {
            result.push({
              name: entry.name,
              startTime: Math.round(timeOrigin + entry.startTime),
            });
          }
          return result;
        },
      };
    }
  } else if (typeof process === 'object') {
    // node.js: use the normal polyfill but add the timeOrigin
    // from the node perf_hooks API as very first mark
    // const timeOrigin = Math.round(require('perf_hooks').performance.timeOrigin);
    // return _definePolyfillMarks(timeOrigin);
  } else {
    // unknown environment
    console.trace('perf-util loaded in UNKNOWN environment');
    return _definePolyfillMarks();
  }
})();
export const mark = obj!.mark;
