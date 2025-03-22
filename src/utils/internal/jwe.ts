import crypto from "uncrypto";
import {
  base64Decode,
  base64Encode,
  textDecoder,
  textEncoder,
} from "./encoding";

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
}

export const DEFAULT_JWE_OPTIONS: JWEOptions = {
  ttl: 0,
  timestampSkewSec: 60,
  localtimeOffsetMsec: 0,
};

export interface JWEHeader {
  alg: string;
  enc: string;
}

export interface JWESegments {
  protected: string;
  iv: string;
  ciphertext: string;
  tag: string;
}

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

  const opts = { ...DEFAULT_JWE_OPTIONS, ...options };
  const now = Date.now() + opts.localtimeOffsetMsec;

  // Add expiration if ttl is provided
  const payloadWithMeta = {
    payload,
    iat: now,
    ...(opts.ttl ? { exp: now + opts.ttl } : {}),
  };

  // Generate a random IV and salt
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Key derivation
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"],
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );

  // Create protected header
  const protectedHeader: JWEHeader = {
    alg: "PBES2-HS256+A128KW",
    enc: "A256GCM",
  };

  const protectedHeaderB64 = base64Encode(JSON.stringify(protectedHeader));

  // Encrypt payload
  const plaintext = textEncoder.encode(JSON.stringify(payloadWithMeta));
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      tagLength: 128,
    },
    key,
    plaintext,
  );

  // Split ciphertext and authentication tag
  const encryptedDataArray = new Uint8Array(encryptedData);
  const ciphertextLength = encryptedDataArray.length - 16; // Last 16 bytes are the auth tag
  const ciphertext = encryptedDataArray.slice(0, ciphertextLength);
  const tag = encryptedDataArray.slice(ciphertextLength);

  // Format as compact JWE: header.salt.iv.ciphertext.tag
  return `${protectedHeaderB64}.${base64Encode(salt)}.${base64Encode(iv)}.${base64Encode(ciphertext)}.${base64Encode(tag)}`;
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

  const opts = { ...DEFAULT_JWE_OPTIONS, ...options };
  const now = Date.now() + opts.localtimeOffsetMsec;

  // Split the JWE token
  const parts = token.split(".");
  if (parts.length !== 5) {
    throw new Error("Invalid JWE token format");
  }

  const [protectedHeaderB64, saltB64, ivB64, ciphertextB64, tagB64] = parts;

  // Decode and validate protected header
  let protectedHeader: JWEHeader;
  try {
    protectedHeader = JSON.parse(
      textDecoder.decode(base64Decode(protectedHeaderB64)),
    ) as JWEHeader;
  } catch {
    throw new Error("Invalid JWE header");
  }

  if (
    protectedHeader.alg !== "PBES2-HS256+A128KW" ||
    protectedHeader.enc !== "A256GCM"
  ) {
    throw new Error("Unsupported JWE algorithms");
  }

  // Reconstruct the key
  const salt = base64Decode(saltB64);
  const iv = base64Decode(ivB64);
  const ciphertext = base64Decode(ciphertextB64);
  const tag = base64Decode(tagB64);

  // Combine ciphertext and tag for decryption
  const encryptedData = new Uint8Array(ciphertext.length + tag.length);
  encryptedData.set(ciphertext);
  encryptedData.set(tag, ciphertext.length);

  // Derive key
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"],
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );

  // Decrypt
  let decrypted;
  try {
    decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
        tagLength: 128,
      },
      key,
      encryptedData,
    );
  } catch {
    throw new Error("Failed to decrypt JWE token");
  }

  // Parse and validate
  let result;
  try {
    result = JSON.parse(textDecoder.decode(decrypted));
  } catch {
    throw new Error("Invalid JWE payload format");
  }

  // Check expiration
  if (result.exp && typeof result.exp !== "number") {
    throw new Error("Invalid expiration");
  }

  if (result.exp && result.exp <= now - opts.timestampSkewSec * 1000) {
    throw new Error("Token expired");
  }

  return result.payload;
}
