// src/core/strategies.ts
import { NamingStrategy, ElementContext } from './types.js';
import { createHash } from 'crypto';
import { SemanticGenerator } from './semantic-generator.js';

export class HierarchicalStrategy implements NamingStrategy {
    constructor(private prefix: string = 'test') {}

    generateId(context: ElementContext): string {
        const { componentName, occurrence } = context;

        const fileName = context.filePath
            .split('/')
            .pop()
            ?.replace(/\.[^/.]+$/, '') || '';

        const lineNumber = context.lineNumber || 0;
        const tagType = context.metadata?.elementType?.split(':')[1] || componentName;

        const parts = [
            this.prefix,
            fileName,
            tagType,
            `line-${lineNumber}`,
            `elem-${occurrence}`
        ].filter(Boolean);

        return parts.join('__').toLowerCase();
    }
}

export class StableUuidStrategy implements NamingStrategy {
    private cache = new Map<string, string>();

    constructor(private prefix: string = 'test') {}

    generateId(context: ElementContext): string {
        const key = `${context.filePath}:${context.componentName}:${context.lineNumber}:${context.occurrence}`;

        if (!this.cache.has(key)) {
            const hash = createHash('md5').update(key).digest('hex');
            const uuid = [
                hash.substring(0, 8),
                hash.substring(8, 12),
                hash.substring(12, 16),
                hash.substring(16, 20),
                hash.substring(20, 32)
            ].join('-');

            this.cache.set(key, `${this.prefix}-${uuid}`);
        }

        return this.cache.get(key)!;
    }
}

export class MinimalStrategy implements NamingStrategy {
    private globalCounter = 0;

    constructor(private prefix: string = 'test') {}

    generateId(): string {
        return `${this.prefix}-${++this.globalCounter}`;
    }
}

export class SemanticStrategy implements NamingStrategy {
    private generator: SemanticGenerator;
    private fallbackStrategy: NamingStrategy;

    constructor(prefix: string = 'test', model?: string, ollamaUrl?: string) {
        console.log('🤖 Инициализация семантической стратегии...');
        this.generator = new SemanticGenerator({
            model: model || 'llama3.2:3b',
            ollamaUrl: ollamaUrl || 'http://localhost:11434'
        });
        this.fallbackStrategy = new HierarchicalStrategy(prefix);
    }

    generateId(context: ElementContext): string {
        // Пробуем получить семантический ID
        const semanticId = this.generator.generateSemanticIdSync(context);

        if (semanticId && semanticId.length > 0) {
            return semanticId;
        }

        // Fallback
        return this.fallbackStrategy.generateId(context);
    }
}
