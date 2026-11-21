export const createScanDedupe = (clearAfterMs = 800) => {
    let lastCode: string | null = null;
    let missingSince: number | null = null;

    return {
        accept(code: string) {
            missingSince = null;
            if (code === lastCode) return false;
            lastCode = code;
            return true;
        },
        miss(now = Date.now()) {
            if (lastCode === null) return;
            missingSince ??= now;
            if (now - missingSince >= clearAfterMs) {
                lastCode = null;
                missingSince = null;
            }
        },
    };
};
