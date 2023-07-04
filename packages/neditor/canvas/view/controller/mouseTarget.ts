import {
  MouseTargetType,
} from '../../canvas/browser';
import { IPointerHandlerHelper } from './mouseHandler';
import { isNil } from '@neditor/core/base/common/type';
import { PageCoordinates } from './mouseEventFactory';
import { HitTestOptions, DOMHitTestResult } from '@neditor/core/engine/layout/layout_manager';
import { NOTIMPLEMENTED } from '@neditor/core/base/common/notreached';
import { Optional } from '@neditor/core/base/common/typescript';
import { IMouseTarget, PathInfo } from '@neditor/core/platform/input/browser/event';

export class MouseTarget implements IMouseTarget {
  public readonly type: MouseTargetType;
  public readonly targetPath: PathInfo[];

  constructor(type: MouseTargetType, targetPath: PathInfo[] = []) {
    this.type = type;
    this.targetPath = targetPath;
  }
}

export class HitTestContext {
  private readonly _viewHelper: IPointerHandlerHelper;

  constructor(viewHelper: IPointerHandlerHelper) {
    this._viewHelper = viewHelper;
  }
}

class HitTestRequest {
  protected readonly _ctx: HitTestContext;
  result: Optional<DOMHitTestResult[]>;
  target: HTMLElement | null;
  targetPath: PathInfo[] = []

  pos: PageCoordinates;

  constructor(ctx: HitTestContext, pos: PageCoordinates, target: HTMLElement | null) {
    this.pos = pos;
    this._ctx = ctx;

    this.target = target;
  }

  public fulfill(type: MouseTargetType): MouseTarget {
    let targetPath = this.targetPath.splice(0);
    if (this.result) {
      targetPath.push(...this.result.map(r => PathInfo.fromVirtualDOMNode(r.node)));
    }

    return new MouseTarget(type, targetPath);
  }

  public withResult(result: DOMHitTestResult[]): HitTestRequest {
    let ret = new HitTestRequest(this._ctx, this.pos, this.target);
    ret.result = result;
    return ret;
  }
}

interface ResolvedHitTestRequest extends HitTestRequest {
  result: DOMHitTestResult[];
}

export class MouseTargetFactory {
  private readonly _viewHelper: IPointerHandlerHelper;

  constructor(viewHelper: IPointerHandlerHelper) {
    this._viewHelper = viewHelper;
  }

  public createMouseTarget(pos: PageCoordinates, target: HTMLElement | null, opt: HitTestOptions): IMouseTarget {
    const ctx = new HitTestContext(this._viewHelper);
    const request = new HitTestRequest(ctx, pos, target);
    return this._createMouseTarget(ctx, request, false, opt);
  }

  private _createMouseTarget(ctx: HitTestContext, request: HitTestRequest, domHitTestExecuted: boolean, opt: HitTestOptions): MouseTarget {
    // First ensure the request has a target
    if (!request.target) {
      NOTIMPLEMENTED();
    }

    // we know for a fact that request.target is not null
    const resolvedRequest = <ResolvedHitTestRequest>request;

    let result: MouseTarget | null = null;

    result = result || this._hitTestCanvas(resolvedRequest, opt);

    if (isNil(result)) {
      result = request.fulfill(MouseTargetType.Unknown);
    }
    return result;
  }

  private _hitTestCanvas(request: ResolvedHitTestRequest, opt: HitTestOptions): MouseTarget | null {
    const results = this._viewHelper.hitTest(request.pos.x, request.pos.y, opt);
    if (results.length > 0) {
      return request.withResult(results).fulfill(MouseTargetType.Canvas);
    }
    return request.fulfill(MouseTargetType.Canvas);
  }
}
