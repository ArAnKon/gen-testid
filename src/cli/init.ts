// src/cli/init.ts
import * as fs from 'fs/promises';
import * as path from 'path';
import * as readline from 'readline';

export async function initCommand() {
    console.log('🚀 Инициализация gen-testid для Vue...\n');

    try {
        console.log('📋 Доступные стратегии:');
        console.log('   1. hierarchical (default) - иерархические ID (test__Component__elem-1)');
        console.log('   2. stable-uuid - стабильные UUID');
        console.log('   3. minimal - простые номера');
        console.log('   4. semantic - умные ID через Ollama (бесплатно, локально)\n');

        const strategyChoice = await askQuestion('Выберите стратегию (1-4) [1]: ');

        let strategy = 'hierarchical';
        let semanticModel = '';
        let ollamaUrl = '';

        switch (strategyChoice) {
            case '2':
                strategy = 'stable-uuid';
                break;
            case '3':
                strategy = 'minimal';
                break;
            case '4':
                strategy = 'semantic';
                console.log('\n🤖 Настройка семантической генерации через Ollama:');
                console.log('   Требуется Ollama');
                console.log('   Установка: brew install ollama && ollama pull llama3.2:3b');
                console.log('   Запуск: ollama serve\n');

                const model = await askQuestion('Модель (llama3.2:3b/mistral/gemma:2b) [llama3.2:3b]: ');
                semanticModel = model || 'llama3.2:3b';

                const url = await askQuestion('URL Ollama [http://localhost:11434]: ');
                ollamaUrl = url || 'http://localhost:11434';

                console.log('\n💡 Совет: Запустите "ollama serve" в отдельном терминале');
                break;
            default:
                strategy = 'hierarchical';
        }

        const prefix = await askQuestion('Префикс для testid [default: test]: ');

        const config = {
            strategy,
            prefix: prefix || 'test',
            semanticModel: semanticModel,
            ollamaUrl: ollamaUrl,
            includeFiles: ['src/**/*.vue'],
            excludeFiles: ['**/*.test.*', '**/node_modules/**', '**/dist/**']
        };

        const configPath = path.join(process.cwd(), '.gentestidrc');
        await fs.writeFile(configPath, JSON.stringify(config, null, 2));
        console.log(`\n✅ Конфигурация сохранена в ${configPath}`);

        if (strategy === 'semantic') {
            console.log('\n🤖 Семантическая генерация активирована!');
            console.log('   При первом запуске ID будут иерархическими,');
            console.log('   а Ollama в фоне будет генерировать умные ID.');
        }

        await updatePackageJson();

        console.log('\n📝 Следующие шаги:');
        console.log('  1. Запустите Ollama: ollama serve');
        console.log('  2. Запустите "npx gen-testid inject" для простановки testid');
        console.log('  3. Готово! 🎉\n');

    } catch (error) {
        console.error('❌ Ошибка при инициализации:', error);
        process.exit(1);
    }
}

async function updatePackageJson() {
    try {
        const pkgPath = path.join(process.cwd(), 'package.json');
        const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));

        if (!pkg.scripts) {
            pkg.scripts = {};
        }

        if (!pkg.scripts['testids']) {
            pkg.scripts['testids'] = 'gen-testid inject';
        }

        await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2));
        console.log('✅ Скрипты добавлены в package.json');
    } catch (error) {
        console.log('⚠️  Не удалось обновить package.json');
    }
}

function askQuestion(question: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => {
        rl.question(question, answer => {
            rl.close();
            resolve(answer);
        });
    });
}
