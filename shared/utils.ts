export function uid(prefix = "id") {
    // good enough for local keys
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
}

export function clampInt(n: number, min: number, max: number) {
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, Math.trunc(n)));
}
