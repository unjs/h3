import { describe, it, expect, assert } from "vitest";
import * as JWE from "../../src/utils/internal/jwe";
import { base64Encode } from "../../src/utils/internal/encoding";

const testObject = { a: 1, b: 2, c: [3, 4, 5], d: { e: "f" } };
const password = "some_not_random_password_that_is_also_long_enough";

describe("JWE", () => {
  it("seals and unseals an object correctly", async () => {
    const sealed = await JWE.seal(testObject, password);
    const unsealed = await JWE.unseal(sealed, password);
    assert.deepEqual(unsealed, testObject);
  });

  it("seals and unseals primitive values correctly", async () => {
    // Test with string
    const stringValue = "Just a simple string";
    const sealedString = await JWE.seal(stringValue, password);
    const unsealedString = await JWE.unseal(sealedString, password);
    assert.equal(unsealedString, stringValue);

    // Test with number
    const numberValue = 12_345;
    const sealedNumber = await JWE.seal(numberValue, password);
    const unsealedNumber = await JWE.unseal(sealedNumber, password);
    assert.equal(unsealedNumber, numberValue);

    // Test with boolean
    const boolValue = true;
    const sealedBool = await JWE.seal(boolValue, password);
    const unsealedBool = await JWE.unseal(sealedBool, password);
    assert.equal(unsealedBool, boolValue);

    // Test with null
    const nullValue = null;
    const sealedNull = await JWE.seal(nullValue, password);
    const unsealedNull = await JWE.unseal(sealedNull, password);
    assert.equal(unsealedNull, nullValue);
  });

  it("rejects invalid passwords", async () => {
    const sealed = await JWE.seal(testObject, password);

    await expect(JWE.unseal(sealed, "wrong_password")).rejects.toThrow(
      "Failed to decrypt JWE token",
    );

    await expect(JWE.seal(testObject, "")).rejects.toThrow("Invalid password");

    await expect(JWE.unseal(sealed, "")).rejects.toThrow("Invalid password");
  });

  it("rejects invalid JWE formats", async () => {
    await expect(JWE.unseal("invalid.jwe.token", password)).rejects.toThrow(
      "Invalid JWE token format",
    );

    await expect(
      JWE.unseal("part1.part2.part3.part4.part5.extrastuff", password),
    ).rejects.toThrow("Invalid JWE token format");
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

    await expect(JWE.unseal(tamperedSeal, password)).rejects.toThrow(
      "Failed to decrypt JWE token",
    );

    // Tamper with the tag
    const tamperedTag = [
      parts[0],
      parts[1],
      parts[2],
      parts[3],
      parts[4] + "x", // tamper with tag
    ].join(".");

    await expect(JWE.unseal(tamperedTag, password)).rejects.toThrow(
      "Failed to decrypt JWE token",
    );
  });

  it("rejects invalid JWE header", async () => {
    const sealed = await JWE.seal(testObject, password);
    const parts = sealed.split(".");

    // Replace header with invalid base64
    const invalidHeader = [
      "!@#$%^", // invalid base64
      parts[1],
      parts[2],
      parts[3],
      parts[4],
    ].join(".");

    await expect(JWE.unseal(invalidHeader, password)).rejects.toThrow(
      "Invalid JWE header",
    );
  });

  it("rejects unsupported algorithms", async () => {
    const sealed = await JWE.seal(testObject, password);
    const parts = sealed.split(".");

    // Create a header with unsupported algorithm
    const invalidAlgHeader = base64Encode(
      JSON.stringify({
        alg: "unsupported",
        enc: "A256GCM",
      }),
    );

    const invalidAlgJWE = [
      invalidAlgHeader,
      parts[1],
      parts[2],
      parts[3],
      parts[4],
    ].join(".");

    await expect(JWE.unseal(invalidAlgJWE, password)).rejects.toThrow(
      "Invalid JWE header",
    );
  });

  it("handles complex nested objects", async () => {
    const complexObj = {
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
    };

    const sealed = await JWE.seal(complexObj, password);
    const unsealed = await JWE.unseal(sealed, password);
    assert.deepEqual(unsealed, complexObj);
  });

  it("handles empty objects", async () => {
    const sealed = await JWE.seal({}, password);
    const unsealed = await JWE.unseal(sealed, password);
    assert.deepEqual(unsealed, {});
  });

  it("supports custom headers", async () => {
    const options = {
      kid: "test-key-id",
      customHeader: "custom-value",
    };

    const sealed = await JWE.seal(testObject, password, options);
    const parts = sealed.split(".");

    // Decode the header to verify it contains our custom values
    const headerJson = atob(parts[0]);
    const header = JSON.parse(headerJson);

    assert.equal(header.kid, "test-key-id");
    assert.equal(header.customHeader, "custom-value");

    // Verify we can still decrypt with the custom headers
    const unsealed = await JWE.unseal(sealed, password);
    assert.deepEqual(unsealed, testObject);
  });

  it("allows changing encryption algorithm", async () => {
    const options = {
      enc: "A256GCM", // Same as default, but explicitly set
      p2c: 1024, // Lower iterations for testing
    };

    const sealed = await JWE.seal(testObject, password, options);
    const unsealed = await JWE.unseal(sealed, password, options);
    assert.deepEqual(unsealed, testObject);
  });
});
