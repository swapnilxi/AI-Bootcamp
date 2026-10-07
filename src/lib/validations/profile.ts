import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(60).optional(),
  avatarUrl: z.string().url("Invalid avatar URL").or(z.literal("")).optional(),
  bio: z.string().max(500).optional(),
  phone: z.string().trim().max(30).or(z.literal("")).optional(),
  timezone: z.string().optional(),
  role: z.enum(["USER", "INSTRUCTOR"]).optional(),
});
