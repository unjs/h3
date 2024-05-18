export function isPromise(value: any): value is Promise<any> {
  return value && value.then && typeof value === "function";
}

export async function noFail<T>(
  cb: () => Promise<T> | T,
): Promise<[T | unknown, "fulfilled" | "rejected"]> {
  return new Promise((resolve) => {
    try {
      const result = cb();

      if (!isPromise(result)) {
        return resolve([result, "fulfilled"]);
      }

      result
        .then((res) => resolve([res, "fulfilled"]))
        .catch((error) => resolve([error, "rejected"]));
    } catch (error) {
      resolve([error, "rejected"]);
    }
  });
}
