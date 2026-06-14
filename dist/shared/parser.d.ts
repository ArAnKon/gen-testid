import { GenTestId } from '../core/GenTestId.js';
export interface ParseResult {
    modifiedContent: string;
    injectedCount: number;
    elements: Array<{
        testId: string;
        lineNumber: number;
        elementType: string;
    }>;
}
export declare function parseVueFile(content: string, filePath: string, genTestId: GenTestId): Promise<ParseResult>;
