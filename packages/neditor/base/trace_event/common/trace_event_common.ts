let console = {
  log(...args: any[]) {
  },
  time(...args: any[]) {
  },
  timeEnd(...args: any[]) {
  },
};
export function TRACE_EVENT(category_group: string, ...args: any[]) {
  console.log(category_group, ...args);
}
export function TRACE_EVENT0(category_group: string, name: string) {
  console.log(category_group, name);
}
export function TRACE_EVENT1(category_group: string, name: string, arg1: string, arg2: string) {
  console.log(category_group, name, arg1, arg2);
}
export function TRACE_EVENT2(category_group: string, name: string, arg1: string, arg2: unknown, arg3: string, arg4: unknown) {}

export function TRACE_EVENT_BEGIN0(category_group: string, name: string) {
  let label = category_group + ' ' + name;
  console.time(label);
}

export function TRACE_EVENT_END0(category_group: string, name: string) {
  let label = category_group + ' ' + name;
  console.timeEnd(label);
}

export function getFunctionName(klass: any, func: Function): string {
  return `${Reflect.get(klass, 'name')}::${Reflect.get(func, 'name')}`;
}
