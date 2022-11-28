import { describe, it, expect } from "vitest";
import { fromNodeMiddleware } from "../src";

/**
 * This test file is a collection of runtime tests that can be triggered by users
 * not using TypeScript or abusing TypeScript's casting abilities
 *
 * The only reason why it is a TypeScript file is because I don't want to introduce
 * test that are already covered by type checking
 */

function throws (fn: (...args: never[]) => unknown, error: Parameters<ReturnType<typeof expect>["to"]["match"]>[0]) {
  expect(() => fn()).to.throw(error);
}

describe("runtime", () => {
  describe("src", () => {
    describe("node", () => {
      it("fromNodeMiddleware", () => {
        // @ts-expect-error
        throws(() => fromNodeMiddleware(1), /function/);

        // @ts-expect-error
        throws(() => fromNodeMiddleware({}), /function/);
      });
    });
  });
});
