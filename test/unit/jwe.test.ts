import { describe, it, expect, assert } from "vitest";
import * as JWE from "../../src/utils/internal/jwe";

const testObject = { a: 1, b: 2, c: [3, 4, 5], d: { e: "f" } };
const password = "some_not_random_password_that_is_also_long_enough";

describe("JWE", () => {
  it("seals and unseals an object correctly", async () => {
    const sealed = await JWE.seal(testObject, password);
    const unsealed = await JWE.unseal(sealed, password);
    assert.deepEqual(unsealed, testObject);
  });

  it("handles expiration correctly", async () => {
    // Set a 100ms expiration
    const options = { ttl: 100 };
    const sealed = await JWE.seal(testObject, password, options);

    // Should work immediately
    const unsealed = await JWE.unseal(sealed, password, options);
    assert.deepEqual(unsealed, testObject);

    // Should fail after expiration
    await new Promise((resolve) => setTimeout(resolve, 110));
    await expect(JWE.unseal(sealed, password, options)).rejects.toThrow(
      "Token expired",
    );
  });

  it("handles time offset correctly", async () => {
    // Set a 100ms expiration with time offset into the future
    const options = { ttl: 100, localtimeOffsetMsec: 200 };
    const sealed = await JWE.seal(testObject, password, options);

    // Should work with the same offset
    const unsealed = await JWE.unseal(sealed, password, options);
    assert.deepEqual(unsealed, testObject);

    // Should fail with a different offset that puts us past expiration
    await expect(
      JWE.unseal(sealed, password, { ttl: 100, localtimeOffsetMsec: 300 }),
    ).rejects.toThrow("Token expired");
  });

  it("handles timestamp skew correctly", async () => {
    // Set a very short expiration
    const options = { ttl: 1 };
    const sealed = await JWE.seal(testObject, password, options);

    // Wait for expiration
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Should still work with increased skew tolerance
    const unsealed = await JWE.unseal(sealed, password, {
      ...options,
      timestampSkewSec: 10,
    });
    assert.deepEqual(unsealed, testObject);
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
      "Unsupported JWE algorithms",
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
});

// Helper function for encoding
function base64Encode(input: string): string {
  return btoa(input).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
