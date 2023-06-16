import { App, createEvent } from "./";

/**
 * Adapter that helps return a Response from a Request.
 * It can be used with something like Nitro.
 * const localResponse = adapterFetch(h3app)
 * const response = localResponse(request: Request, {context: { cf: request.cf, cloudflare: { request, env, context } }})
 * @param app
 * @returns Promise<Response>
 */
export const adapterFetch = (app: App) => {
  return async (request: Request, context?: Record<string, any>) => {
    try {
      const event = createEvent(undefined, undefined, request);
      if (context) {
        event.context = context;
      }
      return (await app.handler(event)) as Response;
    } catch (error: any) {
      return new Response(error.toString(), {
        status: Number.parseInt(error.statusCode || error.code) || 500,
        statusText: error.statusText,
      });
    }
  };
};

export const adapterCloudflareWorker = (app: App) => {
  const worker = {
    async fetch(request: Request, env?: any, context?: any) {
      const fetchResponse = adapterFetch(app);
      return await fetchResponse(request, {
        // @ts-expect-error
        cf: request.cf,
        cloudflare: { env, context },
      });
    },
    fire: () => {
      console.log("implement service worker syntax ...");
    },
  };
  return worker;
};
