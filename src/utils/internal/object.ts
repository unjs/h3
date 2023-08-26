// TODO: Benchmark typeof vs try/catch (i guess try/catch is faster in non-edge cases!)
export function hasProp(obj: object, prop: string | symbol) {
  try {
    return prop in obj;
  } catch {
    return false;
  }
}
