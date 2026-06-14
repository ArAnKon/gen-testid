// src/core/GenTestId.ts
import * as fs from 'fs/promises';
import * as path from 'path';
import fg from 'fast-glob';
import {
    GenTestIdConfig,
    ElementContext,
    NamingStrategy,
    InjectionResult
} from './types.js';
import {
    HierarchicalStrategy,
    StableUuidStrategy,
    MinimalStrategy,
    SemanticStrategy
} from './strategies.js';
import { ElementCounter } from '../shared/element-counter.js';
import { parseVueFile } from '../shared/parser.js';

export class GenTestId {
    public config: Required<GenTestIdConfig>;
    private strategy: NamingStrategy;
    private counter: ElementCounter;

    constructor(config: GenTestIdConfig = {}) {
        this.config = {
            prefix: 'test',
            strategy: 'hierarchical',
            semanticModel: '',
            ollamaUrl: 'http://localhost:11434',
            excludeFiles: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**', '**/dist/**'],
            includeFiles: ['src/**/*.vue'],
            ...config
        } as Required<GenTestIdConfig>;

        this.counter = new ElementCounter();
        this.strategy = this.initStrategy();
    }

    private initStrategy(): NamingStrategy {
        switch (this.config.strategy) {
            case 'hierarchical':
                return new HierarchicalStrategy(this.config.prefix);
            case 'stable-uuid':
                return new StableUuidStrategy(this.config.prefix);
            case 'minimal':
                return new MinimalStrategy(this.config.prefix);
            case 'semantic':
                return new SemanticStrategy(
                    this.config.prefix,
                    this.config.semanticModel,
                    this.config.ollamaUrl
                );
            default:
                return new HierarchicalStrategy(this.config.prefix);
        }
    }

    public generateTestId(context: Omit<ElementContext, 'occurrence'>): string {
        const key = `${context.filePath}:${context.componentName}:${context.lineNumber || 'unknown'}`;
        const occurrence = this.counter.increment(key);

        const fullContext: ElementContext = {
            ...context,
            occurrence,
            lineNumber: context.lineNumber || 0
        };

        return this.strategy.generateId(fullContext);
    }

    public async processFile(filePath: string): Promise<InjectionResult> {
        try {
            if (this.shouldExcludeFile(filePath)) {
                return { filePath, injectedCount: 0, elements: [] };
            }

            let content = await fs.readFile(filePath, 'utf-8');

            //Добавляем testid
            let parseResult: { injectedCount: number; modifiedContent: string; elements: any[] } = {
                injectedCount: 0,
                modifiedContent: content,
                elements: []
            };

            if (filePath.endsWith('.vue')) {
                parseResult = await parseVueFile(content, filePath, this);
                if (parseResult.injectedCount > 0) {
                    content = parseResult.modifiedContent;
                }
            }

            //Save
            if (parseResult.injectedCount > 0) {
                await fs.writeFile(filePath, content, 'utf-8');
            }

            return {
                filePath,
                injectedCount: parseResult.injectedCount,
                elements: parseResult.elements
            };

        } catch (error) {
            console.error(`❌ Error processing ${filePath}:`, error);
            return { filePath, injectedCount: 0, elements: [] };
        }
    }

    private shouldExcludeFile(filePath: string): boolean {
        const relativePath = path.relative(process.cwd(), filePath);

        for (const pattern of this.config.excludeFiles) {
            if (pattern.includes('*')) {
                const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                if (regex.test(relativePath)) {
                    return true;
                }
            } else if (relativePath.includes(pattern)) {
                return true;
            }
        }

        return false;
    }

    public async processAllFiles(): Promise<InjectionResult[]> {
        console.log('🔍 Поиск файлов...');

        const files: string[] = [];

        for (const pattern of this.config.includeFiles) {
            try {
                const matches = await fg(pattern, {
                    ignore: this.config.excludeFiles,
                    absolute: true,
                    onlyFiles: true
                });
                files.push(...matches);
            } catch (error) {
                console.warn(`⚠️ Ошибка при поиске по паттерну ${pattern}:`, error);
            }
        }

        console.log(`📁 Найдено файлов: ${files.length}\n`);

        const results: InjectionResult[] = [];
        let totalTestIds = 0;

        for (const file of files) {
            console.log(`📄 Обработка: ${path.basename(file)}`);
            const result = await this.processFile(file);
            results.push(result);

            totalTestIds += result.injectedCount;

            if (result.injectedCount > 0) {
                console.log(`   ✅ Добавлено testid: ${result.injectedCount}\n`);
            }
        }

        if (totalTestIds > 0) {
            console.log(`\n🏷️  Всего добавлено testid: ${totalTestIds}`);
        }

        return results;
    }
}
