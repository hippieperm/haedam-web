import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 관리자 계정 생성
  const adminPassword = process.env.ADMIN_PASSWORD || 'ss135798!!'
  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@bonsai-auction.com' },
    update: {},
    create: {
      email: 'admin@bonsai-auction.com',
      passwordHash: hashedPassword,
      role: UserRole.ADMIN,
      name: '관리자',
      nickname: 'Admin',
      isVerified: true,
    },
  })

  console.log({ admin })

  // 테스트용 판매자 계정 생성
  const seller = await prisma.user.upsert({
    where: { email: 'seller@example.com' },
    update: {},
    create: {
      email: 'seller@example.com',
      passwordHash: await bcrypt.hash('seller123', 10),
      role: UserRole.SELLER,
      name: '김판매',
      nickname: '분재명인',
      phone: '010-1234-5678',
      isVerified: true,
      addresses: {
        create: {
          label: '집',
          receiver: '김판매',
          phone: '010-1234-5678',
          addr1: '서울시 강남구 테헤란로 123',
          addr2: '분재빌딩 5층',
          postcode: '06234',
          isDefault: true,
        },
      },
    },
  })

  console.log({ seller })

  // 테스트용 구매자 계정 생성
  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@example.com' },
    update: {},
    create: {
      email: 'buyer@example.com',
      passwordHash: await bcrypt.hash('buyer123', 10),
      role: UserRole.USER,
      name: '이구매',
      nickname: '분재러버',
      phone: '010-9876-5432',
      isVerified: true,
      addresses: {
        create: {
          label: '집',
          receiver: '이구매',
          phone: '010-9876-5432',
          addr1: '서울시 서초구 서초대로 456',
          addr2: '한국아파트 101동 202호',
          postcode: '06789',
          isDefault: true,
        },
      },
    },
  })

  console.log({ buyer })

  // 태그 생성
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { slug: 'premium' },
      update: {},
      create: { name: '프리미엄', slug: 'premium' },
    }),
    prisma.tag.upsert({
      where: { slug: 'award-winning' },
      update: {},
      create: { name: '수상작', slug: 'award-winning' },
    }),
    prisma.tag.upsert({
      where: { slug: 'rare' },
      update: {},
      create: { name: '희귀종', slug: 'rare' },
    }),
    prisma.tag.upsert({
      where: { slug: 'beginner-friendly' },
      update: {},
      create: { name: '초보자용', slug: 'beginner-friendly' },
    }),
  ])

  console.log({ tags })

  // 샘플 상품 생성
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const items = await Promise.all([
    prisma.item.create({
      data: {
        sellerId: seller.id,
        title: '50년생 흑송 문인목',
        description: '수형이 아름다운 50년생 흑송입니다. 관리 상태가 매우 우수하며, 2022년 전국분재대전에서 우수상을 수상한 작품입니다.',
        species: '흑송',
        style: '문인목',
        sizeClass: '중품',
        heightCm: 45,
        crownWidthCm: 35,
        trunkDiameterCm: 8,
        ageYearsEst: 50,
        healthNotes: '건강 상태 매우 양호, 병충해 없음',
        originNotes: '경북 영주산',
        careHistory: '매년 봄 전정, 2년마다 분갈이, 유기농 비료 사용',
        coverImageUrl: 'https://via.placeholder.com/600x400',
        status: 'LIVE',
        startPrice: 500000,
        currentPrice: 500000,
        buyNowPrice: 2000000,
        reservePrice: 800000,
        bidStep: 10000,
        startsAt: now,
        endsAt: nextWeek,
        autoExtendMinutes: 2,
        shippingMethod: 'FREIGHT',
        shippingFeePolicy: '착불',
        packagingNotes: '특수 포장 필요',
        media: {
          create: [
            {
              url: 'https://via.placeholder.com/600x400',
              type: 'IMAGE',
              sort: 1,
            },
            {
              url: 'https://via.placeholder.com/600x400',
              type: 'IMAGE',
              sort: 2,
            },
          ],
        },
        tags: {
          create: [
            { tagId: tags[0].id },
            { tagId: tags[1].id },
          ],
        },
      },
    }),
    prisma.item.create({
      data: {
        sellerId: seller.id,
        title: '진백 소품분 15년생',
        description: '컴팩트한 수형의 진백 소품입니다. 초보자도 관리하기 쉬우며, 실내에서도 기를 수 있습니다.',
        species: '진백',
        style: '직간',
        sizeClass: '소품',
        heightCm: 20,
        crownWidthCm: 15,
        trunkDiameterCm: 3,
        ageYearsEst: 15,
        healthNotes: '건강 양호',
        originNotes: '국내 생산',
        careHistory: '정기 관리 중',
        coverImageUrl: 'https://via.placeholder.com/600x400',
        status: 'SCHEDULED',
        startPrice: 150000,
        currentPrice: 150000,
        buyNowPrice: 500000,
        bidStep: 5000,
        startsAt: tomorrow,
        endsAt: nextWeek,
        autoExtendMinutes: 3,
        shippingMethod: 'COURIER',
        shippingFeePolicy: '무료배송',
        media: {
          create: [
            {
              url: 'https://via.placeholder.com/600x400',
              type: 'IMAGE',
              sort: 1,
            },
          ],
        },
        tags: {
          create: [
            { tagId: tags[3].id },
          ],
        },
      },
    }),
  ])

  console.log({ items })

  // 샘플 입찰 생성
  const bids = await Promise.all([
    prisma.bid.create({
      data: {
        itemId: items[0].id,
        bidderId: buyer.id,
        amount: 550000,
        isWinning: true,
      },
    }),
  ])

  // 현재가 업데이트
  await prisma.item.update({
    where: { id: items[0].id },
    data: { currentPrice: 550000 },
  })

  console.log({ bids })

  console.log('Seed data created successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })