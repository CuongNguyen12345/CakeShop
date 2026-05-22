const ORDER_HISTORY_KEY = 'fleur-order-history';

export function readOrderHistoryCodes(): string[] {
    const rawCodes = JSON.parse(localStorage.getItem(ORDER_HISTORY_KEY) ?? '[]') as unknown;

    if (!Array.isArray(rawCodes)) {
        return [];
    }

    return rawCodes.filter((code): code is string => typeof code === 'string' && code.trim().length > 0);
}

export function rememberOrderCode(orderCode?: string | null): void {
    const cleanCode = orderCode?.replace(/^#/, '').trim();

    if (!cleanCode) {
        return;
    }

    const nextCodes = [cleanCode, ...readOrderHistoryCodes().filter((code) => code !== cleanCode)].slice(0, 20);

    localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(nextCodes));
}
