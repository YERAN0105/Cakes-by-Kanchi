import { z } from "zod";

export const customizationSchema = z.object({
  size_id: z.string().min(1, "Please select a size"),
  shape_id: z.string().optional(),
  flavor_id: z.string().min(1, "Please select a flavour"),
  tier_id: z.string().optional(),
  eggless: z.boolean(),
  vegan: z.boolean(),
  gluten_free: z.boolean(),
  message: z.string().max(50, "Message must be 50 characters or less").optional(),
  color_theme: z.string().max(100).optional(),
  addon_ids: z.array(z.string()),
  special_instructions: z.string().max(500, "Special instructions must be 500 characters or less").optional(),
  photo_url: z.string().optional(),
  quantity: z.number().int().min(1).max(10),
});

export type CustomizationValues = z.infer<typeof customizationSchema>;
