import type { EventHandlerRequest } from "./index";
import type { H3Event } from "../event";

export type EventValidateFunction<
  Request extends EventHandlerRequest = EventHandlerRequest,
> = (
  event: H3Event<Request>,
) => H3Event<Request> | Promise<H3Event<Request>> | Record<string, any>;

export type ValidatedRequest<ValidateFunction extends EventValidateFunction> =
  Awaited<ReturnType<ValidateFunction>> extends H3Event<infer R>
    ? R
    : Awaited<ReturnType<ValidateFunction>> extends EventHandlerRequest
      ? Awaited<ReturnType<ValidateFunction>>
      : EventHandlerRequest;

type Simplify<TType> = TType extends any[] | Date
  ? TType
  : { [K in keyof TType]: TType[K] };

export type EventFromValidatedRequest<Request extends EventHandlerRequest> =
  keyof Request extends "body" | "query"
    ? H3Event<Request>
    : H3Event<
        Simplify<Pick<Request, keyof Request & ("body" | "query")>>,
        Simplify<Omit<Request, "body" | "query">>
      >;
