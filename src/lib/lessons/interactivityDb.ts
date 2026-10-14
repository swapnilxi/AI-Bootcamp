import { Prisma } from "@prisma/client";
import type { InteractivityOptions } from "./shared";

/** Prisma value for an `interactivity` Json column: the options, or SQL NULL when the lesson was generated plain. */
export function interactivityToDb(options?: InteractivityOptions) {
  return options ? (options as unknown as Prisma.InputJsonObject) : Prisma.DbNull;
}
