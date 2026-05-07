import z from "zod";

// common(Frontend + Backend)

export const apiResponseSchema = z.object({
  success: z.boolean(),
  status: z.number(),
  data: z.any(),
  message: z.string().default("Success"),
  meta: z.object({
    requestId: z.string(),
  }),
});

const errorSchema = z.object<any>({});
const apiErrorSchema = z.object({
  type: z.string().min(1),
  title: z.string(),
  status: z.number()
    .int()
    .min(100)
    .max(599),
  errors: z.array(errorSchema).optional(),
  detail: z.string().default("Something went wrong"),
  instance: z.string(),
  requestId: z.uuidv4().optional(),
});

export type ApiResponseObj = z.infer<typeof apiResponseSchema>;
export type ApiErrorObj = z.infer<typeof apiErrorSchema>;
// extract type for a member in zod object
export type MetaData = ApiResponseObj["meta"]