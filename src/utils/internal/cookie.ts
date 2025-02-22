import type { CookieSerializeOptions, SetCookie } from "cookie-es";

export function getDistinctCookieKey(
  name: string,
  opts: CookieSerializeOptions | SetCookie,
) {
  return [
    name,
    opts.domain || "",
    opts.path || "/",
    Boolean(opts.secure),
    Boolean(opts.httpOnly),
    Boolean(opts.sameSite),
  ].join(";");
}
