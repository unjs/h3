import type { EventHandlerResponse } from "../types";
import { H3Headers } from "./headers";

export class H3Response implements Response {
  readonly headers: H3Headers;
  readonly status: number;
  readonly statusText: string;
  readonly redirected: boolean;
  readonly ok: boolean;
  readonly url: string;
  _body: string | ArrayBuffer | Uint8Array;

  // TODO: yet to implement
  readonly body: ReadableStream<Uint8Array> | null = null;
  readonly type: ResponseType = "default";
  readonly bodyUsed = false;

  constructor (body: BodyInit | EventHandlerResponse | null = null, init: ResponseInit = {}) {
    this.headers = new H3Headers(init.headers);
    this.status = init.status ?? 200;
    this.statusText = init.statusText || "";
    this.redirected = !!init.status && [301, 302, 307, 308].includes(init.status);
    this._body = body;
    this.url = "";
    this.ok = this.status < 300 && this.status > 199;
  }

  clone (): H3Response {
    return new H3Response(this.body, {
      headers: this.headers,
      status: this.status,
      statusText: this.statusText
    });
  }

  arrayBuffer (): Promise<ArrayBuffer> {
    return Promise.resolve(this._body as unknown as ArrayBuffer);
  }

  blob (): Promise<Blob> {
    return Promise.resolve(this._body as unknown as Blob);
  }

  formData (): Promise<FormData> {
    return Promise.resolve(this._body as unknown as FormData);
  }

  json <T = any> (): Promise<T> {
    return Promise.resolve(this._body as unknown as T);
  }

  text (): Promise<string> {
    return Promise.resolve(this._body as unknown as string);
  }
}
