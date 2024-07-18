import type { IncomingMessage } from "node:http";
import { NodeReqHeadersProxy } from "./headers";
import { kNodeInspect, kNodeReq } from "./utils";

export const NodeRequestProxy = /* @__PURE__ */ (() =>
  class NodeRequestProxy implements Request {
    [kNodeReq]: IncomingMessage;

    cache: RequestCache = "default";
    credentials: RequestCredentials = "same-origin";
    destination: RequestDestination = "";
    integrity: string = "";
    keepalive: boolean = false;

    mode: RequestMode = "cors";
    redirect: RequestRedirect = "follow";
    referrer: string = "about:client";
    referrerPolicy: ReferrerPolicy = "";

    _url: URL;

    headers: Headers;

    signal: AbortSignal = undefined as unknown as AbortSignal;

    bodyUsed: boolean = false;
    __hasBody__: boolean | undefined;
    _rawBody?: Promise<Uint8Array>;
    _blobBody?: Promise<Blob>;
    _formDataBody?: Promise<FormData>;
    _jsonBody?: Promise<any>;
    _textBody?: Promise<string>;
    _bodyStream?: undefined | ReadableStream<Uint8Array>;

    constructor(req: IncomingMessage, url: URL) {
      this[kNodeReq] = req;
      this._url = url;
      this.headers = new NodeReqHeadersProxy(this[kNodeReq]);
    }

    clone(): Request {
      return new NodeRequestProxy(this[kNodeReq], this._url);
    }

    get url() {
      return this._url.href;
    }

    get method() {
      return this[kNodeReq].method || "GET";
    }

    get _hasBody() {
      if (this.__hasBody__ !== undefined) {
        return this.__hasBody__;
      }
      // Check if request method requires a payload
      const method = this[kNodeReq].method?.toUpperCase();
      if (
        !method ||
        !(
          method === "PATCH" ||
          method === "POST" ||
          method === "PUT" ||
          method === "DELETE"
        )
      ) {
        this.__hasBody__ = false;
        return false;
      }

      // Make sure either content-length or transfer-encoding/chunked is set
      if (!Number.parseInt(this[kNodeReq].headers["content-length"] || "")) {
        const isChunked = (this[kNodeReq].headers["transfer-encoding"] || "")
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean)
          .includes("chunked");
        if (!isChunked) {
          this.__hasBody__ = false;
          return false;
        }
      }
      return true;
    }

    get body() {
      if (!this._hasBody) {
        return null;
      }
      if (!this._bodyStream) {
        this.bodyUsed = true;
        this._bodyStream = new ReadableStream({
          start: (controller) => {
            this[kNodeReq]
              .on("data", (chunk) => {
                controller.enqueue(chunk);
              })
              .once("error", (error) => {
                controller.error(error);
              })
              .once("end", () => {
                controller.close();
              });
          },
        });
      }
      return this._bodyStream;
    }

    arrayBuffer(): Promise<ArrayBuffer> {
      if (!this._rawBody) {
        const _bodyStream = this.body;
        return _bodyStream
          ? _readStream(this.body)
          : Promise.resolve(new ArrayBuffer(0));
      }
      return this._rawBody;
    }

    blob(): Promise<Blob> {
      if (!this._blobBody) {
        this._blobBody = this.arrayBuffer().then((buff) => {
          return new Blob([buff], {
            type: this[kNodeReq].headers["content-type"],
          });
        });
      }
      return this._blobBody;
    }

    formData(): Promise<FormData> {
      if (!this._formDataBody) {
        this._formDataBody = this.arrayBuffer().then((buff) => {
          return new Response(buff, {
            headers: this.headers,
          }).formData();
        });
      }
      return this._formDataBody;
    }

    json(): Promise<any> {
      if (!this._jsonBody) {
        this._jsonBody = this.text().then((txt) => {
          return JSON.parse(txt);
        });
      }
      return this._jsonBody;
    }

    text(): Promise<string> {
      if (!this._textBody) {
        this._textBody = this.arrayBuffer().then((buff) => {
          return new TextDecoder().decode(buff);
        });
      }
      return this._textBody;
    }

    get [Symbol.toStringTag]() {
      return "Request";
    }

    [kNodeInspect]() {
      return {
        method: this.method,
        url: this.url,
        headers: this.headers,
      };
    }
  })();

async function _readStream(stream: ReadableStream) {
  const chunks: Uint8Array[] = [];
  await stream.pipeTo(
    new WritableStream({
      write(chunk) {
        chunks.push(chunk);
      },
    }),
  );
  return Buffer.concat(chunks);
}
