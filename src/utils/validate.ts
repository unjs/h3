import { createError } from "../error";

// TODO: Consider using similar method of typeschema for external library compatibility
// https://github.com/decs/typeschema/blob/v0.1.3/src/assert.ts

export type ValidateResult<T> = T | false | void;

export type ValidateFunction<T> = (
  data: unknown
) => ValidateResult<T> | Promise<ValidateResult<T>>;

export async function validateData<T>(
  data: unknown,
  fn: ValidateFunction<T>
): Promise<T> {
  try {
    const res = await fn(data);
    if (res === false) {
      throw createValidationError();
    }
    return res ?? (data as T);
  } catch (error) {
    throw createValidationError(error);
  }
}

function createValidationError(validateError?: any) {
  throw createError({
    status: 400,
    message: validateError.message || "Validation Failed",
    ...validateError,
  });
}
