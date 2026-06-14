import { GenTestIdConfig, ElementContext, InjectionResult } from './types.js';
export declare class GenTestId {
    config: Required<GenTestIdConfig>;
    private strategy;
    private counter;
    constructor(config?: GenTestIdConfig);
    private initStrategy;
    generateTestId(context: Omit<ElementContext, 'occurrence'>): string;
    processFile(filePath: string): Promise<InjectionResult>;
    private shouldExcludeFile;
    processAllFiles(): Promise<InjectionResult[]>;
}
