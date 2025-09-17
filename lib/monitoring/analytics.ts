// Google Analytics 4 설정
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

// 페이지뷰 추적
export const pageview = (url: string) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("config", GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// 이벤트 추적
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// 경매 관련 이벤트 추적
export const trackAuctionEvent = (
  eventType: string,
  itemId: string,
  metadata?: any
) => {
  event({
    action: eventType,
    category: "auction",
    label: itemId,
  });

  // 추가 메타데이터 로깅
  if (metadata) {
    console.log("Auction Event:", eventType, { itemId, metadata });
  }
};

// 사용자 행동 추적
export const trackUserAction = (
  action: string,
  category: string,
  metadata?: any
) => {
  event({
    action,
    category,
  });

  if (metadata) {
    console.log("User Action:", action, { category, metadata });
  }
};

// 전역 gtag 타입 선언
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}
