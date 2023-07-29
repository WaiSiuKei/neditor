import { warn } from './warning';
import { isPromise, isFunction } from '@vue/shared';

// contexts where user provided function may be executed, in addition to
// lifecycle hooks.
export const enum ErrorCodes {
  SETUP_FUNCTION,
  RENDER_FUNCTION,
  WATCH_GETTER,
  WATCH_CALLBACK,
  WATCH_CLEANUP,
  NATIVE_EVENT_HANDLER,
  COMPONENT_EVENT_HANDLER,
  VNODE_HOOK,
  DIRECTIVE_HOOK,
  TRANSITION_HOOK,
  APP_ERROR_HANDLER,
  APP_WARN_HANDLER,
  FUNCTION_REF,
  ASYNC_COMPONENT_LOADER,
  SCHEDULER,
}

export const ErrorTypeStrings: Record<number | string, string> = {
  [ErrorCodes.SETUP_FUNCTION]: 'setup function',
  [ErrorCodes.RENDER_FUNCTION]: 'render function',
  [ErrorCodes.WATCH_GETTER]: 'watcher getter',
  [ErrorCodes.WATCH_CALLBACK]: 'watcher callback',
  [ErrorCodes.WATCH_CLEANUP]: 'watcher cleanup function',
  [ErrorCodes.NATIVE_EVENT_HANDLER]: 'native event handler',
  [ErrorCodes.COMPONENT_EVENT_HANDLER]: 'component event handler',
  [ErrorCodes.VNODE_HOOK]: 'vnode hook',
  [ErrorCodes.DIRECTIVE_HOOK]: 'directive hook',
  [ErrorCodes.TRANSITION_HOOK]: 'transition hook',
  [ErrorCodes.APP_ERROR_HANDLER]: 'app errorHandler',
  [ErrorCodes.APP_WARN_HANDLER]: 'app warnHandler',
  [ErrorCodes.FUNCTION_REF]: 'ref function',
  [ErrorCodes.ASYNC_COMPONENT_LOADER]: 'async component loader',
  [ErrorCodes.SCHEDULER]: 'scheduler flush. This is likely a Vue internals bug. ' + 'Please open an issue at https://new-issue.vuejs.org/?repo=vuejs/vue-next',
};

export type ErrorTypes = ErrorCodes;

export function callWithErrorHandling(fn: Function, type: ErrorTypes, args?: unknown[]) {
  let res;
  try {
    res = args ? fn(...args) : fn();
  } catch (err) {
    handleError(err, type);
  }
  return res;
}

export function callWithAsyncErrorHandling(fn: Function | Function[], type: ErrorTypes, args?: unknown[]): any[] {
  if (isFunction(fn)) {
    const res = callWithErrorHandling(fn, type, args);
    if (res && isPromise(res)) {
      res.catch(err => {
        handleError(err, type);
      });
    }
    return res;
  }

  const values = [];
  for (let i = 0; i < fn.length; i++) {
    values.push(callWithAsyncErrorHandling(fn[i], type, args));
  }
  return values;
}

export function handleError(err: unknown, type: ErrorTypes, throwInDev = true) {
  logError(err, type, throwInDev);
}

function logError(err: unknown, type: ErrorTypes, throwInDev = true) {
  const info = ErrorTypeStrings[type];

  warn(`Unhandled error${info ? ` during execution of ${info}` : ``}`);

  // crash in dev by default so it's more noticeable
  if (throwInDev) {
    throw err;
  } else {
    console.error(err);
  }
}
