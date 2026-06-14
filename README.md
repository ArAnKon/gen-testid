# GenTestID

CLI-инструмент для автоматического добавления атрибутов `data-testid` в шаблоны Vue-компонентов.

`gen-testid` находит элементы в секции `<template>`, пропускает элементы, у которых уже есть `data-testid`, генерирует идентификаторы по выбранной стратегии и сохраняет изменения непосредственно в `.vue`-файлы.

## Возможности

- обработка всех Vue-файлов проекта или конкретного списка файлов;
- четыре стратегии генерации идентификаторов;
- настройка префикса;
- исключение файлов по glob-шаблонам;
- использование локальной Ollama для семантических идентификаторов;
- автоматическое создание конфигурации `.gentestidrc`;
- добавление команды `testids` в `package.json`.

## Требования

- Node.js 20 или новее;
- Vue-проект с `.vue`-компонентами;
- `pnpm`, `npm` или другой совместимый пакетный менеджер;
- Ollama только для стратегии `semantic`.

## Установка

### Локальная установка через pnpm

Если исходный код `gen-testid` находится рядом с вашим проектом:

```bash
cd "/path/for/directory/"
pnpm add --save-dev "../gen-testid"
```

Проверка установки:

```bash
pnpm exec gen-testid --help
pnpm list gen-testid --depth=0
```

### Локальная установка через npm

Используйте этот вариант только в проектах, которые управляются npm:

```bash
npm install --save-dev "/path/for/directory/gen-testid"
```

Проверка:

```bash
npx gen-testid --help
```

Не смешивайте npm и pnpm в одном проекте. Если в `package.json` указано поле `"packageManager": "pnpm@..."`, устанавливайте CLI через `pnpm add`.

### Установка опубликованного пакета

После публикации `gen-testid` в npm registry:

```bash
pnpm add --save-dev gen-testid
```

или:

```bash
npm install --save-dev gen-testid
```

## Быстрый старт

Перейдите в корень Vue-проекта и выполните:

```bash
pnpm exec gen-testid init
pnpm exec gen-testid inject
```

Команда `init`:

1. предложит выбрать стратегию;
2. запросит префикс;
3. создаст `.gentestidrc`;
4. добавит в `package.json` скрипт `"testids": "gen-testid inject"`.

После этого запуск можно сократить до:

```bash
pnpm run testids
```

## Команды

### Общая справка

```bash
pnpm exec gen-testid --help
```

Для npm-проекта:

```bash
npx gen-testid --help
```

### Версия

```bash
pnpm exec gen-testid --version
```

### Инициализация

```bash
pnpm exec gen-testid init
```

Пример диалога:

```text
Выберите стратегию (1-4) [1]: 1
Префикс для testid [default: test]: e2e
```

Результат: в корне проекта появится `.gentestidrc`.

Справка по команде:

```bash
pnpm exec gen-testid init --help
```

### Обработка всех Vue-файлов

```bash
pnpm exec gen-testid inject
```

Без списка файлов CLI использует шаблоны `includeFiles` и `excludeFiles` из `.gentestidrc`.

### Обработка одного файла

```bash
pnpm exec gen-testid inject src/App.vue
```

### Обработка нескольких файлов

```bash
pnpm exec gen-testid inject \
  src/App.vue \
  src/components/LoginForm.vue \
  src/components/CheckoutButton.vue
```

### Выбор стратегии

```bash
pnpm exec gen-testid inject --strategy hierarchical
```

Короткая форма:

```bash
pnpm exec gen-testid inject -s hierarchical
```

Доступные значения:

| Стратегия | Назначение | Пример результата |
| --- | --- | --- |
| `hierarchical` | ID на основе файла, элемента, строки и номера вхождения | `test__app__button__line-12__elem-1` |
| `stable-uuid` | Детерминированный ID на основе MD5-хеша контекста | `test-550e8400-e29b-41d4-a716-446655440000` |
| `minimal` | Последовательный номер в рамках запуска | `test-1` |
| `semantic` | Короткий смысловой ID через локальную Ollama | `login-button` |

Примеры:

```bash
pnpm exec gen-testid inject -s hierarchical
pnpm exec gen-testid inject -s stable-uuid
pnpm exec gen-testid inject -s minimal
pnpm exec gen-testid inject -s semantic
```

### Настройка префикса

```bash
pnpm exec gen-testid inject --prefix e2e
```

Короткая форма:

```bash
pnpm exec gen-testid inject -p e2e
```

Пример результата:

```html
<button data-testid="e2e__app__button__line-12__elem-1">
  Сохранить
</button>
```

### Пользовательский файл конфигурации

```bash
pnpm exec gen-testid inject --config ./config/gen-testid.json
```

Короткая форма:

```bash
pnpm exec gen-testid inject -c ./config/gen-testid.json
```

### Комбинация параметров

```bash
pnpm exec gen-testid inject src/App.vue \
  --strategy hierarchical \
  --prefix e2e \
  --config .gentestidrc
```

Параметры командной строки `--strategy` и `--prefix` имеют приоритет над значениями из конфигурации.

### Справка по inject

```bash
pnpm exec gen-testid inject --help
```

Доступные опции:

```text
-c, --config <path>    путь к конфигурации
-s, --strategy <name>  стратегия именования
-p, --prefix <prefix>  префикс для testid
-h, --help             справка
```


## Конфигурация

По умолчанию CLI ищет `.gentestidrc` в текущей рабочей директории.

Пример:

```json
{
  "strategy": "hierarchical",
  "prefix": "test",
  "semanticModel": "",
  "ollamaUrl": "http://localhost:11434",
  "includeFiles": [
    "src/**/*.vue"
  ],
  "excludeFiles": [
    "**/*.test.*",
    "**/*.spec.*",
    "**/node_modules/**",
    "**/dist/**"
  ]
}
```

### Параметры конфигурации

| Поле | Тип | Значение по умолчанию | Описание |
| --- | --- | --- | --- |
| `strategy` | `string` | `hierarchical` | Стратегия генерации ID |
| `prefix` | `string` | `test` | Префикс идентификатора |
| `semanticModel` | `string` | пустая строка | Модель Ollama для `semantic` |
| `ollamaUrl` | `string` | `http://localhost:11434` | Адрес локального Ollama API |
| `includeFiles` | `string[]` | `src/**/*.vue` | Glob-шаблоны обрабатываемых файлов |
| `excludeFiles` | `string[]` | тесты, `node_modules`, `dist` | Glob-шаблоны исключений |

## Пример преобразования

До запуска:

```vue
<template>
  <form>
    <input type="email" />
    <button>Войти</button>
  </form>
</template>
```

Команда:

```bash
pnpm exec gen-testid inject src/components/LoginForm.vue --prefix e2e
```

После запуска:

```vue
<template>
  <form data-testid="e2e__loginform__form__line-2__elem-1">
    <input data-testid="e2e__loginform__input__line-3__elem-1" type="email" />
    <button data-testid="e2e__loginform__button__line-4__elem-1">Войти</button>
  </form>
</template>
```

Повторный запуск не добавляет второй `data-testid` элементам, у которых этот атрибут уже существует.

## Семантическая стратегия и Ollama

Установите Ollama и модель:

```bash
brew install ollama
ollama pull llama3.2:3b
```

Запустите сервер в отдельном терминале:

```bash
ollama serve
```

Создайте конфигурацию интерактивно:

```bash
pnpm exec gen-testid init
```

Введите:

```text
Выберите стратегию (1-4) [1]: 4
Модель (llama3.2:3b/mistral/gemma:2b) [llama3.2:3b]: llama3.2:3b
URL Ollama [http://localhost:11434]:
Префикс для testid [default: test]: test
```

Или запустите стратегию напрямую:

```bash
pnpm exec gen-testid inject --strategy semantic
```

Если Ollama недоступна или не вернула корректный ID, CLI использует `hierarchical` как резервную стратегию.

## Скрипты package.json

Рекомендуемая настройка:

```json
{
  "scripts": {
    "testids": "gen-testid inject"
  }
}
```

Запуск:

```bash
pnpm run testids
```

Для обработки конкретного файла лучше вызвать CLI напрямую:

```bash
pnpm exec gen-testid inject src/App.vue
```

## Локальная разработка CLI

Перейдите в репозиторий:

```bash
cd "/path/for/directory/gen-testid"
```

Установите зависимости и соберите проект:

```bash
pnpm install
pnpm run build
```

Запустите CLI напрямую:

```bash
node bin/cli.js --help
node bin/cli.js inject --help
```

Режим наблюдения TypeScript:

```bash
pnpm run dev
```

После изменения исходного кода пересоберите CLI:

```bash
pnpm run build
```

Проект, подключенный через `link:../gen-testid`, продолжит использовать эту локальную директорию.

## Удаление

В pnpm-проекте:

```bash
pnpm remove gen-testid
```

В npm-проекте:

```bash
npm uninstall gen-testid
```

При необходимости удалите конфигурацию и скрипт вручную:

```bash
rm .gentestidrc
```

Из `package.json` удалите:

```json
"testids": "gen-testid inject"
```

## Решение проблем

### npm: Cannot read properties of null (reading 'matches')

Обычно эта ошибка возникает, когда npm запускают внутри проекта, установленного через pnpm.

Проверьте `package.json`:

```json
"packageManager": "pnpm@10.15.1"
```

Если поле присутствует, используйте:

```bash
pnpm add --save-dev "../gen-testid"
```

### Команда gen-testid не найдена

Проверьте установку:

```bash
pnpm list gen-testid --depth=0
```

Запускайте локальный бинарный файл через пакетный менеджер:

```bash
pnpm exec gen-testid --help
```

### CLI не находит Vue-файлы

Проверьте текущую директорию:

```bash
pwd
```

Запускайте CLI из корня проекта и проверьте `includeFiles` в `.gentestidrc`:

```json
{
  "includeFiles": ["src/**/*.vue"]
}
```


## Полный список часто используемых команд

```bash
# Установка в pnpm-проект
pnpm add --save-dev "../gen-testid"

# Инициализация
pnpm exec gen-testid init

# Обработка всех Vue-файлов
pnpm exec gen-testid inject

# Обработка одного файла
pnpm exec gen-testid inject src/App.vue

# Обработка нескольких файлов
pnpm exec gen-testid inject src/App.vue src/components/LoginForm.vue

# Выбор стратегии
pnpm exec gen-testid inject --strategy hierarchical

# Настройка префикса
pnpm exec gen-testid inject --prefix e2e

# Пользовательская конфигурация
pnpm exec gen-testid inject --config .gentestidrc

# Запуск через package.json
pnpm run testids

# Справка и версия
pnpm exec gen-testid --help
pnpm exec gen-testid inject --help
pnpm exec gen-testid --version

# Удаление
pnpm remove gen-testid
```
