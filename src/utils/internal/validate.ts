import type { StandardSchemaV1, ValidateFunction } from "../../types";
import { createError } from "../../error";

async function _validateData<T>(
  data: unknown,
  fn: ValidateFunction<T>,
): Promise<T> {
  try {
    const res = await fn(data);
    if (res === false) {
      throw createValidationError();
    }
    if (res === true) {
      return data as T;
    }
    return res ?? (data as T);
  } catch (error) {
    throw createValidationError(error);
  }
}

async function validateStandardSchema<T extends StandardSchemaV1>(
  input: StandardSchemaV1.InferInput<T>,
  schema: T,
): Promise<StandardSchemaV1.InferOutput<T>> {
  let result = schema["~standard"].validate(input);
  if (result instanceof Promise) result = await result;

  if (result.issues) {
    throw createValidationError(result.issues);
  }

  return result.value;
}

/**
 * Validates the given data using the provided validation function.
 * @template T The expected type of the validated data.
 * @param data The data to validate.
 * @param fn The validation function to use - can be async.
 * @returns A Promise that resolves with the validated data if it passes validation, meaning the validation function does not throw and returns a value other than false.
 * @throws {ValidationError} If the validation function returns false or throws an error.
 */
export async function validateData<T, _S>(
  data: unknown,
  fnOrSchema: ValidateFunction<T>,
): Promise<T>;
/**
 * Validates the given data using the provided schema definition.
 * @template T The expected type of the validation schema.
 * @param data The data to validate.
 * @param schema The validation schema.
 * @returns A Promise that resolves with the validated data if it passes validation, meaning the validation function does not throw and returns the validated data.
 * @throws {ValidationError} If the validation does not succeed or throws an error.
 */
export async function validateData<_T, S extends StandardSchemaV1>(
  data: StandardSchemaV1.InferInput<S>,
  fnOrSchema: S,
): Promise<StandardSchemaV1.InferOutput<S>>;
export async function validateData<
  T,
  S extends StandardSchemaV1 | ValidateFunction<T>,
>(
  data: S extends StandardSchemaV1 ? StandardSchemaV1.InferInput<S> : unknown,
  fnOrSchema: S,
) {
  return isStandardSchema(fnOrSchema)
    ? validateStandardSchema(data, fnOrSchema)
    : _validateData(data, fnOrSchema);
}

function createValidationError(validateError?: any) {
  throw createError({
    status: 400,
    statusMessage: "Validation Error",
    message: validateError?.message || "Validation Error",
    data: validateError,
    cause: validateError,
  });
}

function isStandardSchema(schema: any): schema is StandardSchemaV1 {
  return "~standard" in schema;
}
