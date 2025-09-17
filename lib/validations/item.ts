import { z } from 'zod'
import { ItemStatus, ShippingMethod } from '@prisma/client'

export const createItemSchema = z.object({
  title: z.string().min(3, '제목은 최소 3자 이상이어야 합니다'),
  description: z.string().optional(),
  species: z.string().min(1, '수종을 선택하세요'),
  style: z.string().optional(),
  sizeClass: z.string().optional(),
  heightCm: z.number().positive().optional(),
  crownWidthCm: z.number().positive().optional(),
  trunkDiameterCm: z.number().positive().optional(),
  ageYearsEst: z.number().positive().optional(),
  healthNotes: z.string().optional(),
  originNotes: z.string().optional(),
  careHistory: z.string().optional(),
  coverImageUrl: z.string().url().optional(),
  startPrice: z.number().positive('시작가는 0보다 커야 합니다'),
  buyNowPrice: z.number().positive().optional(),
  reservePrice: z.number().positive().optional(),
  bidStep: z.number().positive('입찰 단위는 0보다 커야 합니다'),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  autoExtendMinutes: z.number().min(0).max(10).optional(),
  shippingMethod: z.nativeEnum(ShippingMethod),
  shippingFeePolicy: z.string().optional(),
  packagingNotes: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export const updateItemSchema = createItemSchema.partial().extend({
  id: z.string(),
})

export const updateItemStatusSchema = z.object({
  status: z.nativeEnum(ItemStatus),
  reason: z.string().optional(),
})

export type CreateItemInput = z.infer<typeof createItemSchema>
export type UpdateItemInput = z.infer<typeof updateItemSchema>
export type UpdateItemStatusInput = z.infer<typeof updateItemStatusSchema>