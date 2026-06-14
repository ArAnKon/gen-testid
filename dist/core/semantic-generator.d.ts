import { ElementContext } from './types.js';
export interface SemanticGeneratorConfig {
    model?: string;
    ollamaUrl?: string;
}
export declare class SemanticGenerator {
    private model;
    private ollamaUrl;
    private cache;
    private idCounter;
    private isAvailableCache;
    constructor(config?: SemanticGeneratorConfig);
    private checkAvailability;
    generateSemanticIdSync(context: ElementContext): string | null;
    private buildPrompt;
    private generateWithOllamaSync;
    private cleanId;
}
