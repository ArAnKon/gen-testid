import { NamingStrategy, ElementContext } from './types.js';
export declare class HierarchicalStrategy implements NamingStrategy {
    private prefix;
    constructor(prefix?: string);
    generateId(context: ElementContext): string;
}
export declare class StableUuidStrategy implements NamingStrategy {
    private prefix;
    private cache;
    constructor(prefix?: string);
    generateId(context: ElementContext): string;
}
export declare class MinimalStrategy implements NamingStrategy {
    private prefix;
    private globalCounter;
    constructor(prefix?: string);
    generateId(): string;
}
export declare class SemanticStrategy implements NamingStrategy {
    private generator;
    private fallbackStrategy;
    constructor(prefix?: string, model?: string, ollamaUrl?: string);
    generateId(context: ElementContext): string;
}
