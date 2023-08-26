export function hasProp(obj: any, prop: string | symbol) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}
