import { execSync } from 'child_process';
export class SemanticGenerator {
    constructor(config = {}) {
        this.cache = new Map();
        this.idCounter = new Map();
        this.isAvailableCache = null;
        this.model = config.model || 'llama3.2:3b';
        this.ollamaUrl = config.ollamaUrl || 'http://localhost:11434';
        this.checkAvailability();
    }
    checkAvailability() {
        try {
            const result = execSync(`curl -s -o /dev/null -w "%{http_code}" ${this.ollamaUrl}/api/tags`, {
                encoding: 'utf-8',
                timeout: 2000
            });
            this.isAvailableCache = result === '200';
            if (this.isAvailableCache) {
                console.log('✅ Ollama доступен');
            }
            else {
                console.log('❌ Ollama не отвечает');
            }
        }
        catch (error) {
            this.isAvailableCache = false;
            console.log('❌ Ollama не доступен');
        }
    }
    generateSemanticIdSync(context) {
        if (!this.isAvailableCache) {
            return null;
        }
        const cacheKey = `${context.filePath}:${context.componentName}:${context.lineNumber}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        const prompt = this.buildPrompt(context);
        try {
            const semanticId = this.generateWithOllamaSync(prompt);
            if (semanticId && semanticId.length > 0 && semanticId !== 'id') {
                let cleanedId = this.cleanId(semanticId);
                //Проверяем дубликаты внутри файла одного
                const fileKey = context.filePath;
                const duplicateKey = `${fileKey}:${cleanedId}`;
                const count = this.idCounter.get(duplicateKey) || 0;
                if (count > 0) {
                    cleanedId = `${cleanedId}-${count + 1}`;
                }
                this.idCounter.set(duplicateKey, count + 1);
                this.cache.set(cacheKey, cleanedId);
                return cleanedId;
            }
        }
        catch (error) {
            //Ошибка - игнорируем
        }
        return null;
    }
    buildPrompt(context) {
        const tagName = context.metadata?.elementType?.split(':')[1] || context.componentName;
        const textContent = context.metadata?.textContent || '';
        const placeholder = context.metadata?.attributes?.placeholder || '';
        const inputType = context.metadata?.attributes?.type || '';
        const labelText = context.metadata?.attributes?.label || '';
        const isCustomComponent = context.metadata?.isCustomComponent || false;
        let elementDescription = '';
        if (isCustomComponent) {
            // Для кастомных компонентов используем label или имя компонента
            const componentName = tagName.replace(/Field$/, '').toLowerCase();
            elementDescription = labelText ? `"${labelText}" ${componentName}` : `${componentName} component`;
        }
        else if (tagName === 'button') {
            const buttonText = textContent || 'button';
            elementDescription = `"${buttonText}" button`;
        }
        else if (tagName === 'input') {
            if (inputType === 'email')
                elementDescription = 'email input';
            else if (inputType === 'password')
                elementDescription = 'password input';
            else if (inputType === 'checkbox')
                elementDescription = 'checkbox';
            else if (inputType === 'submit')
                elementDescription = 'submit button';
            else if (placeholder)
                elementDescription = `"${placeholder}" input`;
            else
                elementDescription = 'input field';
        }
        else {
            elementDescription = tagName;
        }
        return `Generate ONE short semantic test ID for: ${elementDescription}
${textContent ? `Text: "${textContent}"` : ''}
${placeholder ? `Placeholder: "${placeholder}"` : ''}
${labelText ? `Label: "${labelText}"` : ''}

Return ONLY the ID (lowercase, hyphens, max 25 chars).
Examples: login-button, email-input, password-field, user-name-input, submit-form

ID:`;
    }
    generateWithOllamaSync(prompt) {
        try {
            const escapedPrompt = JSON.stringify(prompt);
            const command = `curl -s -X POST ${this.ollamaUrl}/api/generate \
                -H "Content-Type: application/json" \
                -d '{"model":"${this.model}","prompt":${escapedPrompt},"stream":false,"options":{"temperature":0.2,"max_tokens":25}}'`;
            const result = execSync(command, {
                encoding: 'utf-8',
                timeout: 5000,
                maxBuffer: 1024 * 1024
            });
            const data = JSON.parse(result);
            let response = data.response?.trim() || null;
            if (response) {
                response = response.toLowerCase()
                    .replace(/[^a-z0-9-]/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '');
            }
            return response;
        }
        catch (error) {
            return null;
        }
    }
    cleanId(id) {
        if (!id)
            return '';
        let cleaned = id
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        if (cleaned.length > 35) {
            cleaned = cleaned.substring(0, 35);
        }
        return cleaned;
    }
}
