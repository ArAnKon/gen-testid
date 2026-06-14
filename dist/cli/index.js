#!/usr/bin/env node
import { Command } from 'commander';
import { GenTestId } from '../core/GenTestId.js';
import { initCommand } from './init.js';
import * as path from 'path';
import * as fs from 'fs';
const program = new Command();
program
    .name('gen-testid')
    .description('Автоматическая простановка data-testid в Vue проектах')
    .version('1.0.1');
program
    .command('init')
    .description('Инициализация конфигурации')
    .action(initCommand);
program
    .command('inject [files...]')
    .description('Проставить testid в указанные файлы')
    .option('-c, --config <path>', 'путь к конфигурации')
    .option('-s, --strategy <name>', 'стратегия именования')
    .option('-p, --prefix <prefix>', 'префикс для testid')
    .option('-d, --dry-run', 'пробный запуск без изменений')
    .action(async (files, options) => {
    console.log('🔍 Инжекция testid...\n');
    try {
        const config = loadConfig(options.config);
        const genTestId = new GenTestId({
            ...config,
            strategy: options.strategy || config.strategy,
            prefix: options.prefix || config.prefix
        });
        if (files.length === 0) {
            console.log('📁 Сканирование всех Vue файлов...');
            const results = await genTestId.processAllFiles();
            printResults(results, options.dryRun);
        }
        else {
            console.log(`📁 Обработка ${files.length} файлов...`);
            const results = [];
            for (const file of files) {
                const fullPath = path.resolve(process.cwd(), file);
                const result = await genTestId.processFile(fullPath);
                results.push(result);
            }
            printResults(results, options.dryRun);
        }
    }
    catch (error) {
        console.error('\n❌ Ошибка:', error);
        process.exit(1);
    }
});
program.parse(process.argv);
function loadConfig(configPath) {
    if (configPath) {
        const fullPath = path.resolve(process.cwd(), configPath);
        if (fs.existsSync(fullPath)) {
            return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        }
    }
    const rcPath = path.resolve(process.cwd(), '.gentestidrc');
    if (fs.existsSync(rcPath)) {
        return JSON.parse(fs.readFileSync(rcPath, 'utf-8'));
    }
    return {};
}
function printResults(results, dryRun) {
    const total = results.reduce((sum, r) => sum + r.injectedCount, 0);
    const filesWithChanges = results.filter(r => r.injectedCount > 0).length;
    console.log(`\n${dryRun ? '📋' : '✅'} Результаты:`);
    console.log(`   Всего файлов: ${results.length}`);
    console.log(`   Файлов с изменениями: ${filesWithChanges}`);
    console.log(`   ${dryRun ? 'Будет добавлено' : 'Добавлено'} testid: ${total}`);
    if (total > 0) {
        console.log('\n📝 Детали:');
        results
            .filter(r => r.injectedCount > 0)
            .slice(0, 5)
            .forEach(r => {
            const relativePath = path.relative(process.cwd(), r.filePath);
            console.log(`   📁 ${relativePath}: +${r.injectedCount} testid`);
        });
        if (results.filter(r => r.injectedCount > 0).length > 5) {
            console.log(`   ... и ещё ${results.filter(r => r.injectedCount > 0).length - 5} файлов`);
        }
    }
}
