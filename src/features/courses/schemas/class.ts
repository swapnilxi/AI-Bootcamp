import { z } from "zod";

export const createClassSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(120),
  description: z.string().min(10, "Description must be at least 10 characters"),
  // Course overview / materials shown to enrolled students above the lesson list
  content: z.string().default(""),
  schedule: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid schedule date and time",
  }),
  durationMinutes: z.coerce.number().min(15).max(360).default(60),
  price: z.coerce.number().min(0).default(0),
  isSubscriberOnly: z.boolean().default(false),
  isPasswordProtected: z.boolean().default(false),
  password: z.string().optional(),
  // Admins may assign a teaching instructor; instructors always teach their own classes
  instructorId: z.string().optional(),
  pathId: z.string().optional(),
}).refine(
  (data) => {
    if (data.isPasswordProtected && (!data.password || data.password.trim().length === 0)) {
      return false;
    }
    return true;
  },
  {
    message: "A class password is required when password protection is enabled",
    path: ["password"],
  }
);

export const updateClassSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  description: z.string().min(10).optional(),
  content: z.string().optional(),
  schedule: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid schedule date" })
    .optional(),
  durationMinutes: z.coerce.number().min(15).max(360).optional(),
  price: z.coerce.number().min(0).optional(),
  isSubscriberOnly: z.boolean().optional(),
  isPasswordProtected: z.boolean().optional(),
  password: z.string().optional(),
  instructorId: z.string().optional(),
});

export const unlockClassSchema = z.object({
  password: z.string().min(1, "Password is required"),
});
