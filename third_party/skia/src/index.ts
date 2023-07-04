import factory, {
  Paint,
  Path,
  Font,
} from 'canvaskit-wasm';
import type { CanvasKit as TCanvasKit } from 'canvaskit-wasm';

export type { Surface, TextBlob } from 'canvaskit-wasm';
// @ts-ignore
import wasm from 'canvaskit-wasm/bin/canvaskit.wasm?url';
import { NOTREACHED } from "@neditor/core/base/common/notreached";
import type { AccessorCallback, ConstructorSignature } from "@neditor/core/base/common/typescript";

const config = {
  locateFile: () => wasm,
};

export let CanvasKit: TCanvasKit;
export type CanvasKit = TCanvasKit

export async function initSkiaModule() {
  // @ts-ignore
  CanvasKit = await factory(config);
}

export function makePaint<R>(cb: AccessorCallback<Paint, R>): R {
  const p = new CanvasKit.Paint();
  try {
    return cb(p)
  } finally {
    p.deleteLater()
  }
}

export function MakePathFromSVGString<R>(str: string) {
  return (cb: AccessorCallback<Path, R>): R => {
    const p = CanvasKit.Path.MakeFromSVGString(str);
    if (!p) {
      NOTREACHED()
    }
    try {
      return cb(p)
    } finally {
      p.deleteLater()
    }
  }
}
