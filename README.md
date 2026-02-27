# WARP Генератор

Упрощенный статический веб-сайт для генерации бесплатных конфигураций Cloudflare WARP для клиента AmneziaWG.

## Функциональность

- Генерация конфигураций для AmneziaWG (три варианта AWG 1.5)
- Фиксированные настройки DNS (Cloudflare 1.1.1.1)
- Полный туннель (0.0.0.0/0, ::/0)
- Автоматический выбор случайных endpoint-серверов Cloudflare
- Скачивание сгенерированных конфигураций в формате .conf
- Кнопки для скачивания клиента AmneziaWG (Android/iOS)

## Структура проекта

```
.
├── src/
│   ├── index.html          # Основная HTML-страница (упрощенная)
│   ├── index.js            # Логика генерации конфигураций (только AWG)
│   ├── styles.css          # Стили (центрированный интерфейс)
│   ├── logo.svg            # Логотип
│   ├── cloud.ico           # Иконка
│   ├── AWG.webp            # Иконка AmneziaWG
│   └── *.webp              # Дополнительные иконки (не используются)
├── package.json            # Конфигурация npm (для скриптов)
├── _redirects              # Правила перенаправления для Cloudflare Pages
├── _headers                # HTTP-заголовки безопасности
├── .gitignore              # Игнорируемые файлы
├── Dockerfile              # Контейнеризация (nginx)
└── README.md               # Документация
```

## Запуск через Docker

Проект включает Dockerfile для контейнеризации. Это полезно для локального тестирования или развертывания на любом хостинге с поддержкой Docker.

### Сборка образа

```bash
docker build -t warp-generator .
```

### Запуск контейнера

```bash
docker run -d -p 8080:80 --name warp-generator warp-generator
```

После запуска приложение будет доступно по адресу: http://localhost:8080

### Остановка контейнера

```bash
docker stop warp-generator
docker rm warp-generator
```

### Альтернативный запуск с помощью Docker Compose

Создайте файл `docker-compose.yml`:

```yaml
version: '3.8'
services:
  warp-generator:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
```

Запустите:

```bash
docker-compose up -d
```

## Деплой на Cloudflare Pages

Проект полностью готов для деплоя на Cloudflare Pages.

### Автоматический деплой через Git

1. Запушите код в Git-репозиторий (GitHub, GitLab, Bitbucket)
2. Войдите в [Cloudflare Dashboard](https://dash.cloudflare.com/)
3. Перейдите в **Pages** → **Create a project**
4. Выберите ваш репозиторий
5. Настройки сборки:
   - **Build command**: (оставить пустым, так как проект статический)
   - **Build output directory**: `src`
   - **Root directory**: (оставить по умолчанию)
6. Нажмите **Save and Deploy**

### Ручной деплой через Wrangler

Установите [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/):

```bash
npm install -g wrangler
```

Авторизуйтесь:

```bash
wrangler login
```

Деплой:

```bash
wrangler pages deploy src --project-name=warp-generator
```

### Локальная разработка

Для локального запуска используйте любой HTTP-сервер:

```bash
# С использованием Python
python3 -m http.server 8000 --directory src

# Или с использованием Node.js (если установлен)
npx serve src
```

## Конфигурационные файлы

### `_redirects`

Файл содержит правила перенаправления для Cloudflare Pages. По умолчанию пуст.

### `_headers`

Настраивает HTTP-заголовки для улучшения безопасности:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Content-Security-Policy` с ограничениями для безопасной загрузки ресурсов

### `package.json`

Содержит метаданные проекта и скрипты для разработки.

## Безопасность

- Все внешние ресурсы загружаются по HTTPS
- Используется CSP для предотвращения XSS-атак
- Сессионные данные кэшируются локально (не сохраняются на сервере)
- IP-адреса получаются с доверенного источника `iplist.opencck.org`

## Лицензия

MIT

## Благодарности

- Основано на [warp.llimonix.dev](https://warp.llimonix.dev)
- Иконки от соответствующих проектов
- IP-списки от [iplist.opencck.org](https://iplist.opencck.org)