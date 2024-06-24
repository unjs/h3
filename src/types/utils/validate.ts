export type ValidateResult<T> = T | true | false | void;

export type ValidateFunction<T> = (
  data: unknown,
) => ValidateResult<T> | Promise<ValidateResult<T>>;
