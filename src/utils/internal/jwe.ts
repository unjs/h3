import crypto from "uncrypto";
import {
  base64Decode,
  base64Encode,
  textDecoder,
  textEncoder,
} from "./encoding";
import type { JWSHeaderParameters } from "../../types/utils/jwt";

/**
 * JWE (JSON Web Encryption) implementation for H3 sessions
 */
export interface JWEOptions {
  /** Expiration time in milliseconds where 0 means forever. Defaults to 0. */
  ttl: number;
  /** Number of seconds of permitted clock skew for incoming expirations. Defaults to 60 seconds. */
  timestampSkewSec: number;
  /** Local clock time offset in milliseconds. Defaults to 0. */
  localtimeOffsetMsec: number;
  /** Iteration count for PBKDF2. Defaults to 8192. */
  pbkdf2Iterations?: number;
  /** JWE algorithm. Defaults to "PBES2-HS256+A128KW". */
  algorithm: string;
  /** JWE encryption algorithm. Defaults to "A256GCM". */
  encryption: string;
}

/** The default settings. */
export const defaults: Readonly<Required<JWEOptions>> =
  /* @__PURE__ */ Object.freeze({
    ttl: 0,
    timestampSkewSec: 60,
    localtimeOffsetMsec: 0,
    pbkdf2Iterations: 8192,
    algorithm: "PBES2-HS256+A128KW",
    encryption: "A256GCM",
  });

/**
 * Encrypt and serialize data into a JWE token
 */
export async function seal(
  payload: unknown,
  password: string,
  options: Partial<JWEOptions> = {},
): Promise<string> {
  if (!password || typeof password !== "string") {
    throw new Error("Invalid password");
  }

  const opts = { ...defaults, ...options };
  const iterations = opts.pbkdf2Iterations || defaults.pbkdf2Iterations;

  // Prepare payload with metadata
  const payloadWithMeta = createPayloadWithMeta(payload, opts);

  // Generate random values
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Generate encryption keys
  const cek = await generateCEK();
  const passwordDerivedKey = await deriveKeyFromPassword(
    password,
    salt,
    iterations,
  );

  // Create and encode header
  const protectedHeader = createProtectedHeader(salt, iterations);
  const protectedHeaderB64 = base64Encode(JSON.stringify(protectedHeader));

  // Encrypt payload
  const plaintext = textEncoder.encode(JSON.stringify(payloadWithMeta));
  const encryptedData = await encryptData(cek, plaintext, iv);

  // Wrap the CEK with password-derived key
  const wrappedCek = await wrapCEK(cek, passwordDerivedKey);

  // Split ciphertext and authentication tag
  const encryptedDataArray = new Uint8Array(encryptedData);
  const ciphertextLength = encryptedDataArray.length - 16; // Last 16 bytes are the auth tag
  const ciphertext = encryptedDataArray.slice(0, ciphertextLength);
  const tag = encryptedDataArray.slice(ciphertextLength);

  // Format as compact JWE
  return `${protectedHeaderB64}.${base64Encode(wrappedCek)}.${base64Encode(iv)}.${base64Encode(ciphertext)}.${base64Encode(tag)}`;
}

/**
 * Decrypt and verify a JWE token
 */
export async function unseal(
  token: string,
  password: string,
  options: Partial<JWEOptions> = {},
): Promise<unknown> {
  if (!password || typeof password !== "string") {
    throw new Error("Invalid password");
  }

  const opts = { ...defaults, ...options };
  const now = Date.now() + opts.localtimeOffsetMsec;

  // Split the JWE token
  const parts = token.split(".");
  if (parts.length !== 5) {
    throw new Error("Invalid JWE token format");
  }

  const [protectedHeaderB64, encryptedKeyB64, ivB64, ciphertextB64, tagB64] =
    parts;

  // Parse and validate header
  const protectedHeader = parseJWEHeader(protectedHeaderB64);

  // Get parameters from header
  const salt =
    typeof protectedHeader.p2s === "string"
      ? base64Decode(protectedHeader.p2s)
      : new Uint8Array(16);

  const iterations =
    typeof protectedHeader.p2c === "number"
      ? protectedHeader.p2c
      : defaults.pbkdf2Iterations;

  // Decode components
  const encryptedKey = base64Decode(encryptedKeyB64);
  const iv = base64Decode(ivB64);
  const ciphertext = base64Decode(ciphertextB64);
  const tag = base64Decode(tagB64);

  // Combine ciphertext and tag for decryption
  const encryptedData = new Uint8Array(ciphertext.length + tag.length);
  encryptedData.set(ciphertext);
  encryptedData.set(tag, ciphertext.length);

  // Derive key from password
  const passwordDerivedKey = await deriveKeyFromPassword(
    password,
    salt,
    iterations,
  );

  // Unwrap the CEK
  let cek;
  try {
    cek = await unwrapCEK(encryptedKey, passwordDerivedKey);
  } catch {
    throw new Error("Failed to decrypt JWE token: Invalid key");
  }

  // Decrypt the payload
  let decrypted;
  try {
    decrypted = await decryptData(cek, encryptedData, iv);
  } catch {
    throw new Error("Failed to decrypt JWE token: Invalid data");
  }

  // Parse and validate
  let result;
  try {
    result = JSON.parse(textDecoder.decode(decrypted));
  } catch {
    throw new Error("Invalid JWE payload format");
  }

  // Check expiration
  validateExpiration(result.exp, now, opts.timestampSkewSec);

  return result.payload;
}

// Utility functions

/**
 * Creates a payload object with metadata including timestamp and expiration
 */
function createPayloadWithMeta(payload: unknown, opts: JWEOptions) {
  const now = Date.now() + opts.localtimeOffsetMsec;
  return {
    payload,
    iat: now,
    ...(opts.ttl ? { exp: now + opts.ttl } : {}),
  };
}

/**
 * Derives a key from password using PBKDF2
 */
async function deriveKeyFromPassword(
  password: string,
  saltInput: Uint8Array,
  iterations: number,
) {
  const algorithmId = defaults.algorithm;
  // Construct the full salt as per RFC: (UTF8(Alg) || 0x00 || Salt Input)
  const fullSalt = new Uint8Array(algorithmId.length + 1 + saltInput.length);
  fullSalt.set(textEncoder.encode(algorithmId), 0);
  fullSalt.set([0x00], algorithmId.length);
  fullSalt.set(saltInput, algorithmId.length + 1);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: fullSalt,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-KW", length: 128 },
    false,
    ["wrapKey", "unwrapKey"],
  );
}

/**
 * Generates content encryption key
 */
async function generateCEK() {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
}

/**
 * Creates a protected header for JWE
 */
function createProtectedHeader(
  saltInput: Uint8Array,
  iterations: number,
): JWSHeaderParameters {
  return Object.freeze({
    alg: defaults.algorithm,
    enc: defaults.encryption,
    p2s: base64Encode(saltInput),
    p2c: iterations,
    typ: "JWT",
    cty: "application/json",
  });
}

/**
 * Encrypts data using AES-GCM
 */
async function encryptData(cek: CryptoKey, data: Uint8Array, iv: Uint8Array) {
  return crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      tagLength: 128,
    },
    cek,
    data,
  );
}

/**
 * Decrypts data using AES-GCM
 */
async function decryptData(
  cek: CryptoKey,
  encryptedData: Uint8Array,
  iv: Uint8Array,
) {
  return crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
      tagLength: 128,
    },
    cek,
    encryptedData,
  );
}

/**
 * Wraps (encrypts) the Content Encryption Key
 */
async function wrapCEK(cek: CryptoKey, wrappingKey: CryptoKey) {
  return crypto.subtle.wrapKey("raw", cek, wrappingKey, {
    name: "AES-KW",
  });
}

/**
 * Unwraps (decrypts) the Content Encryption Key
 */
async function unwrapCEK(wrappedCek: Uint8Array, wrappingKey: CryptoKey) {
  return crypto.subtle.unwrapKey(
    "raw",
    wrappedCek,
    wrappingKey,
    { name: "AES-KW" },
    { name: "AES-GCM", length: 256 },
    true,
    ["decrypt"],
  );
}

/**
 * Parses and verifies a JWE token's header
 */
function parseJWEHeader(headerB64: string): JWSHeaderParameters {
  try {
    const header = JSON.parse(textDecoder.decode(base64Decode(headerB64)));

    if (
      header.alg !== defaults.algorithm ||
      header.enc !== defaults.encryption
    ) {
      throw new Error("Unsupported JWE algorithms");
    }

    return header;
  } catch {
    throw new Error("Invalid JWE header");
  }
}

/**
 * Validates the expiration of a token
 */
function validateExpiration(exp: unknown, now: number, skew: number) {
  if (exp && typeof exp !== "number") {
    throw new Error("Invalid expiration");
  }

  if (typeof exp === "number" && exp <= now - skew * 1000) {
    throw new Error("Token expired");
  }
}
