import { isNil } from '@neditor/core/base/common/type';
import { SyncDescriptor0 } from './descriptors';
import { IDisposable } from '@neditor/core/base/common/lifecycle';
import { findFirstIndex } from '@neditor/core/base/common/array';
import { ServiceCollection } from './serviceCollection';

let diDependencies: Map<string, IDepDefine[]>;
const diMapKey = '__$$diMap';
if (Reflect.has(globalThis, diMapKey)) {
  diDependencies = Reflect.get(globalThis, diMapKey);
} else {
  const map = new Map();
  diDependencies = map;
  Reflect.set(globalThis, diMapKey, map);
}

let idMap: Map<string, ServiceIdentifier<any>>;
const key = '__$$idMap';
if (Reflect.has(globalThis, key)) {
  idMap = Reflect.get(globalThis, key);
} else {
  const map = new Map<string, ServiceIdentifier<any>>();
  idMap = map;
  Reflect.set(globalThis, key, map);
}

interface IDepDefine {
  id: ServiceIdentifier<any>;
  index: number;
  optional: boolean;
}

export function getDependencies<T extends any>(ctor: Constructor<T>): IDepDefine[] {
  const key = ctor.name;
  return diDependencies.get(key) || [];
}

export type BrandedService = { _serviceBrand: undefined };

export interface IConstructorSignature<T, Args extends any[] = []> {
  new <Services extends BrandedService[]>(...args: [...Args, ...Services]): T;
}

export interface ServicesAccessor {
  get<T>(id: ServiceIdentifier<T>): T;
}

export const IInstantiationService = createDecorator<IInstantiationService>('instantiationService');

export type Constructor<T> = new (...args: any[]) => T;

/**
 * Given a list of arguments as a tuple, attempt to extract the leading, non-service arguments
 * to their own tuple.
 */
export type GetLeadingNonServiceArgs<Args> = Args extends [...BrandedService[]]
  ? []
  : Args extends [infer A, ...BrandedService[]]
  ? [A]
  : Args extends [infer A, ...infer R]
  ? [A, ...GetLeadingNonServiceArgs<R>]
  : never;

export interface IInstantiationService extends IDisposable {
  readonly _serviceBrand: undefined;
  /**
   * Synchronously creates an instance that is denoted by the descriptor
   */
  createInstance<T>(descriptor: SyncDescriptor0<T>): T;
  createInstance<Ctor extends new (...args: any[]) => any, R extends InstanceType<Ctor>>(
    ctor: Ctor,
    ...args: GetLeadingNonServiceArgs<ConstructorParameters<Ctor>>
  ): R;
  createInstance<T, Ctor extends Constructor<T>>(
    id: ServiceIdentifier<T>,
    ...args: GetLeadingNonServiceArgs<ConstructorParameters<Ctor>>
  ): InstanceType<Ctor>;

  store<T>(id: ServiceIdentifier<T>, instance: T): void;

  services: ServicesAccessor;

  invokeFunction<R, TS extends any[] = []>(
    fn: (accessor: ServicesAccessor, ...args: TS) => R,
    ...args: TS
  ): R;

  /**
   * Creates a child of this service which inherits all current services
   * and adds/overwrites the given services.
   */
  createChild(services: ServiceCollection): IInstantiationService;
}

export interface ServiceIdentifier<T> {
  (...args: any[]): void;
  // [brandKey]: string
  type: T;
  // __brand: string;
  // toString(): string;
}

export function isServiceIdentifier(obj: any): boolean {
  return Reflect.has(obj, '__brand');
}

function storeServiceDependency<T>(
  id: ServiceIdentifier<T>,
  target: Constructor<T>,
  index: number,
  optional: boolean,
): void {
  const key = target.name;
  const deps = diDependencies.get(key);
  if (isNil(deps)) {
    diDependencies.set(key, [{ id, index, optional }]);
  } else {
    const prev = findFirstIndex(deps, (dep) => dep.id.toString() === id.toString());
    if (prev === -1) {
      deps.push({ id, index, optional });
    }
  }
}

export function createDecorator<T extends BrandedService>(classId: string): ServiceIdentifier<T> {
  if (idMap.has(classId)) {
    return idMap.get(classId)!;
  }
  const id = <ServiceIdentifier<T>>(
    function (target: Constructor<any>, key: string, index: number): void {
      if (arguments.length !== 3) {
        throw new Error('@IServiceName-decorator can only be used to decorate a parameter');
      }
      storeServiceDependency(id, target, index, false);
    }
  );

  id.toString = function () {
    return classId;
  };
  Reflect.set(id, '__brand', classId);

  idMap.set(classId, id);

  return id;
}

export function refineServiceDecorator<T1, T extends T1>(
  serviceIdentifier: ServiceIdentifier<T1>,
): ServiceIdentifier<T> {
  return <ServiceIdentifier<T>>serviceIdentifier;
}
