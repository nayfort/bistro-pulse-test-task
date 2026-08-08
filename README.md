# Web Developer Test Task

- **Рівень 1: Frontend/CMS.** React + Vite landing за Figma-reference: Inter, адаптивний header, burger-menu з анімацією, hover-scale карток, hover-shadow для посилань без underline, production build.
- **Рівень 2: Automation/Data Logic.** TypeScript pipeline для `Import.xlsx` і `Тепла підлога прайс 2024.xlsx`: оновлення `price`, розрахунок `old_price = price + 10%`, кольорове маркування `changed/identical/missing`, chunk-обробка, XML-feed для маркетплейсів.
- **Рівень 3: API/System Integration.** Express API з кастомною валідацією імені та українського телефону, no-captcha anti-spam, SalesDrive `/handler/`, передача клієнта в Dilovod, Telegram health monitor.
- **Рівень 4: CMS Plugin.** WooCommerce shipping method з налаштуваннями, полями checkout `місто/відділення/коментар`, server-side validation, order meta, logging, hook для API/webhook.

## Структура

```text
apps/web                  React landing page
apps/server               Express API + integrations
packages/data-pipeline    Excel sync + XML generator
cms/woocommerce-ua-delivery
data/input                Source XLSX files from Google Drive
data/output               Generated XLSX/XML/report
docs/figma-thumbnail.webp Design reference preview
```

## Запуск

```bash
cp .env.example .env
npm install
npm run dev
```

Після запуску:

- Web: `http://localhost:5173`
- API: `http://localhost:4300/api/health`

Локальний режим інтеграцій керується змінною `INTEGRATIONS_DRY_RUN`.

## Production/Test Domain

```bash
npm run build
npm run start --workspace @webdev-test/server
```

Після build Express сервер віддає і API, і зібраний frontend. Для тестового домену достатньо направити reverse proxy/Nginx на порт `4300` і задати production env-змінні.

## Data Pipeline

```bash
npm run pipeline
```

Результати:

- `data/output/import-updated.xlsx`
- `data/output/marketplace.xml`
- `data/output/sync-report.json`

Pipeline читає реальні файли з Google Drive. Через різні формати артикулів у прайсі реалізовано два рівні зіставлення: нормалізований SKU і fallback за схожістю назви/характеристик.

## API Integrations

Заповнити в `.env`:

```bash
INTEGRATIONS_DRY_RUN=false
SALESDRIVE_ACCOUNT=your-subdomain
SALESDRIVE_API_KEY=your-api-key
DILOVOD_API_KEY=your-api-key
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

SalesDrive створює заявку через `POST /handler/` з `X-Api-Key`. Dilovod отримує `saveObject` packet для категорії клієнта. Telegram monitor шле сповіщення, якщо одна з API-перевірок падає.

## WooCommerce Plugin

1. Скопіювати `cms/woocommerce-ua-delivery` у `wp-content/plugins/woocommerce-ua-delivery`.
2. Активувати plugin у WordPress admin.
3. Додати `UA Delivery` у WooCommerce shipping zone.
4. Перевірити checkout: місто, відділення, коментар зберігаються в order meta.

## Перевірка

```bash
npm test
npm run build
npm run pipeline
```

## Джерела

- Figma макет: https://www.figma.com/design/fxz6GkQVW9BwrCOcn9EvGX/Test-Task?node-id=0-1
- Матеріали Google Drive: https://drive.google.com/drive/folders/12XxNrQy6Nk0gAOT-g9PXjeXLfsfXUGad
- SalesDrive API: https://salesdrive.ua/knowledge/api/
- SalesDrive Swagger: https://api.salesdrive.me/api/docs/
- Dilovod API: https://help.dilovod.ua/uk/article/api-dilovod-1gwt3m0/
