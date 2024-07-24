import { EmptyObject } from "./obj";
import { hasProp } from "./object";

export function parseURLEncodedBody(body: string) {
  const form = new URLSearchParams(body);
  const parsedForm: Record<string, any> = new EmptyObject();
  for (const [key, value] of form.entries()) {
    if (hasProp(parsedForm, key)) {
      if (!Array.isArray(parsedForm[key])) {
        parsedForm[key] = [parsedForm[key]];
      }
      parsedForm[key].push(value);
    } else {
      parsedForm[key] = value;
    }
  }
  return parsedForm as unknown;
}
