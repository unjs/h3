import { describe, it, expect, assert } from "vitest";
import * as JWE from "../../src/utils/internal/jwe";
import { base64Encode } from "../../src/utils/internal/encoding";

const testObject = JSON.stringify({ a: 1, b: 2, c: [3, 4, 5], d: { e: "f" } });
const password = "some_not_random_password_that_is_also_long_enough";

describe("JWE", () => {
  it("seals and unseals data correctly", async () => {
    const sealed = await JWE.seal(testObject, password);
    const unsealed = await JWE.unseal(sealed, password);
    assert.equal(unsealed, testObject);
  });

  it("should accept Uint8Array as password", async () => {
    const sealed = await JWE.seal(
      testObject,
      new TextEncoder().encode(password),
    );
    const unsealed = await JWE.unseal(
      sealed,
      new TextEncoder().encode(password),
    );
    assert.equal(unsealed, testObject);
  });

  it("should reject if missing password", async () => {
    await expect(JWE.seal(testObject, "")).rejects.toThrow();
    await expect(JWE.unseal("", "")).rejects.toThrow();
  });

  it("seals and unseals primitive values correctly", async () => {
    // Test with string
    const stringValue = "Just a simple string";
    const sealedString = await JWE.seal(stringValue, password);
    const unsealedString = await JWE.unseal(sealedString, password);
    assert.equal(unsealedString, stringValue);

    // Test with numbers and other types (need to be stringified first)
    const numberValue = "12345"; // As string
    const sealedNumber = await JWE.seal(numberValue, password);
    const unsealedNumber = await JWE.unseal(sealedNumber, password);
    assert.equal(unsealedNumber, numberValue);

    // Test with boolean as string
    const boolValue = "true"; // As string
    const sealedBool = await JWE.seal(boolValue, password);
    const unsealedBool = await JWE.unseal(sealedBool, password);
    assert.equal(unsealedBool, boolValue);

    // Test with null as string
    const nullValue = "null"; // As string
    const sealedNull = await JWE.seal(nullValue, password);
    const unsealedNull = await JWE.unseal(sealedNull, password);
    assert.equal(unsealedNull, nullValue);
  });

  it("works with Uint8Array data", async () => {
    const uint8Data = new TextEncoder().encode("Hello, world!");
    const sealed = await JWE.seal(uint8Data, password);
    const unsealed = await JWE.unseal(sealed, password, { textOutput: false });

    // Compare byte arrays
    assert.instanceOf(unsealed, Uint8Array);
    assert.equal(
      new TextDecoder().decode(unsealed as Uint8Array),
      "Hello, world!",
    );
  });

  it("rejects invalid passwords", async () => {
    const sealed = await JWE.seal(testObject, password);

    await expect(JWE.unseal(sealed, "wrong_password")).rejects.toThrow();
  });

  it("rejects invalid JWE formats", async () => {
    await expect(JWE.unseal("invalid.jwe.token", password)).rejects.toThrow();

    await expect(
      JWE.unseal("part1.part2.part3.part4.part5.extrastuff", password),
    ).rejects.toThrow();
  });

  it("rejects tampered tokens", async () => {
    const sealed = await JWE.seal(testObject, password);
    const parts = sealed.split(".");

    // Tamper with the ciphertext
    const tamperedSeal = [
      parts[0],
      parts[1],
      parts[2],
      parts[3] + "x", // tamper with ciphertext
      parts[4],
    ].join(".");

    await expect(JWE.unseal(tamperedSeal, password)).rejects.toThrow();

    // Tamper with the tag
    const tamperedTag = [
      parts[0],
      parts[1],
      parts[2],
      parts[3],
      parts[4] + "x", // tamper with tag
    ].join(".");

    await expect(JWE.unseal(tamperedTag, password)).rejects.toThrow();
  });

  it("rejects unsupported algorithms", async () => {
    const sealed = await JWE.seal(testObject, password);
    const parts = sealed.split(".");

    // Create a header with unsupported algorithm
    const invalidAlgHeader = base64Encode(
      new TextEncoder().encode(
        JSON.stringify({
          alg: "unsupported",
          enc: "A256GCM",
        }),
      ),
    );

    const invalidAlgJWE = [
      invalidAlgHeader,
      parts[1],
      parts[2],
      parts[3],
      parts[4],
    ].join(".");

    await expect(JWE.unseal(invalidAlgJWE, password)).rejects.toThrow(
      "Unsupported algorithm or encryption",
    );
  });

  it("handles complex nested objects as strings", async () => {
    const complexObj = JSON.stringify({
      array: [1, 2, 3, 4, 5],
      nested: {
        a: { b: { c: { d: { e: "deep" } } } },
        arr: [
          [1, 2],
          [3, 4],
        ],
      },
      date: new Date().toISOString(),
      nullValue: null,
      booleans: [true, false],
    });

    const sealed = await JWE.seal(complexObj, password);
    const unsealed = await JWE.unseal(sealed, password);
    assert.equal(unsealed, complexObj);
  });

  it("handles empty strings", async () => {
    const sealed = await JWE.seal("", password);
    const unsealed = await JWE.unseal(sealed, password);
    assert.equal(unsealed, "");
  });

  it("supports custom headers", async () => {
    const options = {
      protectedHeader: {
        kid: "test-key-id",
        customHeader: "custom-value",
      },
    };

    const sealed = await JWE.seal(testObject, password, options);
    const parts = sealed.split(".");

    // Decode the header to verify it contains our custom values
    const headerJson = atob(parts[0].replace(/-/g, "+").replace(/_/g, "/"));
    const header = JSON.parse(headerJson);

    assert.equal(header.kid, "test-key-id");
    assert.equal(header.customHeader, "custom-value");

    // Verify we can still decrypt with the custom headers
    const unsealed = await JWE.unseal(sealed, password);
    assert.equal(unsealed, testObject);
  });

  it("allows changing iteration count", async () => {
    const options = {
      iterations: 1024, // Lower iterations for testing
    };

    const sealed = await JWE.seal(testObject, password, options);
    const unsealed = await JWE.unseal(sealed, password);
    assert.equal(unsealed, testObject);
  });

  it("allows changing salt size", async () => {
    const options = {
      saltSize: 32, // Larger salt size
    };

    const sealed = await JWE.seal(testObject, password, options);
    const unsealed = await JWE.unseal(sealed, password);
    assert.equal(unsealed, testObject);
  });
});
