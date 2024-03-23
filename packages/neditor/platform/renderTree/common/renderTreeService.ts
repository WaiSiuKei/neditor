import { Disposable } from '../../../base/common/lifecycle';
import { NOTIMPLEMENTED } from '../../../base/common/notreached';
import { IRenderTreeService } from './renderTree';

export class RenderTreeService extends Disposable implements IRenderTreeService {
  _serviceBrand: undefined;

  constructor() {
    super();
  }

  bind(): void {
    NOTIMPLEMENTED();
  }
}
