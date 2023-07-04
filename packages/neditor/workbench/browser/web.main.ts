import { Disposable, DisposableStore, toDisposable } from "@neditor/core/base/common/lifecycle";
import { IWorkbench, IWorkbenchConstructionOptions } from "./web.api";
import { domContentLoaded } from "@neditor/core/base/browser/dom";
import { ILifecycleService, LifecyclePhase } from "../../platform/lifecycle/common/lifecycle";
import { ServiceCollection } from "@neditor/core/platform/instantiation/common/serviceCollection";
import { Workbench } from "./workbench";
import { BufferLogService } from "@neditor/core/platform/log/common/bufferLog";
import { DEFAULT_LOG_LEVEL, ILogService } from "@neditor/core/platform/log/common/log";
import { IStorageService } from "@neditor/core/platform/storage/common/storage";
import { BrowserStorageService } from "@neditor/core/platform/storage/browser/storageService";
import { onUnexpectedError } from "@neditor/core/base/common/errors";
import { assertIsError } from "@neditor/core/base/common/type";
import { IAnyWorkspaceIdentifier } from "@neditor/core/platform/workspace/common/workspace";
import { ConfigurationService } from '../../platform/configuration/common/configurationService';
import { IConfigurationService } from '../../platform/configuration/common/configuration';

export class BrowserMain extends Disposable {
  private readonly onWillShutdownDisposables = this._register(new DisposableStore());

  constructor(
    private readonly domElement: HTMLElement,
    private readonly configuration: IWorkbenchConstructionOptions,
  ) {
    super();
  }


  async open(): Promise<IWorkbench> {
    // Init services and wait for DOM to be ready in parallel
    const [services] = await Promise.all([this.initServices(), domContentLoaded()]);

    // Create Workbench
    const workbench = new Workbench(
      this.domElement,
      undefined,
      services.serviceCollection,
      services.logService,
    );

    // Listeners
    this.registerListeners(workbench);

    // Startup
    const instantiationService = workbench.startup();
    const lifecycleService = instantiationService.invokeFunction((accessor) =>
      accessor.get<ILifecycleService>(ILifecycleService),
    );

    lifecycleService.when(LifecyclePhase.Restored).then(() => {
      // extensions.forEach((ext) => {
      //   if (isFunction(ext.mount)) {
      //     ext.mount(extAPI);
      //   }
      // });
      lifecycleService.phase = LifecyclePhase.ExtensionActivated;
    });

    // Logging
    // services.logService.trace(
    //   'workbench#open with configuration',
    //   safeStringify(this.configuration),
    // );

    // Return API Facade
    return instantiationService.invokeFunction((accessor) => {
      const lifecycleService = accessor.get(ILifecycleService);

      return {
        shutdown: () => lifecycleService.shutdown(),
      };
    });
  }

  private registerListeners(workbench: Workbench): void {
    // Workbench Lifecycle
    this._register(workbench.onWillShutdown(() => this.onWillShutdownDisposables.clear()));
    this._register(workbench.onDidShutdown(() => this.dispose()));
  }

  private async initServices(): Promise<{
    serviceCollection: ServiceCollection;
    logService: ILogService;
  }> {
    const serviceCollection = new ServiceCollection();

    const payload = this.resolveWorkspaceInitializationPayload();

    const configurationService = new ConfigurationService();
    serviceCollection.set(IConfigurationService, configurationService);

    const logService = new BufferLogService(DEFAULT_LOG_LEVEL);
    serviceCollection.set(ILogService, logService);

    await this.createStorageService(payload, logService).then((service) => {
      // Storage
      serviceCollection.set(IStorageService, service);

      return service;
    })
    return { serviceCollection, logService };
  }

  private async createStorageService(
    payload: IAnyWorkspaceIdentifier,
    logService: ILogService,
  ): Promise<IStorageService> {
    const storageService = new BrowserStorageService(payload, logService);

    try {
      await storageService.initialize();

      // Register to close on shutdown
      this.onWillShutdownDisposables.add(toDisposable(() => storageService.close()));

      return storageService;
    } catch (error) {
      onUnexpectedError(error);
      assertIsError(error);
      logService.error(error);

      return storageService;
    }
  }

  private resolveWorkspaceInitializationPayload(): IAnyWorkspaceIdentifier {
    return { id: 'empty-window' };
  }
}
