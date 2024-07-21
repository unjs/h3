/**
Based on https://github.com/brc-dd/iron-webcrypto/tree/v1.2.1
Copyright (c) 2021 Divyansh Singh.
https://github.com/brc-dd/iron-webcrypto/blob/v1.2.1/LICENSE.md

Based on https://github.com/hapijs/iron/tree/v7.0.1
Copyright (c) 2012-2022, Project contributors Copyright (c) 2012-2020, Sideway Inc All rights reserved.
https://github.com/hapijs/iron/blob/v7.0.1/LICENSE.md

Base64 encoding based on https://github.com/denoland/std/tree/main/encoding (without padding)
Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
https://github.com/denoland/std/blob/main/LICENSE
 */

import crypto from "uncrypto"; // Node.js 18 support

/** The default encryption and integrity settings. */
export const defaults: Readonly<SealOptions> = /* @__PURE__ */ Object.freeze({
  ttl: 0,
  timestampSkewSec: 60,
  localtimeOffsetMsec: 0,
  encryption: /* @__PURE__ */ Object.freeze({
    saltBits: 256,
    algorithm: "aes-256-cbc",
    iterations: 1,
    minPasswordlength: 32,
  }),
  integrity: /* @__PURE__ */ Object.freeze({
    saltBits: 256,
    algorithm: "sha256",
    iterations: 1,
    minPasswordlength: 32,
  }),
});

/** Configuration of each supported algorithm. */
export const algorithms = /* @__PURE__ */ Object.freeze({
  "aes-128-ctr": /* @__PURE__ */ Object.freeze({
    keyBits: 128,
    ivBits: 128,
    name: "AES-CTR",
  }),
  "aes-256-cbc": /* @__PURE__ */ Object.freeze({
    keyBits: 256,
    ivBits: 128,
    name: "AES-CBC",
  }),
  sha256: /* @__PURE__ */ Object.freeze({
    keyBits: 256,
    ivBits: 128,
    name: "SHA-256",
  }),
});

/** MAC normalization format version. */
export const macFormatVersion = "2";

/** MAC normalization prefix. */
export const macPrefix = "Fe26.2"; // `Fe26.${macFormatVersion}`

/** Serializes, encrypts, and signs objects into an iron protocol string. */
export async function seal(
  object: Readonly<unknown>,
  password: Readonly<RawPassword>,
  opts: Readonly<SealOptions>,
): Promise<string> {
  const now = Date.now() + (opts.localtimeOffsetMsec || 0);

  if (!password) {
    throw new Error("Empty password");
  }
  const { id = "", encryption, integrity } = normalizePassword(password);
  if (id && !/^\w+$/.test(id)) {
    throw new Error("Invalid password id");
  }

  // prettier-ignore
  const { encrypted, key } = await encrypt(encryption, opts.encryption, JSON.stringify(object));

  const encryptedB64 = encodeBase64Url(encrypted);
  const iv = encodeBase64Url(key.iv);
  const expiration = opts.ttl ? now + opts.ttl : "";
  const macBaseString = `${macPrefix}*${id}*${key.salt}*${iv}*${encryptedB64}*${expiration}`;

  const mac = await hmacWithPassword(integrity, opts.integrity, macBaseString);
  const sealed = `${macBaseString}*${mac.salt}*${mac.digest}`;
  return sealed;
}

/** Verifies, decrypts, and reconstruct an iron protocol string into an object. */
export async function unseal(
  sealed: string,
  password: Password | PasswordHash,
  opts: Readonly<SealOptions>,
): Promise<unknown> {
  const now = Date.now() + (opts.localtimeOffsetMsec || 0);

  if (!password) {
    throw new Error("Empty password");
  }

  const parts = sealed.split("*");
  if (parts.length !== 8) {
    throw new Error("Incorrect number of sealed components");
  }
  // prettier-ignore
  const [prefix, passwordId, encryptionSalt, encryptionIv, encryptedB64, expiration, hmacSalt, hmac] = parts;
  const macBaseString = `${prefix}*${passwordId}*${encryptionSalt}*${encryptionIv}*${encryptedB64}*${expiration}`;

  if (macPrefix !== prefix) {
    throw new Error("Wrong mac prefix");
  }

  if (expiration) {
    if (!/^\d+$/.test(expiration)) {
      throw new Error("Invalid expiration");
    }
    const exp = Number.parseInt(expiration, 10);
    if (exp <= now - opts.timestampSkewSec * 1000) {
      throw new Error("Expired seal");
    }
  }

  let pass: RawPassword = "";
  const _passwordId = passwordId || "default";
  if (typeof password === "string" || password instanceof Uint8Array) {
    pass = password;
  } else if (_passwordId in password) {
    pass = password[_passwordId]!;
  } else {
    throw new Error(`Cannot find password: ${_passwordId}`);
  }

  pass = normalizePassword(pass);

  // prettier-ignore
  const mac = await hmacWithPassword(pass.integrity, { ...opts.integrity, salt: hmacSalt }, macBaseString);

  if (!fixedTimeComparison(mac.digest, hmac)) {
    throw new Error("Bad hmac value");
  }

  const encrypted = decodeBase64Url(encryptedB64);

  const decryptOptions: GenerateKeyOptions<EncryptionAlgorithm> = {
    ...opts.encryption,
    salt: encryptionSalt,
    iv: decodeBase64Url(encryptionIv),
  };

  const decrypted = await decrypt(pass.encryption, decryptOptions, encrypted);

  return decrypted ? JSON.parse(decrypted) : null;
}

// --- hmac ---

/** Calculates a HMAC digest. */
export async function hmacWithPassword(
  password: Readonly<Password>,
  options: Readonly<GenerateKeyOptions<IntegrityAlgorithm>>,
  data: string,
): Promise<HMacResult> {
  const key = await generateKey(password, { ...options, hmac: true });
  const textBuffer = stringToUint8Array(data);
  // prettier-ignore
  const signed = await crypto.subtle.sign({ name: "HMAC" }, key.key, textBuffer);
  const digest = encodeBase64Url(new Uint8Array(signed));
  return { digest, salt: key.salt };
}

// --- key generation ---

/** Generates a key from the password. */
export async function generateKey(
  password: Password,
  options: GenerateKeyOptions,
): Promise<Key> {
  if (!password?.length) {
    throw new Error("Empty password");
  }

  if (options == null || typeof options !== "object")
    throw new Error("Bad options");
  if (!(options.algorithm in algorithms))
    throw new Error(`Unknown algorithm: ${options.algorithm}`);

  const algorithm = algorithms[options.algorithm];

  let resultKey: Key["key"];
  let resultSalt: Key["salt"];
  let resultIV: Key["iv"];

  const hmac = options.hmac ?? false;
  // prettier-ignore
  const id = hmac ? { name: "HMAC", hash: algorithm.name } : { name: algorithm.name };
  const usage: KeyUsage[] = hmac ? ["sign", "verify"] : ["encrypt", "decrypt"];

  if (typeof password === "string") {
    if (password.length < options.minPasswordlength) {
      throw new Error(
        `Password string too short (min ${options.minPasswordlength} characters required)`,
      );
    }
    let { salt = "" } = options;
    if (!salt) {
      const { saltBits = 0 } = options;
      if (!saltBits) throw new Error("Missing salt and saltBits options");
      const randomSalt = randomBits(saltBits);
      salt = [...new Uint8Array(randomSalt)]
        .map((x) => x.toString(16).padStart(2, "0"))
        .join("");
    }

    // prettier-ignore
    const derivedKey = await pbkdf2(password, salt, options.iterations, algorithm.keyBits / 8, "SHA-1");
    // prettier-ignore
    const importedEncryptionKey = await crypto.subtle.importKey("raw", derivedKey, id, false, usage);
    resultKey = importedEncryptionKey;
    resultSalt = salt;
  } else {
    if (password.length < algorithm.keyBits / 8) {
      throw new Error("Key buffer (password) too small");
    }
    // prettier-ignore
    resultKey = await crypto.subtle.importKey("raw", password, id, false, usage);
    resultSalt = "";
  }

  if (options.iv) {
    resultIV = options.iv;
  } else if ("ivBits" in algorithm) {
    resultIV = randomBits(algorithm.ivBits);
  } else {
    console.log(algorithm);
    throw new Error("Missing IV");
  }

  return <Key>{
    key: resultKey,
    salt: resultSalt,
    iv: resultIV,
  };
}

/** Provides an asynchronous Password-Based Key Derivation Function 2 (PBKDF2) implementation. */
async function pbkdf2(
  password: string,
  salt: string,
  iterations: number,
  keyLength: number,
  hash: HashAlgorithmIdentifier,
): Promise<ArrayBuffer> {
  const passwordBuffer = stringToUint8Array(password);
  // prettier-ignore
  const importedKey = await crypto.subtle.importKey("raw", passwordBuffer, { name: "PBKDF2" }, false, ["deriveBits"]);
  const saltBuffer = stringToUint8Array(salt);
  const params = { name: "PBKDF2", hash, salt: saltBuffer, iterations };
  // prettier-ignore
  const derivation = await crypto.subtle.deriveBits(params, importedKey, keyLength * 8);
  return derivation;
}

// --- encrypt/decrypt ---

export async function encrypt(
  password: Password,
  options: GenerateKeyOptions<EncryptionAlgorithm>,
  data: string,
): Promise<{ encrypted: Uint8Array; key: Key }> {
  const key = await generateKey(password, options);
  const encrypted = await crypto.subtle.encrypt(
    ...getEncryptParams(options.algorithm, key, data),
  );
  return { encrypted: new Uint8Array(encrypted), key };
}

export async function decrypt(
  password: Password,
  options: GenerateKeyOptions<EncryptionAlgorithm>,
  data: Uint8Array | string,
): Promise<string> {
  const key = await generateKey(password, options);
  const decrypted = await crypto.subtle.decrypt(
    ...getEncryptParams(options.algorithm, key, data),
  );
  return bufferToString(new Uint8Array(decrypted));
}

function getEncryptParams(
  algorithm: EncryptionAlgorithm,
  key: Key,
  data: Uint8Array | string,
): [AesCbcParams | AesCtrParams, CryptoKey, Uint8Array] {
  return [
    algorithm === "aes-128-ctr"
      ? ({
          name: "AES-CTR",
          counter: key.iv,
          length: 128,
        } satisfies AesCtrParams)
      : ({ name: "AES-CBC", iv: key.iv } satisfies AesCbcParams),
    key.key,
    typeof data === "string" ? stringToUint8Array(data) : data,
  ];
}

// --- other utils ---

/** Returns true if `a` is equal to `b`, without leaking timing information that would allow an attacker to guess one of the values. */
function fixedTimeComparison(a: string, b: string): boolean {
  let mismatch = a.length === b.length ? 0 : 1;
  if (mismatch) b = a;
  for (let i = 0; i < a.length; i += 1)
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i); // eslint-disable-line unicorn/prefer-code-point
  return mismatch === 0;
}

/** Normalizes a password parameter. */
function normalizePassword(password: RawPassword) {
  if (typeof password === "string" || password instanceof Uint8Array) {
    return { encryption: password, integrity: password };
  }
  if ("secret" in password) {
    return {
      id: password.id,
      encryption: password.secret,
      integrity: password.secret,
    };
  }
  return {
    id: password.id,
    encryption: password.encryption,
    integrity: password.integrity,
  };
}

/** Generate cryptographically strong pseudorandom bits. */
export function randomBits(bits: number): Uint8Array {
  if (bits < 1) throw new Error("Invalid random bits count");
  const bytes = Math.ceil(bits / 8);
  return randomBytes(bytes);
}

/** Generates cryptographically strong pseudorandom bytes. */
function randomBytes(size: number): Uint8Array {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytes;
}

// --- encoding ---

const encoder = /* @__PURE__ */ new TextEncoder();
const decoder = /* @__PURE__ */ new TextDecoder();

function bufferToString(value: Uint8Array): string {
  return decoder.decode(value);
}

function stringToUint8Array(value: string): Uint8Array {
  return encoder.encode(value);
}

function addPaddingToBase64url(base64url: string): string {
  if (base64url.length % 4 === 2) return base64url + "==";
  if (base64url.length % 4 === 3) return base64url + "=";
  if (base64url.length % 4 === 1) {
    throw new TypeError("Illegal base64url string!");
  }
  return base64url;
}

function convertBase64urlToBase64(b64url: string): string {
  if (!/^[\w-]*?={0,2}$/i.test(b64url)) {
    // Contains characters not part of base64url spec.
    throw new TypeError("Failed to decode base64url: invalid character");
  }
  return addPaddingToBase64url(b64url).replace(/-/g, "+").replace(/_/g, "/");
}

function convertBase64ToBase64url(b64: string) {
  return b64.endsWith("=")
    ? (b64.endsWith("==")
      ? b64.replace(/\+/g, "-").replace(/\//g, "_").slice(0, -2)
      : b64.replace(/\+/g, "-").replace(/\//g, "_").slice(0, -1)) // prettier-ignore
    : b64.replace(/\+/g, "-").replace(/\//g, "_"); // prettier-ignore
}

export function encodeBase64Url(
  data: ArrayBuffer | Uint8Array | string,
): string {
  return convertBase64ToBase64url(encodeBase64(data));
}

export function decodeBase64Url(b64url: string): Uint8Array {
  return decodeBase64(convertBase64urlToBase64(b64url));
}

// prettier-ignore
const base64abc= /* @__PURE__ */ ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","0","1","2","3","4","5","6","7","8","9","+","/"];

export function encodeBase64(data: ArrayBuffer | Uint8Array | string): string {
  // CREDIT: https://gist.github.com/enepomnyaschih/72c423f727d395eeaa09697058238727
  const uint8 = validateBinaryLike(data);
  let result = "";
  let i;
  const l = uint8.length;
  for (i = 2; i < l; i += 3) {
    result += base64abc[uint8[i - 2]! >> 2];
    result += base64abc[((uint8[i - 2]! & 0x03) << 4) | (uint8[i - 1]! >> 4)];
    result += base64abc[((uint8[i - 1]! & 0x0f) << 2) | (uint8[i]! >> 6)];
    result += base64abc[uint8[i]! & 0x3f];
  }
  if (i === l + 1) {
    // 1 octet yet to write
    result += base64abc[uint8[i - 2]! >> 2];
    result += base64abc[(uint8[i - 2]! & 0x03) << 4];
    result += "==";
  }
  if (i === l) {
    // 2 octets yet to write
    result += base64abc[uint8[i - 2]! >> 2];
    result += base64abc[((uint8[i - 2]! & 0x03) << 4) | (uint8[i - 1]! >> 4)];
    result += base64abc[(uint8[i - 1]! & 0x0f) << 2];
    result += "=";
  }
  return result;
}

export function decodeBase64(b64: string): Uint8Array {
  const binString = atob(b64);
  const size = binString.length;
  const bytes = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    // (Uint8Array values are 0-255)
    // eslint-disable-next-line unicorn/prefer-code-point
    bytes[i] = binString.charCodeAt(i);
  }
  return bytes;
}

export function validateBinaryLike(source: unknown): Uint8Array {
  if (typeof source === "string") {
    return encoder.encode(source);
  } else if (source instanceof Uint8Array) {
    return source;
  } else if (source instanceof ArrayBuffer) {
    return new Uint8Array(source);
  }
  throw new TypeError(
    `The input must be a Uint8Array, a string, or an ArrayBuffer.`,
  );
}

// --- Types ---

/** Algorithm used for encryption and decryption. */
type EncryptionAlgorithm = "aes-128-ctr" | "aes-256-cbc";

/** Algorithm used for integrity verification. */
export type IntegrityAlgorithm = "sha256";

/** @internal */
type _Algorithm = EncryptionAlgorithm | IntegrityAlgorithm;

/**
 * Options for customizing the key derivation algorithm used to generate encryption and integrity verification keys as well as the algorithms and salt sizes used.
 */
export type SealOptions = Readonly<{
  /** Encryption step options. */
  encryption: SealOptionsSub<EncryptionAlgorithm>;

  /** Integrity step options. */
  integrity: SealOptionsSub<IntegrityAlgorithm>;

  /*Sealed object lifetime in milliseconds where 0 means forever. Defaults to 0. */
  ttl: number;

  /** Number of seconds of permitted clock skew for incoming expirations. Defaults to 60 seconds. */
  timestampSkewSec: number;

  /**
   * Local clock time offset, expressed in number of milliseconds (positive or negative). Defaults to 0.
   */
  localtimeOffsetMsec: number;
}>;

/** `seal()` method options. */
type SealOptionsSub<Algorithm extends _Algorithm = _Algorithm> = Readonly<{
  /** The length of the salt (random buffer used to ensure that two identical objects will generate a different encrypted result). Defaults to 256. */
  saltBits: number;

  /** The algorithm used. Defaults to 'aes-256-cbc' for encryption and 'sha256' for integrity. */
  algorithm: Algorithm;

  /** The number of iterations used to derive a key from the password. Defaults to 1. */
  iterations: number;

  /** Minimum password size. Defaults to 32. */
  minPasswordlength: number;
}>;

/** Password secret string or buffer.*/
type Password = Uint8Array | string;

/** `generateKey()` method options. */
export type GenerateKeyOptions<Algorithm extends _Algorithm = _Algorithm> =
  Pick<
    SealOptionsSub<Algorithm>,
    "algorithm" | "iterations" | "minPasswordlength"
  > &
    Readonly<{
      saltBits?: number | undefined;
      salt?: string | undefined;
      iv?: Uint8Array | undefined;
      ivBits?: number | undefined;
      hmac?: boolean | undefined;
    }>;

/** Generated internal key object. */
type Key = Readonly<{
  key: CryptoKey;
  salt: string;
  iv: Uint8Array;
}>;

/** Generated HMAC internal results. */
type HMacResult = Readonly<{
  digest: string;
  salt: string;
}>;

/** Secret object with optional id.*/
type PasswordSecret = Readonly<{
  id?: string | undefined;
  secret: Password;
}>;

/** Secret object with optional id and specified password for each encryption and integrity. */
type PasswordSpecific = Readonly<{
  id?: string | undefined;
  encryption: Password;
  integrity: Password;
}>;

/** Key-value pairs hash of password id to value. */
type PasswordHash = Readonly<
  Record<string, Password | PasswordSecret | PasswordSpecific>
>;

export type RawPassword = Password | PasswordSecret | PasswordSpecific;
