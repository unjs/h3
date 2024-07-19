import type { CookieSerializeOptions } from "cookie-es";
import type { kGetSession } from "../../utils/internal/session";

type SessionDataT = Record<string, any>;

export type SessionData<T extends SessionDataT = SessionDataT> = Partial<T>;

export interface Session<T extends SessionDataT = SessionDataT> {
  id: string;
  createdAt: number;
  data: SessionData<T>;
  [kGetSession]?: Promise<Session<T>>;
}

export interface SessionConfig {
  /** Private key used to encrypt session tokens */
  password: string;
  /** Session expiration time in seconds */
  maxAge?: number;
  /** default is h3 */
  name?: string;
  /** Default is secure, httpOnly, / */
  cookie?: false | CookieSerializeOptions;
  /** Default is x-h3-session / x-{name}-session */
  sessionHeader?: false | string;
  seal?: SealOptions;
  crypto?: Crypto;
  /** Default is Crypto.randomUUID */
  generateId?: () => string;
}

// -- From iron-webcrypto ---

/**
 * Algorithm used for encryption and decryption.
 */
type EncryptionAlgorithm = "aes-128-ctr" | "aes-256-cbc";
/**
 * Algorithm used for integrity verification.
 */
type IntegrityAlgorithm = "sha256";
/**
 * @internal
 */
type _Algorithm = EncryptionAlgorithm | IntegrityAlgorithm;

/**
 * Options for customizing the key derivation algorithm used to generate encryption and integrity verification keys as well as the algorithms and salt sizes used.
 */
interface SealOptions {
  /**
   * Encryption step options.
   */
  encryption: SealOptionsSub<EncryptionAlgorithm>;
  /**
   * Integrity step options.
   */
  integrity: SealOptionsSub<IntegrityAlgorithm>;
  /**
   * Sealed object lifetime in milliseconds where 0 means forever. Defaults to 0.
   */
  ttl: number;
  /**
   * Number of seconds of permitted clock skew for incoming expirations. Defaults to 60 seconds.
   */
  timestampSkewSec: number;
  /**
   * Local clock time offset, expressed in number of milliseconds (positive or negative). Defaults to 0.
   */
  localtimeOffsetMsec: number;
}

interface SealOptionsSub<Algorithm extends _Algorithm = _Algorithm> {
  /**
   * The length of the salt (random buffer used to ensure that two identical objects will generate a different encrypted result). Defaults to 256.
   */
  saltBits: number;
  /**
   * The algorithm used. Defaults to 'aes-256-cbc' for encryption and 'sha256' for integrity.
   */
  algorithm: Algorithm;
  /**
   * The number of iterations used to derive a key from the password. Defaults to 1.
   */
  iterations: number;
  /**
   * Minimum password size. Defaults to 32.
   */
  minPasswordlength: number;
}
