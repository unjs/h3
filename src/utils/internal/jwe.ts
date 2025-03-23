import { subtle, getRandomValues } from "uncrypto";
import type { JWSHeaderParameters } from "../../types/utils/jwt";

import { textEncoder, textDecoder } from "./encoding";

/**
 * JWE (JSON Web Encryption) implementation for H3 sessions
 */
export interface JWEOptions extends JWSHeaderParameters {
  /** Iteration count for PBKDF2. Defaults to 8192. */
  p2c?: number;
  /** Base64-encoded salt for PBKDF2. */
  p2s?: string;
  /** JWE encryption algorithm. Defaults to "A256GCM". */
  enc?: string;
}

/** The default settings. */
export const defaults: Readonly<
  JWEOptions &
    Pick<Required<JWEOptions>, "p2c" | "alg" | "enc"> & { saltSize: number }
> = /* @__PURE__ */ Object.freeze({
  saltSize: 16,
  p2c: 2048,
  alg: "PBES2-HS256+A128KW",
  enc: "A256GCM",
});

/**
 * Seal (encrypt) data using JWE with AES-GCM and PBES2-HS256+A128KW
 * @param data The data to encrypt
 * @param password The password to use for encryption
 * @param options Optional parameters
 * @returns Promise resolving to the compact JWE token
 */
export async function seal(
  data: string | Uint8Array,
  password: string,
  options: {
    iterations?: number;
    saltSize?: number;
    protectedHeader?: Record<string, any>;
  } = {},
): Promise<string> {
  // Configure options with defaults
  const iterations = options.iterations || defaults.p2c;
  const saltSize = options.saltSize || defaults.saltSize;
  const protectedHeader = options.protectedHeader || {};

  // Convert input data to Uint8Array if it's a string
  const plaintext = typeof data === "string" ? textEncoder.encode(data) : data;

  // Generate random salt for PBES2
  const saltInput = randomBytes(saltSize);

  // Set up the protected header
  const header = {
    alg: "PBES2-HS256+A128KW",
    enc: "A256GCM",
    p2s: base64UrlEncode(saltInput),
    p2c: iterations,
    ...protectedHeader,
  };

  // Encode the protected header
  const encodedHeader = base64UrlEncode(
    textEncoder.encode(JSON.stringify(header)),
  );

  // Derive the key for key wrapping
  const derivedKey = await deriveKeyFromPassword(
    password,
    saltInput,
    iterations,
  );

  // Generate a random Content Encryption Key
  const cek = await subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "wrapKey",
    "unwrapKey",
  ]);

  // Wrap the CEK using the derived key
  const wrappedKey = await subtle.wrapKey("raw", cek, derivedKey, {
    name: "AES-KW",
  });

  // Generate random initialization vector for AES-GCM
  const iv = randomBytes(12);

  // Encrypt the plaintext
  const ciphertext = await subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: textEncoder.encode(encodedHeader),
    },
    cek,
    plaintext,
  );

  // Split the result into ciphertext and authentication tag
  const encrypted = new Uint8Array(ciphertext);
  const tag = encrypted.slice(-16);
  const ciphertextOutput = encrypted.slice(0, -16);

  // Construct the JWE compact serialization
  return [
    encodedHeader,
    base64UrlEncode(new Uint8Array(wrappedKey)),
    base64UrlEncode(iv),
    base64UrlEncode(ciphertextOutput),
    base64UrlEncode(tag),
  ].join(".");
}

/**
 * Decrypts a JWE (JSON Web Encryption) token using password-based encryption.
 *
 * This function implements PBES2-HS256+A128KW for key encryption and A256GCM for content encryption,
 * following the JWE (RFC 7516) specification. It decrypts the token's protected content using the
 * provided password.
 *
 * @param token - The JWE token string in compact serialization format (header.encryptedKey.iv.ciphertext.tag)
 * @param password - The password used to derive the encryption key
 * @returns The decrypted content as a string
 * @throws {Error} If the token uses unsupported algorithms or cannot be decrypted
 * @example
 * ```ts
 * const decrypted = await unseal(jweToken, 'your-secure-password');
 * console.log(decrypted); // Decrypted string content
 * ```
 */
export async function unseal(token: string, password: string): Promise<string>;
/**
 * Decrypts a JWE (JSON Web Encryption) token using password-based encryption.
 *
 * @param token - The JWE token string in compact serialization format
 * @param password - The password used to derive the encryption key
 * @param options - Decryption options
 * @returns The decrypted content as a string or Uint8Array based on options
 */
export async function unseal(
  token: string,
  password: string,
  options: { textOutput: true },
): Promise<string>;
/**
 * Decrypts a JWE (JSON Web Encryption) token using password-based encryption.
 *
 * @param token - The JWE token string in compact serialization format
 * @param password - The password used to derive the encryption key
 * @param options - Decryption options
 * @returns The decrypted content as a Uint8Array
 */
export async function unseal(
  token: string,
  password: string,
  options: { textOutput: false },
): Promise<Uint8Array>;
/**
 * Decrypts a JWE (JSON Web Encryption) token using password-based encryption.
 *
 * @param token - The JWE token string in compact serialization format
 * @param password - The password used to derive the encryption key
 * @param options - Decryption options
 * @returns The decrypted content as a string or Uint8Array based on options
 */
export async function unseal(
  token: string,
  password: string,
  options: {
    /**
     * Whether to return the decrypted data as a string (true) or as a Uint8Array (false).
     * @default true
     */
    textOutput?: boolean;
  } = {},
): Promise<string | Uint8Array> {
  const textOutput = options.textOutput !== false;

  // Split the JWE token
  const [
    encodedHeader,
    encryptedKey,
    encodedIv,
    encodedCiphertext,
    encodedTag,
  ] = token.split(".");

  // Decode the header
  const header = JSON.parse(textDecoder.decode(base64UrlDecode(encodedHeader)));

  // Verify the algorithm and encryption method
  if (header.alg !== "PBES2-HS256+A128KW" || header.enc !== "A256GCM") {
    throw new Error(
      `Unsupported algorithm or encryption: ${header.alg}, ${header.enc}`,
    );
  }

  // Extract PBES2 parameters
  const iterations = header.p2c;
  const saltInput = base64UrlDecode(header.p2s);

  // Derive the key unwrapping key
  const derivedKey = await deriveKeyFromPassword(
    password,
    saltInput,
    iterations,
  );

  // Decode the encrypted key, iv, ciphertext and tag
  const wrappedKey = base64UrlDecode(encryptedKey);
  const iv = base64UrlDecode(encodedIv);
  const ciphertext = base64UrlDecode(encodedCiphertext);
  const tag = base64UrlDecode(encodedTag);

  // Combine ciphertext and authentication tag
  const encryptedData = new Uint8Array(ciphertext.length + tag.length);
  encryptedData.set(ciphertext);
  encryptedData.set(tag, ciphertext.length);

  // Unwrap the CEK
  const cek = await subtle.unwrapKey(
    "raw",
    wrappedKey,
    derivedKey,
    { name: "AES-KW" },
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt", "encrypt", "wrapKey", "unwrapKey"],
  );

  // Decrypt the data
  const decrypted = await subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: textEncoder.encode(encodedHeader),
    },
    cek,
    encryptedData,
  );

  // Return the decrypted data
  return textOutput
    ? textDecoder.decode(new Uint8Array(decrypted))
    : new Uint8Array(decrypted);
}

// Base64 URL encoding/decoding functions
function base64UrlEncode(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return new Uint8Array([...atob(str)].map((c) => c.charCodeAt(0)));
}

// Generate a random Uint8Array of specified length
function randomBytes(length: number): Uint8Array {
  const bytes = getRandomValues(new Uint8Array(length));
  return bytes;
}

// Derive the key for key wrapping/unwrapping
async function deriveKeyFromPassword(
  password: string,
  saltInput: Uint8Array,
  iterations: number,
): Promise<CryptoKey> {
  const baseKey = await subtle.importKey(
    "raw",
    textEncoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );

  // Prepare the salt with algorithm prefix
  const salt = new Uint8Array([
    ...textEncoder.encode("PBES2-HS256+A128KW"),
    0,
    ...saltInput,
  ]);

  return subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations,
    },
    baseKey,
    { name: "AES-KW", length: 128 },
    false,
    ["wrapKey", "unwrapKey"],
  );
}
