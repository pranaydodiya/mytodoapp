import { z } from 'zod'

export const prioritySchema = z.enum(['low', 'medium', 'high'])

export const todoSortSchema = z.enum([
  'createdAt_desc',
  'createdAt_asc',
  'dueDate_asc',
  'dueDate_desc',
  'priority_desc',
  'priority_asc',
])

export const todosDuePresetSchema = z.enum(['today', 'overdue', 'no_due'])

/** Query ?includeSubtasks= — default true when omitted. */
const includeSubtasksFromQuery = z
  .string()
  .optional()
  .transform((s): boolean => {
    if (s === undefined || s === '') return true
    const t = s.toLowerCase()
    return t !== 'false' && t !== '0'
  })

export const todosGetQuerySchema = z.object({
  search: z.string().optional(),
  completed: z.enum(['true', 'false']).optional(),
  priority: prioritySchema.optional(),
  categoryId: z.union([z.literal('null'), z.string().regex(/^\d+$/)]).optional(),
  sort: todoSortSchema.optional(),
  due: todosDuePresetSchema.optional(),
  includeSubtasks: includeSubtasksFromQuery,
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

export const todoPatchBodySchema = z
  .object({
    completed: z.boolean({ invalid_type_error: 'completed must be a boolean' }).optional(),
    text: z.string().trim().min(1, 'text cannot be empty').optional(),
    priority: prioritySchema.optional(),
    categoryId: z.union([z.number().int().positive(), z.null()]).optional(),
    dueDate: z
      .union([
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dueDate must be YYYY-MM-DD'),
        z.null(),
      ])
      .optional(),
  })
  .refine(
    d =>
      d.completed !== undefined ||
      d.text !== undefined ||
      d.priority !== undefined ||
      d.categoryId !== undefined ||
      d.dueDate !== undefined,
    { message: 'At least one field is required' },
  )

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

export const subtaskPostBodySchema = z.object({
  text: z.string().trim().min(1, 'text is required'),
  position: z.number().int().min(0).optional(),
})

export const subtaskPatchBodySchema = z
  .object({
    text: z.string().trim().min(1, 'text cannot be empty').optional(),
    completed: z.boolean().optional(),
    position: z.number().int().min(0).optional(),
  })
  .refine(
    d => d.text !== undefined || d.completed !== undefined || d.position !== undefined,
    { message: 'At least one of text, completed, position is required' },
  )
