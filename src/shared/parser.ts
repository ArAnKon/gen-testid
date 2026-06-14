// src/shared/parser.ts
import { parse, compileTemplate } from '@vue/compiler-sfc';
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

const NODE_TYPES = {
    ELEMENT: 1,
    ATTRIBUTE: 6,
    DIRECTIVE: 7
} as const;

const IGNORED_TAGS = new Set([
    'template', 'slot', 'component', 'keep-alive',
    'transition', 'transition-group'
]);

/**
 * Надёжно находит позицию для вставки атрибута в тег
 */
function findInsertPosition(tagSource: string, isSelfClosing: boolean): { offset: number; prefix: string } {
    if (isSelfClosing) {
        // Для <Comp ... /> — вставляем перед />
        const closingIndex = tagSource.lastIndexOf('/>');
        return { offset: closingIndex, prefix: '' };
    } else {
        // Для <Comp ...> — вставляем сразу после имени тега
        // Находим конец имени тега: <TagName[пробел|атрибут|>|\n]
        const tagNameMatch = tagSource.match(/^<([a-zA-Z][a-zA-Z0-9-]*)/);
        if (!tagNameMatch) return { offset: 1, prefix: '' }; // fallback после <

        const afterTagName = tagSource.slice(tagNameMatch[0].length);
        // Если сразу после имени тега идёт > — вставляем перед ним
        if (afterTagName.trimStart().startsWith('>')) {
            const gtIndex = tagSource.indexOf('>', tagNameMatch[0].length);
            return { offset: gtIndex, prefix: '' };
        }
        // Иначе вставляем после имени тега (до первого пробела/атрибута)
        return { offset: tagNameMatch[0].length, prefix: ' ' };
    }
}

export async function parseVueFile(
    content: string,
    filePath: string,
    genTestId: GenTestId
): Promise<ParseResult> {
    const result: ParseResult = {
        modifiedContent: content,
        injectedCount: 0,
        elements: []
    };

    try {
        const { descriptor, errors } = parse(content, { filename: filePath });

        if (errors?.length > 0) {
            console.warn(`⚠️ Ошибки парсинга SFC ${filePath}:`, errors.map(e => e.message || String(e)));
            return result;
        }

        if (!descriptor.template) {
            console.log(`   ⚪ Нет секции <template> в ${filePath}`);
            return result;
        }

        const templateSource = descriptor.template.content;
        const templateStartOffset = descriptor.template.loc.start.offset;

        const { ast } = compileTemplate({
            source: templateSource,
            filename: filePath,
            id: 'gen-testid-injector'
        });

        if (!ast?.children) return result;

        const injections: Array<{
            offset: number;
            insertText: string;
            testId: string;
            tag: string;
            lineNumber: number;
        }> = [];

        function walk(node: any) {
            if (node.type !== NODE_TYPES.ELEMENT) return;

            const tag = node.tag;
            if (!tag || IGNORED_TAGS.has(tag.toLowerCase())) {
                processChildren(node);
                return;
            }

            const hasDataTestId = node.props?.some((prop: any) => {
                if (prop.type === NODE_TYPES.ATTRIBUTE) {
                    return prop.name === 'data-testid';
                }
                if (prop.type === NODE_TYPES.DIRECTIVE && prop.name === 'bind' && prop.arg) {
                    return (prop.arg as any)?.content === 'data-testid';
                }
                return false;
            });

            if (!hasDataTestId) {
                const startOffset = templateStartOffset + node.loc.start.offset;
                const endOffset = templateStartOffset + node.loc.end.offset;
                const lineNumber = content.slice(0, startOffset).split('\n').length;
                const fullTagSource = content.slice(startOffset, endOffset);
                const isSelfClosing = fullTagSource.trimEnd().endsWith('/>');

                const testId = genTestId.generateTestId({
                    componentName: tag,
                    filePath,
                    lineNumber,
                    metadata: {
                        elementType: `vue:${tag}`,
                        textContent: tag,
                        attributes: {}
                    }
                });

                // 🔥 Надёжное определение позиции вставки
                const { offset: relativeOffset, prefix } = findInsertPosition(fullTagSource, isSelfClosing);
                const insertOffset = startOffset + relativeOffset;
                const insertText = ` ${prefix}data-testid="${testId}"`;

                injections.push({ offset: insertOffset, insertText, testId, tag, lineNumber });
                result.elements.push({ testId, lineNumber, elementType: `vue:${tag}` });
                result.injectedCount++;
                console.log(`   ✅ ${tag} (строка ${lineNumber}): ${testId}`);
            }

            processChildren(node);
        }

        function processChildren(node: any) {
            if (node.children && Array.isArray(node.children)) {
                for (const child of node.children) {
                    walk(child);
                }
            }
        }

        for (const child of ast.children) {
            walk(child);
        }

        // Применяем инъекции от конца к началу
        if (injections.length > 0) {
            injections.sort((a, b) => b.offset - a.offset);
            let modified = content;
            for (const inj of injections) {
                modified = modified.slice(0, inj.offset) + inj.insertText + modified.slice(inj.offset);
            }
            result.modifiedContent = modified;
        }

        console.log(`   📊 Всего добавлено testid: ${result.injectedCount}`);

    } catch (error) {
        console.warn(`⚠️ Ошибка при парсинге Vue файла ${filePath}:`, error);
    }

    return result;
}
