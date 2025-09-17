import { prisma } from "@/lib/prisma";

export interface PaymentRequest {
  orderId: string;
  amount: number;
  buyerId: string;
  paymentMethod: "CARD" | "BANK_TRANSFER" | "VIRTUAL_ACCOUNT";
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  error?: string;
  redirectUrl?: string;
}

export class PaymentService {
  // 토스페이먼츠 연동 (예시)
  static async createPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      // 실제 토스페이먼츠 API 호출
      const tossResponse = await this.callTossPaymentAPI(request);

      if (tossResponse.success) {
        // 주문 상태 업데이트
        await prisma.order.update({
          where: { id: request.orderId },
          data: {
            paymentId: tossResponse.paymentId,
            paymentStatus: "PROCESSING",
            paymentMethod: request.paymentMethod,
          },
        });
      }

      return tossResponse;
    } catch (error) {
      console.error("Payment creation failed:", error);
      return {
        success: false,
        error: "결제 생성 중 오류가 발생했습니다.",
      };
    }
  }

  // 결제 승인 처리
  static async confirmPayment(
    paymentId: string,
    orderId: string
  ): Promise<PaymentResult> {
    try {
      // 토스페이먼츠 결제 승인 API 호출
      const confirmResponse = await this.callTossConfirmAPI(paymentId);

      if (confirmResponse.success) {
        // 주문 상태 업데이트
        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: "PAID",
            paidAt: new Date(),
          },
        });

        // 정산 스케줄 생성
        await this.schedulePayout(orderId);
      }

      return confirmResponse;
    } catch (error) {
      console.error("Payment confirmation failed:", error);
      return {
        success: false,
        error: "결제 승인 중 오류가 발생했습니다.",
      };
    }
  }

  // 환불 처리
  static async refundPayment(
    orderId: string,
    amount?: number
  ): Promise<PaymentResult> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { item: true },
      });

      if (!order || !order.paymentId) {
        return { success: false, error: "주문을 찾을 수 없습니다." };
      }

      const refundAmount = amount || order.totalAmount;

      // 토스페이먼츠 환불 API 호출
      const refundResponse = await this.callTossRefundAPI(
        order.paymentId,
        refundAmount
      );

      if (refundResponse.success) {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: "REFUNDED",
            canceledAt: new Date(),
          },
        });
      }

      return refundResponse;
    } catch (error) {
      console.error("Payment refund failed:", error);
      return {
        success: false,
        error: "환불 처리 중 오류가 발생했습니다.",
      };
    }
  }

  // 정산 스케줄 생성
  private static async schedulePayout(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { item: true },
    });

    if (!order) return;

    const sellerId = order.item.sellerId;
    const payoutAmount = order.finalPrice - order.sellerFee;
    const scheduledAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7일 후

    await prisma.payout.create({
      data: {
        orderId,
        sellerId,
        amount: payoutAmount,
        status: "SCHEDULED",
        scheduledAt,
      },
    });
  }

  // 토스페이먼츠 API 호출 (실제 구현 필요)
  private static async callTossPaymentAPI(request: PaymentRequest) {
    // 실제 토스페이먼츠 API 연동 코드
    return {
      success: true,
      paymentId: `toss_${Date.now()}`,
      redirectUrl: `https://checkout.tosspayments.com/payment/${Date.now()}`,
    };
  }

  private static async callTossConfirmAPI(paymentId: string) {
    // 실제 토스페이먼츠 결제 승인 API 코드
    return { success: true };
  }

  private static async callTossRefundAPI(paymentId: string, amount: number) {
    // 실제 토스페이먼츠 환불 API 코드
    return { success: true };
  }
}
