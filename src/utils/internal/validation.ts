import type { Schema } from "@decs/typeschema";
import { assert } from "@decs/typeschema";
import { createError } from "src/error";
export type { Infer, Schema } from "@decs/typeschema";

export const assertSchema = async <T>(
  schema: Schema,
  payload: T,
  onError?: (err: any) => any
) => {
  try {
    return await assert(schema, payload);
  } catch (error) {
    if (onError) {
      return onError(error);
    }
    throw createError({ statusCode: 500, statusMessage: "Assertion Error." });
  }
};
