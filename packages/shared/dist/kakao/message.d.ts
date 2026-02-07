interface SendMessageParams {
    userId: string;
    title: string;
    description: string;
    buttonText?: string;
    buttonUrl?: string;
}
/**
 * 카카오톡 나에게 보내기
 */
export declare function sendKakaoMessage({ userId, title, description, buttonText, buttonUrl }: SendMessageParams, retried?: boolean): Promise<boolean>;
/**
 * 숙소 예약 가능 알림 보내기
 */
export declare function notifyAvailable(userId: string, accommodationName: string, checkIn: Date, checkOut: Date, price: string | null, checkUrl: string): Promise<boolean>;
export {};
//# sourceMappingURL=message.d.ts.map