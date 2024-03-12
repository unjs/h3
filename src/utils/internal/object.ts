// TODO: Benchmark typeof vs try/catch (i guess try/catch is faster in non-edge cases!)

/**
 * Checks if a certain input has a given property.
 * @param obj - The input to check.
 * @param prop - The property to check for.
 * @returns A boolean indicating whether the input is an object and has the property.
 */
export function hasProp(obj: any, prop: string | symbol) {
  try {
    return prop in obj;
  } catch {
    return false;
  }
}
