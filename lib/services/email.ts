import sgMail from "@sendgrid/mail";

// SendGrid 설정
if (process.env.EMAIL_API_KEY) {
  sgMail.setApiKey(process.env.EMAIL_API_KEY);
}

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static fromEmail =
    process.env.EMAIL_FROM || "noreply@bonsai-auction.com";

  // 기본 이메일 발송
  static async sendEmail(template: EmailTemplate): Promise<boolean> {
    try {
      const msg = {
        to: template.to,
        from: this.fromEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      };

      await sgMail.send(msg);
      return true;
    } catch (error) {
      console.error("Email sending failed:", error);
      return false;
    }
  }

  // 회원가입 인증 이메일
  static async sendVerificationEmail(
    email: string,
    token: string,
    name: string
  ) {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">분재경매 회원가입을 환영합니다!</h2>
        <p>안녕하세요 ${name}님,</p>
        <p>분재경매 플랫폼에 가입해주셔서 감사합니다.</p>
        <p>아래 버튼을 클릭하여 이메일 인증을 완료해주세요:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            이메일 인증하기
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          이 링크는 24시간 후에 만료됩니다.
        </p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: "[분재경매] 이메일 인증을 완료해주세요",
      html,
    });
  }

  // 비밀번호 재설정 이메일
  static async sendPasswordResetEmail(
    email: string,
    token: string,
    name: string
  ) {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">비밀번호 재설정</h2>
        <p>안녕하세요 ${name}님,</p>
        <p>비밀번호 재설정 요청을 받았습니다.</p>
        <p>아래 버튼을 클릭하여 새 비밀번호를 설정해주세요:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            비밀번호 재설정하기
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          이 링크는 1시간 후에 만료됩니다. 요청하지 않으셨다면 이 이메일을 무시해주세요.
        </p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: "[분재경매] 비밀번호 재설정",
      html,
    });
  }

  // 경매 시작 알림
  static async sendAuctionStartNotification(
    email: string,
    itemTitle: string,
    itemId: string
  ) {
    const auctionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/items/${itemId}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">🎯 관심 상품 경매가 시작되었습니다!</h2>
        <p>안녕하세요,</p>
        <p>관심 목록에 추가하신 <strong>"${itemTitle}"</strong>의 경매가 시작되었습니다.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${auctionUrl}" 
             style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            경매 참여하기
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          경매에 참여하여 원하는 분재를 낙찰받으세요!
        </p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: `[분재경매] "${itemTitle}" 경매 시작`,
      html,
    });
  }

  // 낙찰 알림
  static async sendAuctionWonNotification(
    email: string,
    itemTitle: string,
    finalPrice: number,
    orderNumber: string
  ) {
    const orderUrl = `${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderNumber}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">🎉 축하합니다! 낙찰되었습니다!</h2>
        <p>안녕하세요,</p>
        <p><strong>"${itemTitle}"</strong> 경매에서 낙찰을 축하드립니다!</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>낙찰가:</strong> ${finalPrice.toLocaleString()}원</p>
          <p><strong>주문번호:</strong> ${orderNumber}</p>
        </div>
        <p>24시간 이내에 결제를 완료해주세요. 결제가 완료되면 배송 준비를 시작합니다.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${orderUrl}" 
             style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            결제하기
          </a>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: `[분재경매] "${itemTitle}" 낙찰 축하!`,
      html,
    });
  }

  // 입찰 경쟁 알림
  static async sendOutbidNotification(
    email: string,
    itemTitle: string,
    currentPrice: number,
    itemId: string
  ) {
    const auctionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/items/${itemId}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">⚡ 다른 입찰자가 더 높은 가격을 제시했습니다!</h2>
        <p>안녕하세요,</p>
        <p><strong>"${itemTitle}"</strong>에서 다른 입찰자가 더 높은 가격으로 입찰했습니다.</p>
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <p><strong>현재 최고가:</strong> ${currentPrice.toLocaleString()}원</p>
        </div>
        <p>아직 경매가 진행 중입니다. 다시 입찰해보세요!</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${auctionUrl}" 
             style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            다시 입찰하기
          </a>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: `[분재경매] "${itemTitle}" 입찰 경쟁 알림`,
      html,
    });
  }

  // 결제 완료 알림
  static async sendPaymentConfirmation(
    email: string,
    itemTitle: string,
    orderNumber: string,
    totalAmount: number
  ) {
    const orderUrl = `${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderNumber}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">✅ 결제가 완료되었습니다!</h2>
        <p>안녕하세요,</p>
        <p><strong>"${itemTitle}"</strong>의 결제가 성공적으로 완료되었습니다.</p>
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
          <p><strong>주문번호:</strong> ${orderNumber}</p>
          <p><strong>결제금액:</strong> ${totalAmount.toLocaleString()}원</p>
        </div>
        <p>판매자가 상품을 준비하여 배송할 예정입니다. 배송 시작 시 별도로 알려드리겠습니다.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${orderUrl}" 
             style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            주문 상세보기
          </a>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: `[분재경매] "${itemTitle}" 결제 완료`,
      html,
    });
  }
}
