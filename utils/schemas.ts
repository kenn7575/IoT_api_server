import { z } from "zod";

export const numberString = z
  .union([z.number(), z.string()])
  .refine(
    (value) => {
      if (typeof value === "string") {
        const parsed = parseInt(value, 10);
        return !isNaN(parsed) && Number.isInteger(parsed);
      }
      return Number.isInteger(value);
    },
    { message: "Id must be an integer or a valid integer string" }
  )
  .transform((value) =>
    typeof value === "string" ? parseInt(value, 10) : value
  );
