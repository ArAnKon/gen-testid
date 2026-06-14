#!/usr/bin/env node

// src/cli/index.ts
import { Command } from 'commander';
import { initCommand } from './init';
import { generateMapCommand } from './generate-map';
import { AutoTestId } from '../core/AutoTestId';
import * as path from 'path';
import * as fs from 'fs';

const program = new Command();

program
    .name('auto-testid')
    .description('Автоматическая простановка data-testid в React и Vue проектах')
    .version('1.0.0');

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
            const autoTestId = new AutoTestId({
                ...config,
                strategy: options.strategy || config.strategy,
                prefix: options.prefix || config.prefix,
                enabled: !options.dryRun
            });

            if (files.length === 0) {
                // Обрабатываем все файлы
                console.log('📁 Сканирование всех файлов...');
                const results = await autoTestId.processAllFiles();
                printResults(results, options.dryRun);
            } else {
                // Обрабатываем конкретные файлы
                console.log(`📁 Обработка ${files.length} файлов...`);
                const results = [];
                for (const file of files) {
                    const fullPath = path.resolve(process.cwd(), file);
                    const result = await autoTestId.processFile(fullPath);
                    results.push(result);
                }
                printResults(results, options.dryRun);
            }

        } catch (error) {
            console.error('\n❌ Ошибка:', error);
            process.exit(1);
        }
    });

program
    .command('generate-map')
    .description('Сгенерировать карту testid')
    .option('-o, --output <path>', 'путь для сохранения карты')
    .option('-c, --config <path>', 'путь к конфигурации')
    .action(generateMapCommand);

program.parse(process.argv);

/**
 * Загрузка конфигурации
 */
function loadConfig(configPath?: string): any {
    if (configPath) {
        const fullPath = path.resolve(process.cwd(), configPath);
        if (fs.existsSync(fullPath)) {
            return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        }
    }

    // Пробуем загрузить .autotestidrc
    const rcPath = path.resolve(process.cwd(), '.autotestidrc');
    if (fs.existsSync(rcPath)) {
        return JSON.parse(fs.readFileSync(rcPath, 'utf-8'));
    }

    // Пробуем загрузить из package.json
    const pkgPath = path.resolve(process.cwd(), 'package.json');
    if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        if (pkg.autoTestId) {
            return pkg.autoTestId;
        }
    }

    return {};
}

/**
 * Вывод результатов
 */
function printResults(results: any[], dryRun?: boolean) {
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
                console.log(`   📁 ${path.relative(process.cwd(), r.filePath)}: +${r.injectedCount}`);
            });

        if (results.filter(r => r.injectedCount > 0).length > 5) {
            console.log(`   ... и ещё ${results.filter(r => r.injectedCount > 0).length - 5} файлов`);
        }
    }
}