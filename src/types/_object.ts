export function isJSONSerializable(value: any, _type: string): boolean {
  // Primitive values are JSON serializable
  if (value === null || value === undefined) {
    return true;
  }
  if (_type !== "object") {
    return _type === "boolean" || _type === "number" || _type === "string";
  }

  // Objects with `toJSON` are JSON serializable
  if (typeof value.toJSON === "function") {
    return true;
  }

  // Pipable streams are not JSON serializable (react pipe result is pure object :()
  if (typeof value.pipe === "function" || typeof value.pipeTo === "function") {
    return false;
  }

  // Pure object
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
