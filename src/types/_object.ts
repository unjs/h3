// Based on sindresorhus/is-plain-obj (MIT)
// Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)
// Copyright (c) Pooya Parsa <pooya@pi0.io>
// https://github.com/unjs/defu/blob/70cffe5bd32b6ef510ae129f9a1faa66df633b46/src/_utils.ts
export function isJSONSerializable(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }

  const _type = typeof value;
  if (_type !== "object") {
    return _type === "boolean" || _type === "number" || _type === "string";
  }

  if (Symbol.iterator in value) {
    return true;
  }

  const prototype = Object.getPrototypeOf(value);
  if (
    prototype !== null &&
    prototype !== Object.prototype &&
    Object.getPrototypeOf(prototype) !== null
  ) {
    return false;
  }

  return true;
}
