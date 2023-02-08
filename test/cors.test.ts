import { expect, it, describe } from "vitest";
import {
  resolveCorsOptions,
  isPreflightRequest,
  isCorsAllowedOrigin,
  createOriginHeaders,
  createMethodsHeaders,
  createCredentialsHeaders,
  createAllowHeaderHeaders,
  createExposeHeaders,
  createMaxAgeHeader,
} from "../src/utils/cors/utils";
import type { H3Event } from "../src";
import type { CorsOptions } from "../src/utils/cors"

describe("resolveCorsOptions", () => {
  it("can merge default options and user options", () => {
    const options1 = resolveCorsOptions();
    const options2 = resolveCorsOptions({
      origin: ["https://example.com:3000"],
      methods: ["GET", "POST"],
      allowHeaders: ["CUSTOM-HEADER"],
      exposeHeaders: ["EXPOSED-HEADER"],
      maxAge: "12345",
      preflight: {
        statusCode: 404,
      },
    });

    expect(options1).toEqual({
      origin: "*",
      methods: "*",
      allowHeaders: "*",
      exposeHeaders: "*",
      credentials: false,
      maxAge: false,
      preflight: {
        statusCode: 204,
      },
    });
    expect(options2).toEqual({
      origin: ["https://example.com:3000"],
      methods: ["GET", "POST"],
      allowHeaders: ["CUSTOM-HEADER"],
      exposeHeaders: ["EXPOSED-HEADER"],
      credentials: false,
      maxAge: "12345",
      preflight: {
        statusCode: 404,
      },
    });
  });
});

describe("isPreflightRequest", () => {
  it("can detect preflight request", () => {
    const eventMock = {
      node: {
        req: {
          method: "OPTIONS",
          headers: {
            origin: "http://example.com",
            "access-control-request-method": "GET",
          },
        },
      },
    } as H3Event;

    expect(isPreflightRequest(eventMock)).toEqual(true);
  });

  it("can detect request of non-OPTIONS method)", () => {
    const eventMock = {
      node: {
        req: {
          method: "GET",
          headers: {
            origin: "http://example.com",
            "access-control-request-method": "GET",
          },
        },
      },
    } as H3Event;

    expect(isPreflightRequest(eventMock)).toEqual(false);
  });

  it("can detect request without Origin header", () => {
    const eventMock = {
      node: {
        req: {
          method: "OPTIONS",
          headers: {
            "access-control-request-method": "GET",
          },
        },
      },
    } as H3Event;

    expect(isPreflightRequest(eventMock)).toEqual(false);
  });

  it("can detect request without AccessControlRequestMethod header", () => {
    const eventMock = {
      node: {
        req: {
          method: "OPTIONS",
          headers: {
            origin: "http://example.com",
          },
        },
      },
    } as H3Event;

    expect(isPreflightRequest(eventMock)).toEqual(false);
  });
});

describe("isCorsAllowedOrigin", () => {
  it("returns `true` if `origin` header is not defined", () => {
    const origin = undefined;
    const options: CorsOptions = {};

    expect(isCorsAllowedOrigin(origin, options)).toEqual(true);
  });

  it("returns `true` if `origin` option is not defined", () => {
    const origin = "https://example.com";
    const options: CorsOptions = {};

    expect(isCorsAllowedOrigin(origin, options)).toEqual(true);
  });

  it('returns `true` if `origin` option is `"*"`', () => {
    const origin = "https://example.com";
    const options: CorsOptions = {
      origin: "*",
    };

    expect(isCorsAllowedOrigin(origin, options)).toEqual(true);
  });

  it('returns `true` if `origin` option is `"null"`', () => {
    const origin = "https://example.com";
    const options: CorsOptions = {
      origin: "null",
    };

    expect(isCorsAllowedOrigin(origin, options)).toEqual(true);
  });

  it("can detect allowed origin (string)", () => {
    const origin = "https://example.com";
    const options: CorsOptions = {
      origin: ["https://example.com"],
    };

    expect(isCorsAllowedOrigin(origin, options)).toEqual(true);
  });

  it("can detect allowed origin (regular expression)", () => {
    const origin = "https://example.com";
    const options: CorsOptions = {
      origin: [/example/],
    };

    expect(isCorsAllowedOrigin(origin, options)).toEqual(true);
  });

  it("can detect allowed origin (function)", () => {
    const origin = "https://example.com";
    const options: CorsOptions = {
      origin: (_origin: string) => {
        expect(_origin).toEqual(origin);
        return true;
      },
    };

    expect(isCorsAllowedOrigin(origin, options)).toEqual(true);
  });

  it("can detect allowed origin (falsy)", () => {
    const origin = "https://example.com";
    const options: CorsOptions = {
      origin: ["https://example2.com"],
    };

    expect(isCorsAllowedOrigin(origin, options)).toEqual(false);
  });
});

describe("createOriginHeaders", () => {
  it('returns an object whose `Access-Control-Allow-Origin` is `"*"` if `origin` option is not defined, or `"*"`', () => {
    const eventMock = {
      node: {
        req: {
          method: "OPTIONS",
          headers: {
            origin: "http://example.com",
          },
        },
      },
    } as H3Event;
    const options1: CorsOptions = {};
    const options2: CorsOptions = {
      origin: "*",
    };

    expect(createOriginHeaders(eventMock, options1)).toEqual({
      "Access-Control-Allow-Origin": "*",
    });
    expect(createOriginHeaders(eventMock, options2)).toEqual({
      "Access-Control-Allow-Origin": "*",
    });
  });

  it('returns an object whose `Access-Control-Allow-Origin` is `"*"` if `origin` header is not defined', () => {
    const eventMock = {
      node: {
        req: {
          method: "OPTIONS",
          headers: {},
        },
      },
    } as H3Event;
    const options: CorsOptions = {};

    expect(createOriginHeaders(eventMock, options)).toEqual({
      "Access-Control-Allow-Origin": "*",
    });
  });

  it('returns an object with `Access-Control-Allow-Origin` and `Vary` keys if `origin` option is `"null"`', () => {
    const eventMock = {
      node: {
        req: {
          method: "OPTIONS",
          headers: {
            origin: "http://example.com",
          },
        },
      },
    } as H3Event;
    const options: CorsOptions = {
      origin: "null",
    };

    expect(createOriginHeaders(eventMock, options)).toEqual({
      "Access-Control-Allow-Origin": "null",
      Vary: "Origin",
    });
  });

  it("returns an object with `Access-Control-Allow-Origin` and `Vary` keys if `origin` option and `Origin` header matches", () => {
    const eventMock = {
      node: {
        req: {
          method: "OPTIONS",
          headers: {
            origin: "http://example.com",
          },
        },
      },
    } as H3Event;
    const options1: CorsOptions = {
      origin: ["http://example.com"],
    };
    const options2: CorsOptions = {
      origin: [/example.com/],
    };

    expect(createOriginHeaders(eventMock, options1)).toEqual({
      "Access-Control-Allow-Origin": "http://example.com",
      Vary: "Origin",
    });
    expect(createOriginHeaders(eventMock, options2)).toEqual({
      "Access-Control-Allow-Origin": "http://example.com",
      Vary: "Origin",
    });
  });

  it("returns an empty object if `origin` option is one that is not allowed", () => {
    const eventMock = {
      node: {
        req: {
          method: "OPTIONS",
          headers: {
            origin: "http://example.com",
          },
        },
      },
    } as H3Event;
    const options1: CorsOptions = {
      origin: ["http://example2.com"],
    };
    const options2: CorsOptions = {
      origin: () => false,
    };

    expect(createOriginHeaders(eventMock, options1)).toEqual({});
    expect(createOriginHeaders(eventMock, options2)).toEqual({});
  });
});

describe("createMethodsHeaders", () => {
  it("returns an empty object if `methods` option is not defined or an empty array", () => {
    const options1: CorsOptions = {};
    const options2: CorsOptions = {
      methods: [],
    };

    expect(createMethodsHeaders(options1)).toEqual({});
    expect(createMethodsHeaders(options2)).toEqual({});
  });

  it('returns an object whose `Access-Control-Allow-Methods` is `"*"` if `methods` option is `"*"`', () => {
    const options1: CorsOptions = {
      methods: "*",
    };

    expect(createMethodsHeaders(options1)).toEqual({
      "Access-Control-Allow-Methods": "*",
    });
  });

  it("returns an object whose `Access-Control-Allow-Methods` is set as `methods` option", () => {
    const options: CorsOptions = {
      methods: ["GET", "POST"],
    };

    expect(createMethodsHeaders(options)).toEqual({
      "Access-Control-Allow-Methods": "GET,POST",
    });
  });
});

describe("createCredentialsHeaders", () => {
  it("returns an empty object if `credentials` option is not defined", () => {
    const options: CorsOptions = {};

    expect(createCredentialsHeaders(options)).toEqual({});
  });

  it('returns an object whose `Access-Control-Allow-Credentials` is `"true"` if `credentials` option is true', () => {
    const options: CorsOptions = {
      credentials: true,
    };

    expect(createCredentialsHeaders(options)).toEqual({
      "Access-Control-Allow-Credentials": "true",
    });
  });
});

describe("createAllowHeaderHeaders", () => {
  it('returns an object with `Access-Control-Allow-Headers` and `Vary` keys according to `Access-Control-Request-Headers` header if `allowHeaders` option is not defined, `"*"`, or an empty array', () => {
    const eventMock = {
      node: {
        req: {
          method: "OPTIONS",
          headers: {
            "access-control-request-headers": "CUSTOM-HEADER",
          },
        },
      },
    } as H3Event;
    const options1: CorsOptions = {};
    const options2: CorsOptions = {
      allowHeaders: "*",
    };
    const options3: CorsOptions = {
      allowHeaders: [],
    };

    expect(createAllowHeaderHeaders(eventMock, options1)).toEqual({
      "Access-Control-Allow-Headers": "CUSTOM-HEADER",
      Vary: "Access-Control-Request-Headers",
    });
    expect(createAllowHeaderHeaders(eventMock, options2)).toEqual({
      "Access-Control-Allow-Headers": "CUSTOM-HEADER",
      Vary: "Access-Control-Request-Headers",
    });
    expect(createAllowHeaderHeaders(eventMock, options3)).toEqual({
      "Access-Control-Allow-Headers": "CUSTOM-HEADER",
      Vary: "Access-Control-Request-Headers",
    });
  });

  it("returns an object with `Access-Control-Allow-Headers` and `Vary` keys according to `allowHeaders` option if `Access-Control-Request-Headers` header is not defined", () => {
    const eventMock = {
      node: {
        req: {
          method: "OPTIONS",
          headers: {},
        },
      },
    } as H3Event;
    const options: CorsOptions = {
      allowHeaders: ["CUSTOM-HEADER"],
    };

    expect(createAllowHeaderHeaders(eventMock, options)).toEqual({
      "Access-Control-Allow-Headers": "CUSTOM-HEADER",
      Vary: "Access-Control-Request-Headers",
    });
  });

  it('returns an empty object if `allowHeaders` option is not defined, `"*"`, or an empty array, and `Access-Control-Request-Headers` is not defined', () => {
    const eventMock = {
      node: {
        req: {
          method: "OPTIONS",
          headers: {},
        },
      },
    } as H3Event;
    const options1: CorsOptions = {};
    const options2: CorsOptions = {
      allowHeaders: "*",
    };
    const options3: CorsOptions = {
      allowHeaders: [],
    };

    expect(createAllowHeaderHeaders(eventMock, options1)).toEqual({});
    expect(createAllowHeaderHeaders(eventMock, options2)).toEqual({});
    expect(createAllowHeaderHeaders(eventMock, options3)).toEqual({});
  });
});

describe("createExposeHeaders", () => {
  it("returns an object if `exposeHeaders` option is not defined", () => {
    const options: CorsOptions = {};

    expect(createExposeHeaders(options)).toEqual({});
  });

  it("returns an object with `Access-Control-Expose-Headers` key according to `exposeHeaders` option", () => {
    const options1: CorsOptions = {
      exposeHeaders: "*",
    };
    const options2: CorsOptions = {
      exposeHeaders: ["EXPOSED-HEADER-1", "EXPOSED-HEADER-2"],
    };

    expect(createExposeHeaders(options1)).toEqual({
      "Access-Control-Expose-Headers": "*",
    });
    expect(createExposeHeaders(options2)).toEqual({
      "Access-Control-Expose-Headers": "EXPOSED-HEADER-1,EXPOSED-HEADER-2",
    });
  });
});

describe("createMaxAgeHeader", () => {
  it("returns an object if `maxAge` option is not defined, false, or an empty string", () => {
    const options1: CorsOptions = {};
    const options2: CorsOptions = {
      maxAge: false,
    };
    const options3: CorsOptions = {
      maxAge: "",
    };

    expect(createMaxAgeHeader(options1)).toEqual({});
    expect(createMaxAgeHeader(options2)).toEqual({});
    expect(createMaxAgeHeader(options3)).toEqual({});
  });

  it("returns an object with `Access-Control-Max-Age` key according to `exposeHeaders` option", () => {
    const options1: CorsOptions = {
      maxAge: "12345",
    };
    const options2: CorsOptions = {
      maxAge: "0",
    };

    expect(createMaxAgeHeader(options1)).toEqual({
      "Access-Control-Max-Age": "12345",
    });
    expect(createMaxAgeHeader(options2)).toEqual({
      "Access-Control-Max-Age": "0",
    });
  });
});
