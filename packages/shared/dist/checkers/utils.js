import { RETRYABLE_ERRORS } from './constants';
export function isRetryableError(errorMessage) {
    if (errorMessage.includes('Navigation timeout')) {
        return false;
    }
    if (errorMessage.includes('Runtime.callFunctionOn timed out')) {
        return false;
    }
    return RETRYABLE_ERRORS.some((pattern) => errorMessage.includes(pattern));
}
export function formatDate(date) {
    return date.toISOString().split('T')[0];
}
export function delay(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
export function calculateNights(checkIn, checkOut) {
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
