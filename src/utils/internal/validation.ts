import type { Schema } from "@decs/typeschema";
import { assert } from "@decs/typeschema";
import { createError } from "../../error";
export type { Infer, Schema } from "@decs/typeschema";

export const assertSchema = async <T>(
  schema: Schema,
  payload: T,
  onError?: (err: any) => any
) => {
  try {
    // @todo use AggregateError to throw all validation errors https://github.com/decs/typeschema/issues/8
    return await assert(schema, payload);
  } catch (error) {
    if (onError) {
      return onError(error);
    }
    throw createError({ statusCode: 500, statusMessage: "Assertion Error." });
  }
};
