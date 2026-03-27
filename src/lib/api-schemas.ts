import { z } from 'zod'

export const prioritySchema = z.enum(['low', 'medium', 'high'])

export const todosGetQuerySchema = z.object({
  search: z.string().optional(),
  completed: z.enum(['true', 'false']).optional(),
  priority: prioritySchema.optional(),
  categoryId: z.union([z.literal('null'), z.string().regex(/^\d+$/)]).optional(),
})

export const todosPostBodySchema = z.object({
  text: z.string().trim().min(1, 'text is required'),
  priority: prioritySchema.optional().default('medium'),
  categoryId: z.union([z.number().int().positive(), z.null()]).optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'dueDate must be YYYY-MM-DD')
    .optional(),
})

export const todoPatchBodySchema = z.object({
  completed: z.boolean({ invalid_type_error: 'completed must be a boolean' }),
})

export const categoryPostBodySchema = z.object({
  name: z.string().trim().min(1, 'name is required'),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'color must be #RRGGBB')
    .optional(),
})

export const categoryDeleteQuerySchema = z.object({
  id: z.coerce.number().int().positive({ message: 'id must be a positive integer' }),
})
