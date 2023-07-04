/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import { Emitter, setGlobalLeakWarningThreshold } from '@neditor/core/base/common/event';
import { RunOnceScheduler, runWhenIdle } from '@neditor/core/base/common/async';
import { onUnexpectedError } from '@neditor/core/base/common/errors';
import { isChrome, isLinux, isSafari, isWeb, isWindows, } from '@neditor/core/base/common/platform';
// import { IStorageService } from '@neditor/core/platform/storage/common/storage';
// import { IConfigurationService } from '@neditor/core/platform/configuration/common/configuration';
import { IInstantiationService } from '@neditor/core/platform/instantiation/common/instantiation';
import { ServiceCollection } from '@neditor/core/platform/instantiation/common/serviceCollection';
import {
  ILifecycleService,
  LifecyclePhase,
  WillShutdownEvent,
} from '@neditor/core/platform/lifecycle/common/lifecycle';
// import { INotificationService } from '@neditor/core/platform/notification/common/notification';
// import { NotificationService } from '@neditor/core/workbench/services/notification/common/notificationService';
// import { ILogService } from '@neditor/core/platform/log/common/log';
// import { toErrorMessage } from '@neditor/core/base/common/errorMessage';
import { InstantiationService } from '@neditor/core/platform/instantiation/common/instantiationService';
import { Layout } from '@neditor/core/workbench/browser/layout';
// import { IHostService } from '@neditor/core/workbench/services/host/browser/host';
import { getSingletonServiceDescriptors } from '@neditor/core/platform/instantiation/common/extensions';
import { Registry } from '@neditor/core/platform/registry/common/platform';
import { IWorkbenchLayoutService } from '../../platform/workbenchLayout/common/workbenchLayout';
import { IWorkbenchContributionsRegistry, WorkbenchContrib, } from '../common/contributions';
import { mark } from '@neditor/core/base/common/performance';
import { coalesce } from '@neditor/core/base/common/array';
import { isFirefox } from '@neditor/core/base/browser/platform';
import { ILogService } from "@neditor/core/platform/log/common/log";
import WorkbenchApp from "./parts/index.vue";
import { toDisposable } from "../../base/common/lifecycle";
import { createApp } from "vue";
import { Injects } from "./parts/injects";

export interface IWorkbenchOptions {
  /**
   * Extra classes to be added to the workbench container.
   */
  extraClasses?: string[];
}

export class Workbench extends Layout {
  private readonly _onWillShutdown = this._register(new Emitter<WillShutdownEvent>());
  readonly onWillShutdown = this._onWillShutdown.event;

  private readonly _onDidShutdown = this._register(new Emitter<void>());
  readonly onDidShutdown = this._onDidShutdown.event;

  constructor(
    parent: HTMLElement,
    private readonly options: IWorkbenchOptions | undefined,
    private readonly serviceCollection: ServiceCollection,
    logService: ILogService,
  ) {
    super(parent);
  }

  startup(): IInstantiationService {
    try {
      // Configure emitter leak warning threshold
      setGlobalLeakWarningThreshold(175);

      // Services
      const instantiationService = this.initServices(this.serviceCollection);

      instantiationService.invokeFunction((accessor) => {
        const lifecycleService = accessor.get(ILifecycleService);

        this.initLayout(accessor);

        // Registries
        Registry.as<IWorkbenchContributionsRegistry>(WorkbenchContrib).start(accessor);

        // Render Workbench
        this.renderWorkbench(instantiationService);

        // Restore
        this.restore(lifecycleService);

        lifecycleService.phase = LifecyclePhase.Ready;
      });

      return instantiationService;
    } catch (error) {
      onUnexpectedError(error);

      throw error; // rethrow because this is a critical issue we cannot handle properly here
    }
  }

  private initServices(serviceCollection: ServiceCollection): IInstantiationService {
    // Layout Service
    serviceCollection.set(IWorkbenchLayoutService, this);

    // All Contributed Services
    const contributedServices = getSingletonServiceDescriptors();
    for (const [id, descriptor] of contributedServices) {
      serviceCollection.set(id, descriptor);
    }

    const instantiationService = new InstantiationService(serviceCollection);

    // Wrap up
    // instantiationService.invokeFunction((accessor) => {
    //   // TODO@Sandeep debt around cyclic dependencies
    //   const configurationService = accessor.get(IConfigurationService) as any;
    //   if (typeof configurationService.acquireInstantiationService === 'function') {
    //     configurationService.acquireInstantiationService(instantiationService);
    //   }
    // });

    return instantiationService;
  }

  private renderWorkbench(instantiationService: IInstantiationService): void {
    // Add Workbench to DOM
    this.parent.appendChild(this.container);
    const workbenchApp = createApp(WorkbenchApp)
    workbenchApp.provide(Injects.instantiationService, instantiationService)
    workbenchApp.mount(this.container);
    this._register(toDisposable(() => workbenchApp.unmount()))
  }

  private restore(lifecycleService: ILifecycleService): void {
    // Ask each part to restore
    try {
      this.restoreParts();
    } catch (error) {
      onUnexpectedError(error);
    }

    // Transition into restored phase after layout has restored
    // but do not wait indefinitly on this to account for slow
    // editors restoring. Since the workbench is fully functional
    // even when the visible editors have not resolved, we still
    // want contributions on the `Restored` phase to work before
    // slow editors have resolved. But we also do not want fast
    // editors to resolve slow when too many contributions get
    // instantiated, so we find a middle ground solution via
    // `Promise.race`
    this.whenReady.finally(() =>
      Promise.race([this.whenRestored /*, timeout(2000) */]).finally(() => {
        // Set lifecycle phase to `Restored`
        lifecycleService.phase = LifecyclePhase.Restored;

        // Set lifecycle phase to `Eventually` after a short delay and when idle (min 2.5sec, max 5sec)
        const eventuallyPhaseScheduler = this._register(
          new RunOnceScheduler(() => {
            this._register(
              runWhenIdle(() => (lifecycleService.phase = LifecyclePhase.Eventually), 2500),
            );
          }, 2500),
        );
        eventuallyPhaseScheduler.schedule();

        // Update perf marks only when the layout is fully
        // restored. We want the time it takes to restore
        // editors to be included in these numbers

        function markDidStartWorkbench() {
          mark('code/didStartWorkbench');
          performance.measure(
            'perf: workbench create & restore',
            'code/didLoadWorkbenchMain',
            'code/didStartWorkbench',
          );
        }

        if (this.isRestored()) {
          markDidStartWorkbench();
        } else {
          this.whenRestored.finally(() => markDidStartWorkbench());
        }
      }),
    );
  }
}
