export type Strategy = 'hierarchical' | 'stable-uuid' | 'minimal' | 'semantic';
export interface GenTestIdConfig {
    prefix?: string;
    strategy?: Strategy;
    semanticModel?: string;
    ollamaUrl?: string;
    excludeFiles?: string[];
    includeFiles?: string[];
}
export interface ElementContext {
    componentName: string;
    filePath: string;
    lineNumber?: number;
    occurrence: number;
    metadata?: Record<string, any>;
}
export interface NamingStrategy {
    generateId(context: ElementContext): string;
}
export interface InjectionResult {
    filePath: string;
    injectedCount: number;
    elements: Array<{
        testId: string;
        lineNumber: number;
        elementType: string;
    }>;
}
