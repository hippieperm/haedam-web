import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ItemStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as ItemStatus | null
    const species = searchParams.get('species')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'newest'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      status: status || ItemStatus.LIVE,
      deletedAt: null,
    }

    if (species) {
      where.species = { contains: species, mode: 'insensitive' }
    }

    if (minPrice || maxPrice) {
      where.currentPrice = {}
      if (minPrice) where.currentPrice.gte = parseFloat(minPrice)
      if (maxPrice) where.currentPrice.lte = parseFloat(maxPrice)
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { species: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Build order by
    let orderBy: any = { createdAt: 'desc' }
    switch (sort) {
      case 'price_asc':
        orderBy = { currentPrice: 'asc' }
        break
      case 'price_desc':
        orderBy = { currentPrice: 'desc' }
        break
      case 'ending_soon':
        orderBy = { endsAt: 'asc' }
        break
      case 'most_watched':
        orderBy = { watchlists: { _count: 'desc' } }
        break
      case 'most_bids':
        orderBy = { bids: { _count: 'desc' } }
        break
    }

    const items = await prisma.item.findMany({
      where,
      include: {
        seller: {
          select: { id: true, name: true, nickname: true },
        },
        media: {
          orderBy: { sort: 'asc' },
          take: 1,
        },
        _count: {
          select: { bids: true, watchlists: true },
        },
        bids: {
          orderBy: { amount: 'desc' },
          take: 1,
          select: { amount: true, createdAt: true },
        },
      },
      orderBy,
      skip,
      take: limit,
    })

    const total = await prisma.item.count({ where })

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}