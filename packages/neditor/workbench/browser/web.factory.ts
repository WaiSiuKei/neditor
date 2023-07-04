/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import { IWorkbench, IWorkbenchConstructionOptions } from '@neditor/core/workbench/browser/web.api';
import { BrowserMain } from '@neditor/core/workbench/browser/web.main';
import { IDisposable, toDisposable } from '@neditor/core/base/common/lifecycle';
import { Barrier } from '@neditor/core/base/common/async';
import { mark } from "@neditor/core/base/common/performance";

let created = false;
const barrier = new Barrier<IWorkbench>()

export function create(
  domElement: HTMLElement,
  options: IWorkbenchConstructionOptions,
): IDisposable {
  // Mark start of workbench
  mark('code/didLoadWorkbenchMain');

  // Assert that the workbench is not created more than once. We currently
  // do not support this and require a full context switch to clean-up.
  if (created) {
    throw new Error('Unable to create the VSCode workbench more than once.');
  } else {
    created = true;
  }

  // Startup workbench and resolve waiters
  let instantiatedWorkbench: IWorkbench | undefined;
  new BrowserMain(domElement, options).open().then((workbench) => {
    instantiatedWorkbench = workbench;
    barrier.open(workbench)
  });

  return toDisposable(() => {
    if (instantiatedWorkbench) {
      instantiatedWorkbench.shutdown();
    } else {
      barrier.wait().then((instantiatedWorkbench) => instantiatedWorkbench.shutdown());
    }
  });
}
