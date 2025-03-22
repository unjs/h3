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
export interface JWEOptions extends JWSHeaderParameters {
  /** Iteration count for PBKDF2. Defaults to 8192. */
  p2c?: number;
  /** JWE algorithm. Defaults to "PBES2-HS256+A128KW". */
  alg?: string;
  /** JWE encryption algorithm. Defaults to "A256GCM". */
  enc?: string;
}

/** The default settings. */
export const defaults: Readonly<
  JWEOptions & Pick<Required<JWEOptions>, "p2c" | "alg" | "enc">
> = /* @__PURE__ */ Object.freeze({
  p2c: 8192,
  alg: "PBES2-HS256+A128KW",
  enc: "A256GCM",
});

/**
 * Encrypt and serialize data into a JWE token
 */
export async function seal(
  payload: any,
  password: string,
  options: Partial<JWEOptions> = {},
): Promise<string> {
  if (!password || typeof password !== "string") {
    throw new Error("Invalid password");
  }

  const opts = { ...defaults, ...options };
  const iterations = opts.p2c;

  // Generate random values
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Generate encryption keys
  const cek = await generateCEK();
  const passwordDerivedKey = await deriveKeyFromPassword(
    password,
    salt,
    iterations,
    opts.alg,
  );

  // Create and encode header
  const protectedHeader = createProtectedHeader(salt, iterations, opts);
  const protectedHeaderB64 = base64Encode(JSON.stringify(protectedHeader));

  // Serialize and encrypt payload
  const plaintext = textEncoder.encode(JSON.stringify(payload));
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
): Promise<any> {
  if (!password || typeof password !== "string") {
    throw new Error("Invalid password");
  }

  const opts = { ...defaults, ...options };

  // Split the JWE token
  const parts = token.split(".");
  if (parts.length !== 5) {
    throw new Error("Invalid JWE token format");
  }

  const [protectedHeaderB64, encryptedKeyB64, ivB64, ciphertextB64, tagB64] =
    parts;

  // Parse and validate header
  const protectedHeader = parseJWEHeader(protectedHeaderB64, opts);

  // Get parameters from header
  const salt =
    typeof protectedHeader.p2s === "string"
      ? base64Decode(protectedHeader.p2s)
      : new Uint8Array(16);

  const iterations =
    typeof protectedHeader.p2c === "number" ? protectedHeader.p2c : opts.p2c;

  // Decode components
  const encryptedKey = base64Decode(encryptedKeyB64);
  const iv = base64Decode(ivB64);
  const ciphertext = base64Decode(ciphertextB64);
  const tag = base64Decode(tagB64);

  // Verify the original base64 matches the re-encoded data to detect tampering
  if (
    base64Encode(ciphertext) !== ciphertextB64 ||
    base64Encode(tag) !== tagB64
  ) {
    throw new Error("Failed to decrypt JWE token: Token has been tampered");
  }

  // Combine ciphertext and tag for decryption
  const encryptedData = new Uint8Array(ciphertext.length + tag.length);
  encryptedData.set(ciphertext);
  encryptedData.set(tag, ciphertext.length);

  // Derive key from password
  const passwordDerivedKey = await deriveKeyFromPassword(
    password,
    salt,
    iterations,
    protectedHeader.alg as string,
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

  // Parse the decrypted data
  try {
    return JSON.parse(textDecoder.decode(decrypted));
  } catch {
    throw new Error("Invalid JWE payload format");
  }
}

// Utility functions

/**
 * Derives a key from password using PBKDF2
 */
async function deriveKeyFromPassword(
  password: string,
  saltInput: Uint8Array,
  iterations: number,
  alg: string,
) {
  // Construct the full salt as per RFC: (UTF8(Alg) || 0x00 || Salt Input)
  const fullSalt = new Uint8Array(alg.length + 1 + saltInput.length);
  fullSalt.set(textEncoder.encode(alg), 0);
  fullSalt.set([0x00], alg.length);
  fullSalt.set(saltInput, alg.length + 1);

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
  options: JWEOptions,
): JWSHeaderParameters {
  return {
    ...options,
    alg: options.alg,
    enc: options.enc,
    p2s: base64Encode(saltInput),
    p2c: iterations,
    typ: "JWT",
  };
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
function parseJWEHeader(
  headerB64: string,
  options: JWEOptions,
): JWSHeaderParameters {
  try {
    const header = JSON.parse(textDecoder.decode(base64Decode(headerB64)));

    if (header.alg !== options.alg || header.enc !== options.enc) {
      throw new Error("Unsupported JWE algorithms");
    }

    return header;
  } catch {
    throw new Error("Invalid JWE header");
  }
}
