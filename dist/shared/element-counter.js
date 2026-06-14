export class ElementCounter {
    constructor() {
        this.counters = new Map();
    }
    increment(key) {
        const current = this.counters.get(key) || 0;
        const next = current + 1;
        this.counters.set(key, next);
        return next;
    }
}
