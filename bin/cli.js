#!/usr/bin/env node

// Этот файл будет точкой входа для CLI
// Он просто импортирует скомпилированный TypeScript код

import('../dist/cli/index.js').catch(err => {
    console.error('Ошибка запуска auto-testid:', err.message);
    process.exit(1);
});