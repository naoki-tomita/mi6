import { assertStrictEquals, assertThrows, assertThrowsAsync } from "https://deno.land/std@0.86.0/testing/asserts.ts";
import { createMock, mock } from "./mod.ts";

Deno.test("mi6 > #createMock > can call.", () => {
  const fn = createMock<[string, number], boolean>();
  const bool: boolean = fn("string", 42);
});

Deno.test("mi6 > #createMock > mockReturnValueOnce returns undefined", () => {
  const fn = createMock<[string, boolean], number>();

  assertStrictEquals(fn("any", false), undefined);
});

Deno.test("mi6 > #createMock > mockReturnValueOnce", () => {
  const fn = createMock<[string, boolean], number>();
  fn.mockReturnValueOnce(42);

  assertStrictEquals(fn("any", false), 42);
});

Deno.test("mi6 > #ccreateMock > mockResolveValueOnce", async () => {
  const fn = createMock<[string, boolean], Promise<number>>();
  fn.mockResolveValueOnce(42);

  assertStrictEquals(await fn("any", false), 42);
});

Deno.test("mi6 > #ccreateMock > mockRejectValueOnce", async () => {
  const fn = createMock<[string, boolean], Promise<number>>();
  fn.mockRejectValueOnce(new Error("42"));

  await assertThrowsAsync(() => fn("any", true), Error);
});

Deno.test("mi6 > #createMock > mockReturnValueOnce many time.", () => {
  const fn = createMock<[string, boolean], number>();
  fn.mockReturnValueOnce(12)
    .mockReturnValueOnce(23)
    .mockReturnValueOnce(42);

  assertStrictEquals(fn("foo", true), 12);
  assertStrictEquals(fn("bar", false), 23);
  assertStrictEquals(fn("hoge", true), 42);
  assertThrows(() => fn("aaa", false));
});

Deno.test("mi6 > #createMock > calledWith", () => {
  const fn = createMock<[string, boolean], number>();
  fn.calledWith("foo", false).mockReturnValueOnce(999);
  assertStrictEquals(fn("foo", false), 999);
});

class Instance {
  value: string = "hoge";
}

class FooClass {
  method1(): number { throw Error() }
  method2(arg1: string, arg2: number): string { throw Error() }
  method3(): Instance { throw Error() }
}

Deno.test("mi6 > #mock > mock createable", () => {
  const instance = mock<FooClass>();
  instance.method1.mockReturnValueOnce(123);
  instance.method2.calledWith("foo", 245).mockReturnValueOnce("foo245")
  const x = new Instance();
  instance.method3.calledWith().mockReturnValueOnce(x)

  assertStrictEquals(instance.method1(), 123);
  assertStrictEquals(instance.method2("foo", 245), "foo245");
  assertStrictEquals(instance.method3(), x);
})

Deno.test("mi6 > #mock > mockImplementations", () => {
  const instance = mock<FooClass>();
  instance.method1.mockImplementation(() => {
    return 123;
  });
  assertStrictEquals(instance.method1(), 123);
});

export {};
