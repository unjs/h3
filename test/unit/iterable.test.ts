import { describe, it, expect } from "vitest";
import { serializeIterableValue } from "../../src/utils/internal/iterable";

describe("iterable (unit)", () => {
  describe("serializeIterableValue", () => {
    const exampleDate: Date = new Date(Date.UTC(2015, 6, 21, 3, 24, 54, 888));
    it.each([
      { value: "Hello, world!", output: "Hello, world!" },
      { value: 123, output: "123" },
      { value: 1n, output: "1" },
      { value: true, output: "true" },
      { value: false, output: "false" },
      { value: undefined, output: undefined },
      { value: null, output: "null" },
      { value: exampleDate, output: JSON.stringify(exampleDate) },
      { value: { field: 1 }, output: '{"field":1}' },
      { value: [1, 2, 3], output: "[1,2,3]" },
      { value: () => {}, output: undefined },
      {
        value: Buffer.from("Hello, world!"),
        output: Buffer.from("Hello, world!"),
      },
      { value: Uint8Array.from([1, 2, 3]), output: Uint8Array.from([1, 2, 3]) },
    ])("$value => $output", ({ value, output }) => {
      const serialized = serializeIterableValue(value);
      expect(serialized).toStrictEqual(output);
    });
  });
});
