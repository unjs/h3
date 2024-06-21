import type { CookieSerializeOptions } from "cookie-es";
import type { SealOptions } from "iron-webcrypto";
import type { H3Event } from "../types";
import crypto from "uncrypto";
import { seal, unseal, defaults as sealDefaults } from "iron-webcrypto";
import { _kRaw } from "../event";
import { getCookie, setCookie } from "./cookie";

type SessionDataT = Record<string, any>;
export type SessionData<T extends SessionDataT = SessionDataT> = T;

const getSessionPromise = Symbol("getSession");

export interface Session<T extends SessionDataT = SessionDataT> {
  id: string;
  createdAt: number;
  data: SessionData<T>;
  [getSessionPromise]?: Promise<Session<T>>;
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

const DEFAULT_NAME = "h3";
const DEFAULT_COOKIE: SessionConfig["cookie"] = {
  path: "/",
  secure: true,
  httpOnly: true,
};

/**
 * Create a session manager for the current request.
 *
 */
export async function useSession<T extends SessionDataT = SessionDataT>(
  event: H3Event,
  config: SessionConfig,
) {
  // Create a synced wrapper around the session
  const sessionName = config.name || DEFAULT_NAME;
  await getSession(event, config); // Force init
  const sessionManager = {
    get id() {
      return event.context.sessions?.[sessionName]?.id;
    },
    get data() {
      return (event.context.sessions?.[sessionName]?.data || {}) as T;
    },
    update: async (update: SessionUpdate<T>) => {
      await updateSession<T>(event, config, update);
      return sessionManager;
    },
    clear: () => {
      clearSession(event, config);
      return Promise.resolve(sessionManager);
    },
  };
  return sessionManager;
}

/**
 * Get the session for the current request.
 */
export async function getSession<T extends SessionDataT = SessionDataT>(
  event: H3Event,
  config: SessionConfig,
): Promise<Session<T>> {
  const sessionName = config.name || DEFAULT_NAME;

  // Return existing session if available
  if (!event.context.sessions) {
    event.context.sessions = Object.create(null);
  }
  // Wait for existing session to load
  const existingSession = event.context.sessions![sessionName] as Session<T>;
  if (existingSession) {
    return existingSession[getSessionPromise] || existingSession;
  }

  // Prepare an empty session object and store in context
  const session: Session<T> = {
    id: "",
    createdAt: 0,
    data: Object.create(null),
  };
  event.context.sessions![sessionName] = session;

  // Try to load session
  let sealedSession: string | undefined;
  // Try header first
  if (config.sessionHeader !== false) {
    const headerName =
      typeof config.sessionHeader === "string"
        ? config.sessionHeader.toLowerCase()
        : `x-${sessionName.toLowerCase()}-session`;
    const headerValue = event[_kRaw].getHeader(headerName);
    if (typeof headerValue === "string") {
      sealedSession = headerValue;
    }
  }
  // Fallback to cookies
  if (!sealedSession) {
    sealedSession = getCookie(event, sessionName);
  }
  if (sealedSession) {
    // Unseal session data from cookie
    const promise = unsealSession(event, config, sealedSession)
      .catch(() => {})
      .then((unsealed) => {
        Object.assign(session, unsealed);
        delete event.context.sessions![sessionName][getSessionPromise];
        return session as Session<T>;
      });
    event.context.sessions![sessionName][getSessionPromise] = promise;
    await promise;
  }

  // New session store in response cookies
  if (!session.id) {
    session.id =
      config.generateId?.() ?? (config.crypto || crypto).randomUUID();
    session.createdAt = Date.now();
    await updateSession(event, config);
  }

  return session;
}

type SessionUpdate<T extends SessionDataT = SessionDataT> =
  | Partial<SessionData<T>>
  | ((oldData: SessionData<T>) => Partial<SessionData<T>> | undefined);

/**
 * Update the session data for the current request.
 */
export async function updateSession<T extends SessionDataT = SessionDataT>(
  event: H3Event,
  config: SessionConfig,
  update?: SessionUpdate<T>,
): Promise<Session<T>> {
  const sessionName = config.name || DEFAULT_NAME;

  // Access current session
  const session: Session<T> =
    (event.context.sessions?.[sessionName] as Session<T>) ||
    (await getSession<T>(event, config));

  // Update session data if provided
  if (typeof update === "function") {
    update = update(session.data);
  }
  if (update) {
    Object.assign(session.data, update);
  }

  // Seal and store in cookie
  if (config.cookie !== false) {
    const sealed = await sealSession(event, config);
    setCookie(event, sessionName, sealed, {
      ...DEFAULT_COOKIE,
      expires: config.maxAge
        ? new Date(session.createdAt + config.maxAge * 1000)
        : undefined,
      ...config.cookie,
    });
  }

  return session;
}

/**
 * Encrypt and sign the session data for the current request.
 */
export async function sealSession<T extends SessionDataT = SessionDataT>(
  event: H3Event,
  config: SessionConfig,
) {
  const sessionName = config.name || DEFAULT_NAME;

  // Access current session
  const session: Session<T> =
    (event.context.sessions?.[sessionName] as Session<T>) ||
    (await getSession<T>(event, config));

  const sealed = await seal(config.crypto || crypto, session, config.password, {
    ...sealDefaults,
    ttl: config.maxAge ? config.maxAge * 1000 : 0,
    ...config.seal,
  });

  return sealed;
}

/**
 * Decrypt and verify the session data for the current request.
 */
export async function unsealSession(
  _event: H3Event,
  config: SessionConfig,
  sealed: string,
) {
  const unsealed = (await unseal(
    config.crypto || crypto,
    sealed,
    config.password,
    {
      ...sealDefaults,
      ttl: config.maxAge ? config.maxAge * 1000 : 0,
      ...config.seal,
    },
  )) as Partial<Session>;
  if (config.maxAge) {
    const age = Date.now() - (unsealed.createdAt || Number.NEGATIVE_INFINITY);
    if (age > config.maxAge * 1000) {
      throw new Error("Session expired!");
    }
  }
  return unsealed;
}

/**
 * Clear the session data for the current request.
 */
export function clearSession(
  event: H3Event,
  config: Partial<SessionConfig>,
): Promise<void> {
  const sessionName = config.name || DEFAULT_NAME;
  if (event.context.sessions?.[sessionName]) {
    delete event.context.sessions![sessionName];
  }
  setCookie(event, sessionName, "", {
    ...DEFAULT_COOKIE,
    ...config.cookie,
  });
  return Promise.resolve();
}
