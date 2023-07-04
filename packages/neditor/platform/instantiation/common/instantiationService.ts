/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import { IdleValue } from '@neditor/core/base/common/async';
import { illegalState } from '@neditor/core/base/common/errors';
import { SyncDescriptor } from '@neditor/core/platform/instantiation/common/descriptors';
import { Graph } from '@neditor/core/platform/instantiation/common/graph';
import {
  getDependencies,
  IInstantiationService,
  ServiceIdentifier,
  ServicesAccessor,
} from '@neditor/core/platform/instantiation/common/instantiation';
import { ServiceCollection } from '@neditor/core/platform/instantiation/common/serviceCollection';

// TRACING
const _enableTracing = false;

class CyclicDependencyError extends Error {
  constructor(graph: Graph<any>) {
    super('cyclic dependency between services');
    this.message =
      graph.findCycleSlow() ?? `UNABLE to detect cycle, dumping graph: \n${graph.toString()}`;
  }
}

function isSyncDescriptorInstance<T extends any>(
  input: T | SyncDescriptor<T>,
): input is SyncDescriptor<any> {
  if (!input) return false;
  if (!Object.getPrototypeOf(input)) return false;
  return Reflect.has(Object.getPrototypeOf(input).constructor, '__SyncDescriptorBrand');
}

export class InstantiationService implements IInstantiationService {
  declare readonly _serviceBrand: undefined;

  private readonly _services: ServiceCollection;
  private readonly _strict: boolean;
  private readonly _parent?: InstantiationService;

  constructor(
    services: ServiceCollection = new ServiceCollection(),
    strict = false,
    parent?: InstantiationService,
  ) {
    this._services = services;
    this._strict = strict;
    this._parent = parent;

    this._services.set(IInstantiationService, this);
  }

  createChild(services: ServiceCollection): IInstantiationService {
    return new InstantiationService(services, this._strict, this);
  }

  invokeFunction<R, TS extends any[] = []>(
    fn: (accessor: ServicesAccessor, ...args: TS) => R,
    ...args: TS
  ): R {
    const _trace = Trace.traceInvocation(fn);
    let _done = false;
    try {
      const accessor: ServicesAccessor = {
        get: <T>(id: ServiceIdentifier<T>) => {
          if (_done) {
            throw illegalState(
              'service accessor is only valid during the invocation of its target method',
            );
          }

          const result = this._getOrCreateServiceInstance(id, _trace);
          if (!result) {
            throw new Error(`[invokeFunction] unknown service '${id}'`);
          }
          return result;
        },
      };
      return fn(accessor, ...args);
    } finally {
      _done = true;
      _trace.stop();
    }
  }

  createInstance(ctorOrDescriptor: any | SyncDescriptor<any>, ...rest: any[]): any {
    let _trace: Trace;
    let result: any;
    if (isSyncDescriptorInstance(ctorOrDescriptor)) {
      _trace = Trace.traceCreation(ctorOrDescriptor.ctor);
      result = this._createInstance(
        ctorOrDescriptor.ctor,
        ctorOrDescriptor.staticArguments.concat(rest),
        _trace,
      );
    } else {
      _trace = Trace.traceCreation(ctorOrDescriptor);
      result = this._createInstance(ctorOrDescriptor, rest, _trace);
    }
    _trace.stop();
    return result;
  }

  private _createInstance<T>(ctor: any, args: any[] = [], _trace: Trace): T {
    // arguments defined by service decorators
    const serviceDependencies = getDependencies(ctor).sort((a, b) => a.index - b.index);
    const serviceArgs: any[] = [];
    for (const dependency of serviceDependencies) {
      const service = this._getOrCreateServiceInstance(dependency.id, _trace);
      if (!service) {
        this._throwIfStrict(
          `[createInstance] ${ctor.name} depends on UNKNOWN service ${dependency.id}.`,
          false,
        );
      }
      serviceArgs.push(service);
    }

    const firstServiceArgPos =
      serviceDependencies.length > 0 ? serviceDependencies[0].index : args.length;

    // check for argument mismatches, adjust static args if needed
    if (args.length !== firstServiceArgPos) {
      console.trace(
        `[createInstance] First service dependency of ${ctor.name} at position ${
          firstServiceArgPos + 1
        } conflicts with ${args.length} static arguments`,
      );

      const delta = firstServiceArgPos - args.length;
      if (delta > 0) {
        args = args.concat(new Array(delta));
      } else {
        args = args.slice(0, firstServiceArgPos);
      }
    }

    // now create the instance
    // eslint-disable-next-line new-cap
    return <T>new ctor(...[...args, ...serviceArgs]);
  }

  private _setServiceInstance<T>(id: ServiceIdentifier<T>, instance: T): void {
    if (isSyncDescriptorInstance(this._services.get(id))) {
      this._services.set(id, instance);
    } else if (this._parent) {
      this._parent._setServiceInstance(id, instance);
    } else {
      throw new Error('illegalState - setting UNKNOWN service instance');
    }
  }

  private _getServiceInstanceOrDescriptor<T>(id: ServiceIdentifier<T>): T | SyncDescriptor<T> {
    const instanceOrDesc = this._services.get(id);
    if (!instanceOrDesc && this._parent) {
      return this._parent._getServiceInstanceOrDescriptor(id);
    } else {
      return instanceOrDesc;
    }
  }

  protected _getOrCreateServiceInstance<T>(id: ServiceIdentifier<T>, _trace: Trace): T {
    const thing = this._getServiceInstanceOrDescriptor(id);
    if (isSyncDescriptorInstance(thing)) {
      return this._safeCreateAndCacheServiceInstance(id, thing, _trace.branch(id, true));
    } else {
      _trace.branch(id, false);
      return thing;
    }
  }

  private readonly _activeInstantiations = new Set<ServiceIdentifier<any>>();

  private _safeCreateAndCacheServiceInstance<T>(
    id: ServiceIdentifier<T>,
    desc: SyncDescriptor<T>,
    _trace: Trace,
  ): T {
    if (this._activeInstantiations.has(id)) {
      throw new Error(`illegal state - RECURSIVELY instantiating service '${id}'`);
    }
    this._activeInstantiations.add(id);
    try {
      return this._createAndCacheServiceInstance(id, desc, _trace);
    } finally {
      this._activeInstantiations.delete(id);
    }
  }

  private _createAndCacheServiceInstance<T>(
    id: ServiceIdentifier<T>,
    desc: SyncDescriptor<T>,
    _trace: Trace,
  ): T {
    type Triple = { id: ServiceIdentifier<any>; desc: SyncDescriptor<any>; _trace: Trace };
    const graph = new Graph<Triple>((data) => data.id.toString());

    let cycleCount = 0;
    const stack = [{ id, desc, _trace }];
    while (stack.length) {
      const item = stack.pop()!;
      graph.lookupOrInsertNode(item);

      // a weak but working heuristic for cycle checks
      if (cycleCount++ > 1000) {
        throw new CyclicDependencyError(graph);
      }

      // check all dependencies for existence and if they need to be created first
      for (const dependency of getDependencies(item.desc.ctor)) {
        const instanceOrDesc = this._getServiceInstanceOrDescriptor(dependency.id);
        if (!instanceOrDesc) {
          this._throwIfStrict(
            `[createInstance] ${id} depends on ${dependency.id} which is NOT registered.`,
            true,
          );
        }

        if (isSyncDescriptorInstance(instanceOrDesc)) {
          const d = {
            id: dependency.id,
            desc: instanceOrDesc,
            _trace: item._trace.branch(dependency.id, true),
          };
          graph.insertEdge(item, d);
          stack.push(d);
        }
      }
    }

    while (true) {
      const roots = graph.roots();

      // if there is no more roots but still
      // nodes in the graph we have a cycle
      if (roots.length === 0) {
        if (!graph.isEmpty()) {
          throw new CyclicDependencyError(graph);
        }
        break;
      }

      for (const { data } of roots) {
        // Repeat the check for this still being a service sync descriptor. That's because
        // instantiating a dependency might have side-effect and recursively trigger instantiation
        // so that some dependencies are now fullfilled already.
        const instanceOrDesc = this._getServiceInstanceOrDescriptor(data.id);
        if (isSyncDescriptorInstance(instanceOrDesc)) {
          // create instance and overwrite the service collections
          const instance = this._createServiceInstanceWithOwner(
            data.id,
            data.desc.ctor,
            data.desc.staticArguments,
            data.desc.supportsDelayedInstantiation,
            data._trace,
          );
          this._setServiceInstance(data.id, instance);
        }
        graph.removeNode(data);
      }
    }
    return <T>this._getServiceInstanceOrDescriptor(id);
  }

  private _createServiceInstanceWithOwner<T>(
    id: ServiceIdentifier<T>,
    ctor: any,
    args: any[] = [],
    supportsDelayedInstantiation: boolean,
    _trace: Trace,
  ): T {
    if (isSyncDescriptorInstance(this._services.get(id))) {
      return this._createServiceInstance(ctor, args, supportsDelayedInstantiation, _trace);
    } else if (this._parent) {
      return this._parent._createServiceInstanceWithOwner(
        id,
        ctor,
        args,
        supportsDelayedInstantiation,
        _trace,
      );
    } else {
      throw new Error(`illegalState - creating UNKNOWN service instance ${ctor.name}`);
    }
  }

  private _createServiceInstance<T>(
    ctor: any,
    args: any[] = [],
    _supportsDelayedInstantiation: boolean,
    _trace: Trace,
  ): T {
    if (!_supportsDelayedInstantiation) {
      // eager instantiation
      return this._createInstance(ctor, args, _trace);
    } else {
      // Return a proxy object that's backed by an idle value. That
      // strategy is to instantiate services in our idle time or when actually
      // needed but not when injected into a consumer
      const idle = new IdleValue<any>(() => this._createInstance<T>(ctor, args, _trace));
      return <T>new Proxy(Object.create(null), {
        get(target: any, key: PropertyKey): any {
          if (key in target) {
            return target[key];
          }
          const obj = idle.value;
          let prop = obj[key];
          if (typeof prop !== 'function') {
            return prop;
          }
          prop = prop.bind(obj);
          target[key] = prop;
          return prop;
        },
        set(_target: T, p: PropertyKey, value: any): boolean {
          idle.value[p] = value;
          return true;
        },
      });
    }
  }

  private _throwIfStrict(msg: string, printWarning: boolean): void {
    if (printWarning) {
      console.warn(msg);
    }
    if (this._strict) {
      throw new Error(msg);
    }
  }

  get services(): ServicesAccessor {
    const self = this;
    return {
      get(id: ServiceIdentifier<any>) {
        return self.invokeFunction((accessor) => accessor.get(id));
      },
    };
  }

  dispose(): void {}

  store<T>(id: ServiceIdentifier<T>, instance: T): void {
    this._services.set(id, instance);
  }
}

// #region -- tracing ---

const enum TraceType {
  Unknown = -1,
  Creation = 0,
  Invocation = 1,
  Branch = 2,
}

export class Trace {
  private static readonly _None = new (class extends Trace {
    constructor() {
      super(-1, null);
    }

    stop() {}
    branch() {
      return this;
    }
  })();

  static traceInvocation(ctor: any): Trace {
    return !_enableTracing
      ? Trace._None
      : new Trace(
          TraceType.Invocation,
          ctor.name || (ctor.toString() as string).substring(0, 42).replace(/\n/g, ''),
        );
  }

  static traceCreation(ctor: any): Trace {
    return !_enableTracing ? Trace._None : new Trace(TraceType.Creation, ctor.name);
  }

  private static _totals = 0;
  private readonly _start: number = Date.now();
  private readonly _dep: [ServiceIdentifier<any>, boolean, Trace?][] = [];

  private constructor(readonly type: TraceType, readonly name: string | null) {}

  branch(id: ServiceIdentifier<any>, first: boolean): Trace {
    const child = new Trace(TraceType.Branch, id.toString());
    this._dep.push([id, first, child]);
    return child;
  }

  stop() {
    const dur = Date.now() - this._start;
    Trace._totals += dur;

    let causedCreation = false;

    function printChild(n: number, trace: Trace) {
      const res: string[] = [];
      const prefix = new Array(n + 1).join('\t');
      for (const [id, first, child] of trace._dep) {
        if (first && child) {
          causedCreation = true;
          res.push(`${prefix}CREATES -> ${id}`);
          const nested = printChild(n + 1, child);
          if (nested) {
            res.push(nested);
          }
        } else {
          res.push(`${prefix}uses -> ${id}`);
        }
      }
      return res.join('\n');
    }

    const lines = [
      `${this.type === TraceType.Creation ? 'CREATE' : 'CALL'} ${this.name}`,
      `${printChild(1, this)}`,
      `DONE, took ${dur.toFixed(2)}ms (grand total ${Trace._totals.toFixed(2)}ms)`,
    ];

    if (dur > 2 || causedCreation) {
      console.log(lines.join('\n'));
    }
  }
}

// #endregion
