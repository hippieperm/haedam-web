import { z } from 'zod'

export const signupSchema = z.object({
  email: z.string().email('유효한 이메일 주소를 입력하세요'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다'),
  nickname: z.string().min(2, '닉네임은 최소 2자 이상이어야 합니다').optional(),
  phone: z.string().regex(/^010-\d{4}-\d{4}$/, '유효한 휴대폰 번호를 입력하세요 (010-xxxx-xxxx)').optional(),
})

export const loginSchema = z.object({
  email: z.string().email('유효한 이메일 주소를 입력하세요'),
  password: z.string().min(1, '비밀번호를 입력하세요'),
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>