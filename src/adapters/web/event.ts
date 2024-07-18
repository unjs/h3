import type { H3Event, H3EventContext } from "../../types";
import { BaseEvent } from "../base/event";

export class WebEvent extends BaseEvent implements H3Event {
  request: Request;
  url: URL;
  response: H3Event["response"];

  constructor(request: Request, context?: H3EventContext) {
    super(context);
    this.request = request;
    this.url = new URL(request.url);
    this.response = {
      headers: new Headers(),
    };
  }
}
