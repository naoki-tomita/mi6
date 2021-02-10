import { equal } from "https://deno.land/std@0.86.0/testing/asserts.ts";

interface MockCalled<T extends any[], V> {
  mockReturnValueOnce(returnValue: V): Mock<T, V>;
  mockResolveValueOnce(resolvedValue: V extends Promise<infer U> ? U : never): Mock<T, V>;
  mockRejectValueOnce(rejectedValue: any): Mock<T, V>;
}

interface Mock<T extends any[], V> extends MockCalled<T, V> {
  (...args: T): V;
  calledWith(...args: T): MockCalled<T, V>;
  mock: {
    calls: T[];
  };
}

const DefaultArgs = [Symbol("default args")] as unknown as any;
export function createMock<T extends any[], V>(): Mock<T, V> {
  const stubs: Map<T, V[]> = new Map();
  const calls: T[] = [];
  const MockFn = (...args: T): V => {
    calls.push(args);
    if (stubs.size === 0) {
      return undefined as unknown as any;
    }
    for (const [key, returnValue] of stubs.entries()) {
      if (equal(key, args) && returnValue.length > 0) {
        return returnValue.shift()!;
      }
    }
    for (const [key, returnValue] of stubs.entries()) {
      if (equal(key, DefaultArgs) && returnValue.length > 0) {
        return returnValue.shift()!;
      }
    }
    throw Error(`Not matched arguments. ${args.map(it => JSON.stringify(it)).join(", ")}`);
  };
  MockFn.mock = { calls };
  const Mock: Mock<T, V> = MockFn as any;

  const calledWith = Mock.calledWith = (...args): MockCalled<T, V> => {
    return {
      mockReturnValueOnce(returnValue) {
        stubs.set(args, stubs.get(args) ?? []);
        stubs.get(args)!.push(returnValue);
        return Mock;
      },
      mockResolveValueOnce(resolvedValue) {
        stubs.set(args, stubs.get(args) ?? []);
        stubs.get(args)!.push(Promise.resolve(resolvedValue) as unknown as V);
        return Mock;
      },
      mockRejectValueOnce(rejectedValue) {
        stubs.set(args, stubs.get(args) ?? []);
        stubs.get(args)!.push(Promise.reject(rejectedValue) as unknown as V);
        return Mock;
      }
    };
  };

  const {
    mockReturnValueOnce,
    mockResolveValueOnce,
    mockRejectValueOnce,
  } = calledWith(...DefaultArgs);

  Mock.mockReturnValueOnce = mockReturnValueOnce;
  Mock.mockResolveValueOnce = mockResolveValueOnce;
  Mock.mockRejectValueOnce = mockRejectValueOnce;
  return Mock;
}

type Instance = {
  [key: string]: (...args: any[]) => any;
}
type MockInstance<T extends Instance> = {
  [key in keyof T]: Mock<Parameters<T[key]>, ReturnType<T[key]>>;
}

const CHARS = "abcdefghijklmnopqrstuvwxyz";
function id() {
  return Array(5).fill(null).map(() => Math.floor(Math.random() * CHARS.length)).join("");
}
export function mock<T extends {}>(): T & MockInstance<T> {
  const inner = {} as any;
  return new Proxy({__id__: `#${id()}`}, {
    get(_, key, __) {
      return inner[key] = inner[key] ?? createMock();
    }
  }) as any;
}
