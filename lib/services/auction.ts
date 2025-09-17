import { prisma } from '@/lib/prisma'
import { ItemStatus } from '@prisma/client'

export class AuctionService {
  // Check if auction should start
  static async startScheduledAuctions() {
    const now = new Date()

    const itemsToStart = await prisma.item.findMany({
      where: {
        status: ItemStatus.SCHEDULED,
        startsAt: {
          lte: now,
        },
      },
    })

    for (const item of itemsToStart) {
      await prisma.item.update({
        where: { id: item.id },
        data: {
          status: ItemStatus.LIVE,
          currentPrice: item.startPrice,
        },
      })

      // Create notification for watchers
      const watchlists = await prisma.watchlist.findMany({
        where: { itemId: item.id },
        include: { user: true },
      })

      for (const watchlist of watchlists) {
        await prisma.notification.create({
          data: {
            userId: watchlist.userId,
            type: 'AUCTION_START',
            title: '경매 시작',
            message: `관심 상품 "${item.title}"의 경매가 시작되었습니다.`,
            data: {
              itemId: item.id,
              itemTitle: item.title,
            },
          },
        })
      }
    }

    return itemsToStart.length
  }

  // Check if auction should end
  static async endExpiredAuctions() {
    const now = new Date()

    const itemsToEnd = await prisma.item.findMany({
      where: {
        status: ItemStatus.LIVE,
        endsAt: {
          lte: now,
        },
      },
      include: {
        bids: {
          orderBy: { amount: 'desc' },
          take: 1,
          include: { bidder: true },
        },
      },
    })

    for (const item of itemsToEnd) {
      const highestBid = item.bids[0]
      let status = ItemStatus.ENDED

      // Check if reserve price is met
      if (item.reservePrice && (!highestBid || highestBid.amount < item.reservePrice)) {
        status = ItemStatus.ENDED // Will be handled as "reserve not met"
      }

      await prisma.item.update({
        where: { id: item.id },
        data: { status },
      })

      // Create order if there's a winning bid and reserve is met
      if (highestBid && (!item.reservePrice || highestBid.amount >= item.reservePrice)) {
        const buyerPremium = highestBid.amount * 0.07 // 7% buyer premium
        const sellerFee = highestBid.amount * 0.10 // 10% seller fee
        const totalAmount = highestBid.amount + buyerPremium

        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        await prisma.order.create({
          data: {
            orderNumber,
            itemId: item.id,
            buyerId: highestBid.bidderId,
            finalPrice: highestBid.amount,
            buyerPremium,
            sellerFee,
            totalAmount,
            paymentStatus: 'PENDING',
          },
        })

        // Update winning bid
        await prisma.bid.update({
          where: { id: highestBid.id },
          data: { isWinning: true },
        })

        // Notify winner
        await prisma.notification.create({
          data: {
            userId: highestBid.bidderId,
            type: 'AUCTION_WON',
            title: '낙찰 축하합니다!',
            message: `"${item.title}" 낙찰을 축하합니다. 24시간 이내에 결제를 완료해주세요.`,
            data: {
              itemId: item.id,
              itemTitle: item.title,
              finalPrice: highestBid.amount,
              orderNumber,
            },
          },
        })
      } else {
        // Notify about no sale
        const watchlists = await prisma.watchlist.findMany({
          where: { itemId: item.id },
        })

        for (const watchlist of watchlists) {
          await prisma.notification.create({
            data: {
              userId: watchlist.userId,
              type: 'AUCTION_LOST',
              title: '경매 종료',
              message: `"${item.title}" 경매가 유찰되었습니다.`,
              data: {
                itemId: item.id,
                itemTitle: item.title,
                reason: item.reservePrice && (!highestBid || highestBid.amount < item.reservePrice)
                  ? 'RESERVE_NOT_MET'
                  : 'NO_BIDS',
              },
            },
          })
        }
      }
    }

    return itemsToEnd.length
  }

  // Process bid with auto-extension
  static async processBid(itemId: string, bidderId: string, amount: number, isProxy = false, maxProxyAmount?: number) {
    return await prisma.$transaction(async (tx) => {
      // Get item with lock
      const item = await tx.item.findUnique({
        where: { id: itemId },
        include: {
          bids: {
            orderBy: { amount: 'desc' },
            take: 1,
          },
        },
      })

      if (!item) {
        throw new Error('상품을 찾을 수 없습니다')
      }

      if (item.status !== ItemStatus.LIVE) {
        throw new Error('진행 중인 경매가 아닙니다')
      }

      if (item.sellerId === bidderId) {
        throw new Error('자신의 상품에는 입찰할 수 없습니다')
      }

      const now = new Date()
      if (now > item.endsAt) {
        throw new Error('경매가 종료되었습니다')
      }

      // Check minimum bid
      const currentPrice = item.currentPrice || item.startPrice
      const minimumBid = currentPrice + item.bidStep

      if (amount < minimumBid) {
        throw new Error(`최소 입찰가는 ${minimumBid.toLocaleString()}원입니다`)
      }

      // Create bid
      const bid = await tx.bid.create({
        data: {
          itemId,
          bidderId,
          amount,
          isProxy,
          maxProxyAmount,
        },
      })

      // Update item current price
      await tx.item.update({
        where: { id: itemId },
        data: { currentPrice: amount },
      })

      // Check for auto-extension
      let newEndTime = item.endsAt
      if (item.autoExtendMinutes) {
        const extendThreshold = new Date(item.endsAt.getTime() - (item.autoExtendMinutes * 60 * 1000))
        if (now > extendThreshold) {
          newEndTime = new Date(now.getTime() + (item.autoExtendMinutes * 60 * 1000))
          await tx.item.update({
            where: { id: itemId },
            data: { endsAt: newEndTime },
          })
        }
      }

      return { bid, item: { ...item, endsAt: newEndTime } }
    })
  }

  // Buy now
  static async buyNow(itemId: string, buyerId: string) {
    return await prisma.$transaction(async (tx) => {
      const item = await tx.item.findUnique({
        where: { id: itemId },
      })

      if (!item) {
        throw new Error('상품을 찾을 수 없습니다')
      }

      if (item.status !== ItemStatus.LIVE) {
        throw new Error('진행 중인 경매가 아닙니다')
      }

      if (!item.buyNowPrice) {
        throw new Error('즉시구매가 설정되지 않은 상품입니다')
      }

      if (item.sellerId === buyerId) {
        throw new Error('자신의 상품은 구매할 수 없습니다')
      }

      // End auction immediately
      await tx.item.update({
        where: { id: itemId },
        data: {
          status: ItemStatus.ENDED,
          currentPrice: item.buyNowPrice,
        },
      })

      // Create buy now bid
      const bid = await tx.bid.create({
        data: {
          itemId,
          bidderId: buyerId,
          amount: item.buyNowPrice,
          isWinning: true,
        },
      })

      // Create order
      const buyerPremium = item.buyNowPrice * 0.07
      const sellerFee = item.buyNowPrice * 0.10
      const totalAmount = item.buyNowPrice + buyerPremium

      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      const order = await tx.order.create({
        data: {
          orderNumber,
          itemId,
          buyerId,
          finalPrice: item.buyNowPrice,
          buyerPremium,
          sellerFee,
          totalAmount,
          paymentStatus: 'PENDING',
        },
      })

      return { bid, order }
    })
  }
}