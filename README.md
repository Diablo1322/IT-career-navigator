# Карьерный навигатор IT — backend и аналитика

Рабочий репозиторий: серверная часть платформы (Go) и сервис аналитики вакансий (Python). Фронтенд ведёт Евгений в общем репозитории [kayeros/IT-career-navigator](https://github.com/kayeros/IT-career-navigator), туда же отсюда выгружается этот код (см. «Выгрузка в общий репозиторий»).

Что умеет платформа сейчас (срез 1 MVP): регистрация и вход, подтверждение почты и сброс пароля, каталог и roadmap 3 профессий (QA, Python, Java), отметки «Изучено», онбординг, оценка навыков с проверочными вопросами, % соответствия вакансиям и краткий отчёт о разрыве, план «что учить дальше» (без ИИ), лист ожидания, админка контента; сбор вакансий из SuperJob и «Работы России», поиск навыков, расчёт весов по расписанию.

## Структура

```
api/openapi.yaml        контракт API (OpenAPI 3.1) — источник истины для фронтенда
backend/                Go: сервисы api и worker
  cmd/api/              HTTP-сервер + команды migrate, seed, create-admin
  cmd/worker/           фоновые задачи (пока пустой: позже письма и ИИ-план)
  internal/<модуль>/    auth, content, progress, profile, assessment, match, plan, admin, …
  migrations/           SQL-миграции goose (00001…00008)
  migrations/seed/      черновик контента профессий в YAML
collector/              Python: загрузка вакансий, поиск навыков, веса, расписание
docs/                   продукт, схема БД, план MVP, требования к фронтенду
scripts/                служебные скрипты (миграции из schema.sql, выгрузка в общий репозиторий)
docker-compose.yml      всё окружение: db, api, worker, collector
```

## Запуск

Нужен только **Docker Desktop** (Go и Python ставить не обязательно — всё собирается в контейнерах).

```bash
cp .env.example .env          # необязательно: без .env берутся значения по умолчанию
docker compose up --build -d  # PostgreSQL, api, worker, collector
docker compose exec api /app/api seed   # контент 3 профессий и проверочные вопросы
```

> В Git Bash на Windows перед командами вида `docker compose exec api /app/...` добавляйте `MSYS_NO_PATHCONV=1`, иначе путь `/app/...` превратится в `C:/Program Files/Git/app/...`.

Проверка: http://localhost:8080/health → `{"status":"ok","db":"ok"}`.

| Адрес | Что |
|---|---|
| http://localhost:8080/api/v1/... | API (полный список — `api/openapi.yaml`) |
| http://localhost:8080/demo/ | временная демо-страница: регистрация → каталог → «Изучено» → % соответствия (только при `APP_ENV=local`) |
| localhost:5432 | PostgreSQL (`careernav` / `careernav`) |

Миграции применяются сами при старте api. Остановить всё: `docker compose down` (данные сохранятся); стереть базу целиком: `docker compose down -v`.

### Настройки (`.env`)

| Переменная | Зачем | По умолчанию |
|---|---|---|
| `APP_ENV` | `local` включает демо-страницу и cookie без `Secure` | `local` |
| `DATABASE_URL` | подключение к базе для запуска без Docker | в Compose подставляется сама |
| `PUBLIC_URL` | адрес сайта для ссылок в письмах | `http://localhost:3000` |
| `SUPERJOB_API_KEY` | Secret key приложения SuperJob (без него SuperJob пропускается) | — |
| `COLLECT_CRON` | расписание сбора вакансий, МСК | `0 3 1 * *` (1-го числа в 03:00) |

`.env` в git не попадает — ключи храним только в нём.

### Полезные команды

```bash
docker compose logs -f api                              # журнал api (сюда же пока пишутся письма)
docker compose exec api /app/api create-admin почта     # выдать роль admin зарегистрированному
docker compose exec api /app/api migrate                # применить миграции без запуска сервера
docker compose exec api /app/api seed                   # перезалить контент (безопасно повторять)

docker compose run --rm collector run-all               # полный сбор и анализ прямо сейчас
docker compose run --rm collector load-superjob --profession qa-manual
docker compose run --rm collector load-trudvsem --profession python-developer
docker compose run --rm collector match-skills          # поиск навыков в вакансиях
docker compose run --rm collector unknown-terms         # частые неизвестные термины
docker compose run --rm collector calc-weights          # веса навыков
docker compose run --rm collector --help                # все команды

docker compose exec db psql -U careernav careernav      # консоль базы
```

## Тестирование

### Автотесты

```bash
cd backend && go test ./...                                             # Go (нужен установленный Go 1.26)
docker compose run --rm --no-deps --entrypoint pytest collector -q      # Python, в контейнере
```

Что покрыто: пароли, лимит входа, роли, токены из писем, расчёт % соответствия и отчёта, алгоритм плана, уровни оценки, корректность seed-контента (у каждого ключевого навыка есть тема и проверочный вопрос); в collector — поиск навыков по синонимам, разбор ответов SuperJob и «Работы России», склейка дублей, веса, неизвестные термины.

Проверка спецификации API:

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd -W)/api:/spec" redocly/cli lint --extends=minimal /spec/openapi.yaml
```

(в Git Bash; в macOS/Linux — без `MSYS_NO_PATHCONV=1` и с `$(pwd)` вместо `$(pwd -W)`)

### Ручная проверка пути студента

Удобнее всего — демо-страница http://localhost:8080/demo/ или Postman. Через curl (в PowerShell пишите `curl.exe`, а не `curl`):

```bash
B=http://localhost:8080/api/v1
# регистрация (cookie сессии сохраняется в файл)
curl -c c.txt -X POST $B/auth/register -H "Content-Type: application/json" \
  -d '{"email":"me@example.test","password":"password123","name":"Test","consent_pd":true}'
curl -b c.txt $B/me
curl $B/professions
curl -b c.txt $B/professions/qa-manual
# онбординг → оценка → отчёт → план
curl -b c.txt -X PUT $B/me/profile -H "Content-Type: application/json" -d '{"hours_per_week":10,"complete_onboarding":true}'
curl -b c.txt -X POST $B/professions/qa-manual/assessments          # вернёт id оценки и навыки
curl -b c.txt -X PUT $B/assessments/1/answers/<skill_id> -H "Content-Type: application/json" -d '{"self_level":"basic"}'
curl -b c.txt -X POST $B/assessments/1/complete                     # после ответов на все навыки
curl -b c.txt $B/professions/qa-manual/report
curl -b c.txt -X POST $B/professions/qa-manual/plan
```

- Ссылки подтверждения почты и сброса пароля пока пишутся в журнал: `docker compose logs api | grep письмо`.
- Без загруженных вакансий `% соответствия` и `percent` в отчёте — `null` («данные собираются»). Загрузить: `docker compose run --rm collector run-all`.
- Кириллицу в `-d '...'` Git Bash может передать не в UTF-8 — для таких запросов используйте файл (`--data-binary @body.json`) или Postman.
- Тестовые учётки удобно заводить на домене `@example.test` и потом удалять: `delete from users where email like '%@example.test';`.

## Выгрузка в общий репозиторий

Клон общего репозитория лежит рядом: `Карьерный_IT_навигатор/full_code`. Скрипт копирует туда только наши пути (`backend/`, `collector/`, `api/`, `docs/`, `scripts/`, `docker-compose.yml`, `.env.example`, `.gitignore`, `.gitattributes`) и ничего не трогает у Жени (`frontend/`, `index.html`, `README.md`, `screenshots/`). Этот README тоже не выгружается.

```bash
python scripts/sync_full_code.py           # показать, что изменится
python scripts/sync_full_code.py --apply   # применить
cd ../full_code && git add -A && git commit -m "..." && git push origin main
```

## Частые проблемы

| Симптом | Причина и решение |
|---|---|
| `failed to connect to the docker API ... dockerDesktopLinuxEngine` | Docker Desktop не запущен — запустите и подождите «Engine running» |
| `C:/Program Files/Git/app/api: no such file` | Git Bash переписал путь — добавьте `MSYS_NO_PATHCONV=1` |
| в PowerShell `curl -i ...` просит `Uri:` | там `curl` — псевдоним `Invoke-WebRequest`; пишите `curl.exe` |
| `/health` отвечает 503 | api не достучался до базы — `docker compose ps`, `docker compose logs db` |
| `% соответствия` пустой | вакансии ещё не загружены — `docker compose run --rm collector run-all` |
| в имени `????` после curl | кодировка командной строки, не сервера — отправляйте JSON из файла |

---

## Технологии: что используется и зачем

### Backend (Go)

| Технология | Версия | Зачем она здесь |
|---|---|---|
| **Go** | 1.26 | Язык серверной части: быстрый, компилируется в один бинарник, простой для поддержки командой |
| **gin** (`github.com/gin-gonic/gin`) | 1.12 | HTTP-фреймворк: маршруты (`/api/v1/...`), middleware (проверка входа и роли), JSON-ответы |
| **pgx v5** (`jackc/pgx`) | 5.11 | Драйвер PostgreSQL с пулом соединений (`pgxpool`); запросы пишем на чистом SQL, без ORM |
| **goose** (`pressly/goose`) | 3.29 | Миграции схемы БД: SQL-файлы `backend/migrations/0000N_*.sql` с секциями Up/Down, применяются при старте api |
| **argon2id** (`golang.org/x/crypto`) | — | Хеширование паролей (рекомендация OWASP); в базе только хеш |
| **log/slog** | стандартная библиотека | Журнал: текстом локально, JSON на серверах |
| **gopkg.in/yaml.v3** | 3.0 | Чтение seed-контента профессий из YAML |
| **embed** | стандартная библиотека | Миграции, seed и демо-страница вшиты в бинарник — образу не нужны внешние файлы |

Устройство: модульный монолит — один сервис `api`, внутри модули по доменам (`internal/auth`, `content`, `progress`, `profile`, `assessment`, `match`, `plan`, `admin`), плюс отдельный `worker` для фоновых задач. Сессия — случайный токен в httpOnly-cookie (в базе sha256-хеш), без JWT. Письма — через интерфейс `mail.Mailer`; пока реализация пишет их в журнал.

### База данных

| Технология | Зачем |
|---|---|
| **PostgreSQL 16** | Единое хранилище всех сервисов. Ключи `bigint identity`, статусы — `text` + `CHECK`, почта — `citext` (без учёта регистра) |
| `docs/db/schema.dbml` → `schema.sql` | Полная схема платформы (50 таблиц); миграции собираются из `schema.sql` скриптом `scripts/gen_migration.py`, сейчас в базе 34 таблицы среза 1 |

### Аналитика (Python, `collector/`)

| Технология | Версия | Зачем |
|---|---|---|
| **Python** | 3.12 | Язык сбора и анализа данных |
| **httpx** | 0.27+ | HTTP-клиент для API источников вакансий |
| **psycopg 3** | 3.2+ | Драйвер PostgreSQL; collector пишет только свои таблицы (вакансии, навыки вакансий, веса) |
| **APScheduler** | 3.10+ | Запуск полного прогона по расписанию (cron-строка, МСК) внутри контейнера |
| **pytest** | 8+ | Тесты |

Как считаются данные: вакансии (только junior: без опыта и до 3 лет) → склейка дублей по отпечатку «название + компания + регион» → поиск навыков по справочнику и синонимам, регистронезависимо и по границам слов (без языковой модели) → вес навыка = доля вакансий профессии, где он встречается → снимок весов за месяц. Частые термины, которых нет в справочнике, копятся в `unknown_terms` для ручного разбора в админке.

### Источники вакансий

| Источник | Доступ | Что берём |
|---|---|---|
| **SuperJob API** v2 | ключ приложения (`SUPERJOB_API_KEY`, заголовок `X-Api-App-Id`) | поиск по названию вакансии, опыт «без опыта» и «от 1 года» |
| **«Работа России»** (opendata.trudvsem.ru) | открытые данные, без ключа | описание, требования и навыки вакансии; контакты работодателя не сохраняем |
| hh.ru, Telegram-каналы | позже | публичный API hh закрыт, нужен партнёрский доступ |

### Контракт и инфраструктура

| Технология | Зачем |
|---|---|
| **OpenAPI 3.1** (`api/openapi.yaml`) | Описание всех эндпоинтов; фронтенд генерирует из него типы. Сначала меняем спецификацию, потом код |
| **Redocly CLI** | Проверка спецификации (`lint`) — запускается в Docker |
| **Docker / Docker Compose** | Всё окружение одной командой; образы: `golang:1.26-alpine` → `alpine` для Go, `python:3.12-slim` для collector, `postgres:16-alpine` |
| **Git + GitHub** | История кода (нужна для регистрации программы в Роспатенте); рабочий и общий репозитории |

### Чего в проекте нет намеренно

- Зарубежных облаков и языковых моделей — только российский хостинг и отечественные модели (YandexGPT, GigaChat — для ИИ-плана позже).
- ORM — SQL пишем явно, так проще понимать и оптимизировать запросы.
- JWT — сессии в cookie проще отзывать (выход, смена пароля).
