export class ElementCounter {
    private counters = new Map<string, number>();

    increment(key: string): number {
        const current = this.counters.get(key) || 0;
        const next = current + 1;
        this.counters.set(key, next);
        return next;
    }
}