export function hasProp(obj: object, prop: string | symbol) {
  // TODO: Benchmark typeof vs try/catch (i guess try catch is faster in non-edge cases!)
  try {
    return prop in obj;
  } catch {
    return false;
  }
}
