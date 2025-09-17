import * as Sentry from "@sentry/nextjs";

// Sentry 초기화
export function initSentry() {
  if (process.env.NODE_ENV === "production" && process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      debug: false,
      beforeSend(event) {
        // 민감한 정보 제거
        if (event.request?.cookies) {
          delete event.request.cookies;
        }
        return event;
      },
    });
  }
}

// 에러 로깅
export function logError(error: Error, context?: Record<string, any>) {
  console.error("Error:", error.message, context);

  if (process.env.NODE_ENV === "production") {
    Sentry.captureException(error, {
      extra: context,
    });
  }
}

// 사용자 액션 로깅
export function logUserAction(
  action: string,
  userId: string,
  metadata?: Record<string, any>
) {
  console.log(`User Action: ${action}`, { userId, metadata });

  if (process.env.NODE_ENV === "production") {
    Sentry.addBreadcrumb({
      message: action,
      category: "user-action",
      data: { userId, ...metadata },
    });
  }
}

// 성능 모니터링
export function logPerformance(
  operation: string,
  duration: number,
  metadata?: Record<string, any>
) {
  console.log(`Performance: ${operation} took ${duration}ms`, metadata);

  if (process.env.NODE_ENV === "production") {
    Sentry.addBreadcrumb({
      message: operation,
      category: "performance",
      data: { duration, ...metadata },
    });
  }
}
