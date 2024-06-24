import type { CookieSerializeOptions } from "cookie-es";
import type { SealOptions } from "iron-webcrypto";
import type { _kGetSession } from "../../utils/session";

type SessionDataT = Record<string, any>;

export type SessionData<T extends SessionDataT = SessionDataT> = T;

export interface Session<T extends SessionDataT = SessionDataT> {
  id: string;
  createdAt: number;
  data: SessionData<T>;
  [_kGetSession]?: Promise<Session<T>>;
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
