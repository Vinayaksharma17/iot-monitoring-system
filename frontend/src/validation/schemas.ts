import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const bedroomSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z
    .string()
    .max(500, 'Description too long')
    .optional()
    .transform((val) => (val === undefined ? '' : val)),
})

export type BedroomFormData = z.infer<typeof bedroomSchema>

export const sensorSchema = z
  .object({
    bedroomId: z.number().int().positive('Bedroom is required'),
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    type: z.enum(['temperature', 'humidity'], {
      errorMap: () => ({ message: 'Type must be temperature or humidity' }),
    }),
    unit: z.string().min(1, 'Unit is required').max(20, 'Unit too long'),
    minValue: z
      .number({
        required_error: 'Min value is required',
        invalid_type_error: 'Min value must be a number',
      })
      .finite('Min value must be a valid number'),
    maxValue: z
      .number({
        required_error: 'Max value is required',
        invalid_type_error: 'Max value must be a number',
      })
      .finite('Max value must be a valid number'),
    isActive: z.boolean().default(true),
  })
  .refine((data) => data.maxValue > data.minValue, {
    message: 'Max value must be greater than min value',
    path: ['maxValue'],
  })

export type SensorFormData = z.infer<typeof sensorSchema>
