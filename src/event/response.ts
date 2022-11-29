import type { EventHandlerResponse, JSONType } from "../types";
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

  constructor (body: BodyInit | EventHandlerResponse | null = null, _init: ResponseInit = {}) {
    this.headers = new H3Headers(_init.headers);
    const init = {
      status: 200,
      statusText: "",
      ..._init
    } as Required<Pick<ResponseInit, "status" | "statusText">>;

    this.status = init.status;
    this.statusText = init.statusText;
    this.redirected = [301, 302, 307, 308].includes(init.status);
    this._body = body as any;
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
    return Promise.resolve(this._body as ArrayBuffer);
  }

  blob (): Promise<Blob> {
    return Promise.resolve(this._body as unknown as Blob);
  }

  formData (): Promise<FormData> {
    return Promise.resolve(this._body as unknown as FormData);
  }

  json <T extends JSONType = JSONType> (): Promise<T> {
    return Promise.resolve(this._body as T);
  }

  text (): Promise<string> {
    return Promise.resolve(this._body as string);
  }
}
