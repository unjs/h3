import { seal, unseal, defaults as sealDefaults } from "iron-webcrypto";
import type { SealOptions } from "iron-webcrypto";
import type { CookieSerializeOptions, CookieParseOptions } from "cookie-es";
import crypto from "uncrypto";
import type { H3Event } from "../event";
import { getCookie, setCookie } from "./cookie";

type SessionDataT = Record<string, string | number | boolean>;
export type SessionData<T extends SessionDataT = SessionDataT> = T;

export interface Session<T extends SessionDataT = SessionDataT> {
  id: string;
  data: SessionData<T>;
}

export interface SessionConfig {
  password: string;
  name?: string;
  cookie?: CookieSerializeOptions & CookieParseOptions;
  seal?: SealOptions;
  crypto?: Crypto;
}

export async function useSession<T extends SessionDataT = SessionDataT>(
  event: H3Event,
  config: SessionConfig
) {
  // Create a synced wrapper around the session
  const sessionName = config.name || "h3";
  await getSession(event, config); // Force init
  const sessionManager = {
    get id() {
      return event.context.sessions?.[sessionName]?.id;
    },
    get data() {
      return event.context.sessions?.[sessionName]?.data || {};
    },
    update: async (update: SessionUpdate<T>) => {
      await updateSession<T>(event, config, update);
      return sessionManager;
    },
    clear: async () => {
      await clearSession(event, config);
      return sessionManager;
    },
  };
  return sessionManager;
}

export async function getSession<T extends SessionDataT = SessionDataT>(
  event: H3Event,
  config: SessionConfig
): Promise<Session<T>> {
  const sessionName = config.name || "h3";

  // Return existing session if available
  if (!event.context.sessions) {
    event.context.sessions = Object.create(null);
  }
  if (event.context.sessions![sessionName]) {
    return event.context.sessions![sessionName] as Session<T>;
  }

  // Prepare an empty session object and store in context
  const session: Session<T> = { id: "", data: Object.create(null) };
  event.context.sessions![sessionName] = session;

  // Try to hydrate from cookies
  const reqCookie = getCookie(event, sessionName);
  if (!reqCookie) {
    // New session store in response cookies
    session.id = (config.crypto || crypto).randomUUID();
    await updateSession(event, config);
  } else {
    // Unseal session data from cookie
    const unsealed = await unseal(
      config.crypto || crypto,
      reqCookie,
      config.password,
      config.seal || sealDefaults
    );
    Object.assign(session, unsealed);
  }

  return session;
}

type SessionUpdate<T extends SessionDataT = SessionDataT> =
  | Partial<SessionData<T>>
  | ((oldData: SessionData<T>) => Partial<SessionData<T>> | undefined);

export async function updateSession<T extends SessionDataT = SessionDataT>(
  event: H3Event,
  config: SessionConfig,
  update?: SessionUpdate<T>
): Promise<Session<T>> {
  const sessionName = config.name || "h3";

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
  const sealed = await seal(
    config.crypto || crypto,
    session,
    config.password,
    config.seal || sealDefaults
  );
  setCookie(event, sessionName, sealed, config.cookie);

  return session;
}

export async function clearSession(event: H3Event, config: SessionConfig) {
  const sessionName = config.name || "h3";
  if (event.context.sessions?.[sessionName]) {
    delete event.context.sessions![sessionName];
  }
  await setCookie(event, sessionName, "", config.cookie);
}
