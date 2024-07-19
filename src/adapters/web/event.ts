import type { H3Event, H3EventContext } from "../../types";
import type { H3EventResponse } from "../../types/event";
import { BaseEvent } from "../base/event";

export class WebEvent extends BaseEvent implements H3Event {
  request: Request;
  url: URL;
  response: H3EventResponse;

  constructor(request: Request, context?: H3EventContext) {
    super(context);
    this.request = request;
    this.url = new URL(request.url);
    this.response = new WebEventResponse();
  }
}

class WebEventResponse implements H3EventResponse {
  _headersInit: Record<string, string> = Object.create(null);
  _headers?: Headers;

  get headers() {
    if (!this._headers) {
      this._headers = new Headers(this._headersInit);
    }
    return this._headers;
  }

  setHeader(name: string, value: string): void {
    if (this._headers) {
      this._headers.set(name, value);
    } else {
      this._headersInit[name] = value;
    }
  }
}
