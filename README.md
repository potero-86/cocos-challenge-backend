# Cocos — Backend Challenge

API REST para un broker financiero que permite gestionar el portafolio de usuarios, buscar instrumentos y operar órdenes de compra/venta.

---

## Stack

- **Runtime:** Node.js >= 20
- **Framework:** Express 5
- **ORM:** Sequelize 6
- **Base de datos:** PostgreSQL
- **Validación:** express-validator

---

## Instalación y ejecución

```bash
# Instalar dependencias
npm install

# Crear archivo de variables de entorno
cp .env.example .env

# Ejecutar en modo desarrollo
npm run
```

### Variables de entorno

```env
APPLICATION_NAME = CocosApp
BASE_URL = /cocos
WEB_PORT = 3000
POSTGRES_CNN = postgres://[user]:[pass]@ep-falling-fog-adzr4xhk-pooler.c-2.us-east-1.aws.neon.tech:5432/neondb
POSTGRES_DEBUG_LOGS = false
```

---

## Índices de base de datos

Los siguientes índices están diseñados para optimizar las queries más frecuentes de la aplicación.
```sql
-- orders: las queries de cash disponible y acciones disponibles.
-- filtran siempre por userid + status. La segunda agrega instrumentid.
-- para la validación de posición en órdenes de venta. 
-- Query: createQueryGetAvailableCash y createQueryGetAvailableShares.
-- ── TABLA: orders ─────────────────────────────────────
CREATE INDEX idx_orders_userid_status ON orders (userid, status);
CREATE INDEX idx_orders_userid_instrumentid_status ON orders (userid, instrumentid, status);

-- marketdata: la subquery del portfolio y el fetch de precio de mercado
-- ordenan por date DESC agrupando por instrumentid.
-- Query: createQueryGetMarketPrice.
-- ── TABLA: marketdata ──────────────────────────────────
CREATE INDEX idx_marketdata_instrumentid_date ON marketdata (instrumentid, date DESC);
```

> Los índices deben ejecutarse una sola vez sobre la base de datos. Si estás usando Neon o cualquier Postgres hosteado, podés correrlos directamente desde el SQL editor de la consola.
---

## Arquitectura

```
src/
├── cocosApp.js                  # Bootstrap: servidor + base de datos
├── database/
│   ├── databaseManager.database.js   # Singleton Sequelize + pool de conexiones
│   ├── transactionsManager.database.js
│   ├── models/                  # Definición de tablas Sequelize
│   ├── queries/                 # Queries SQL reutilizables
│   └── schemas/                 # Schemas de columnas
├── entities/
│   └── order.entities.js        # Clase Order: lógica de negocio pura
├── enums/                       # Constantes de dominio
├── errors/
│   └── webServer.errors.js      # WebServerError con toJSON()
├── routes/
│   ├── controllers/             # Arman la respuesta final
│   ├── middlewares/             # Validación, enriquecimiento del request
│   ├── paths/                   # Definición declarativa de rutas
│   ├── createRoutes.routes.js   # Builder de rutas con manejo de errores automático
│   └── route.routes.js          # Wrappea cada MW en try/catch
├── servers/
│   └── webServer.js             # Express app
└── utils/
    └── logger.utils.js          # Logger singleton (INFO / DEBUG / WARN / ERROR)
```

---

## Decisiones de diseño

### Entidad `Order`

La lógica de negocio de una orden (resolver status, validar fondos, calcular costo total) vive en la clase `Order` en `src/entities/order.entities.js`. Los middlewares solo enriquecen el request con los datos necesarios; la entidad decide.

### Concurrencia y bloqueo

Al crear una orden, se abre una transacción Sequelize antes de leer el saldo disponible. El primer paso dentro de la transacción es un `SELECT ... FOR UPDATE` sobre la fila del usuario (`UsersModel.findByPk(userId, { lock: true, transaction })`); Esto garantiza que si dos órdenes del mismo usuario llegan en paralelo, la segunda va a bloquearse hasta que la primera haga commit o rollback, eliminando el riesgo de doble gasto ( two-phase commit ).

### Manejo de errores

Todos los middlewares están envueltos automáticamente en `try/catch` por `Route.catchErrorsMiddlewares()`. Cualquier error no capturado explícitamente llega al middleware `catchErrors` de Express que lo serializa con `WebServerErrors.internal()`.

---

## Endpoints

### Documentación interactiva Swagger
El archivo dentro de docs/swagger/cocos_api.yaml incluido en el repositorio contiene la especificación completa de la API en formato OpenAPI 3.0. Para visualizarla de forma interactiva, entrá a editor.swagger.io, copiá el contenido del archivo y pegalo en el panel izquierdo del editor. Swagger UI va a renderizar automáticamente todos los endpoints con sus contratos, ejemplos de request y respuesta, y te va a permitir probar cada uno contra el servidor local una vez que esté corriendo.

### `GET /instruments/search`

Busca instrumentos por nombre y/o ticker.

**Query params:**

| Param | Tipo | Requerido | Descripción |
|---|---|---|---|
| `name` | string | condicional | Nombre del instrumento (parcial, case-insensitive) |
| `ticker` | string | condicional | Ticker del instrumento (parcial, case-insensitive) |
| `limit` | integer | no | Máximo de resultados. Default: 20, max: 100 |

Al menos uno de `name` o `ticker` es obligatorio.

**Respuesta exitosa `200`:**
```json
[
  { "ticker": "PAMP", "name": "Pampa Energía", "type": "ACCIONES" },
  { "ticker": "ARS",  "name": "Pesos Argentinos", "type": "MONEDA" }
]
```

---

### `GET /portfolio/:userId`

Devuelve el estado actual de la cuenta de un usuario: cash disponible, activos en posición y valor total de la cuenta.

**Respuesta exitosa `200`:**
```json
{
  "assets": [
    {
      "ticker": "PAMP",
      "name": "Pampa Energía",
      "quantity": 50,
      "totalValue": 46500.00,
      "performance": "-2.50%",  //--> Se calcula promediando los valores de las compras del activo (`avgBuyPrice` = (size * price)/size), no contra el cierre anterior. Solo se incluyen posiciones con `totalSize <> 0` (si vendiste todo, no aparece).
      "dailyPerformance": "-0.85%"  //--> Se calcula para obtener la variación entre el close y el previousClose.
    }
  ],
  "availableCash": 743600.00, //--> Refleja el dinero real disponible para operar; Considera `CASH_IN`, `CASH_OUT` y el impacto de las compras y ventas ejecutadas (`FILLED`).
  "totalAccountValue": 790100.00  //--> `availableCash` + valor de mercado de todos los activos (precio `close` más reciente).
}
```

---

### `POST /orders`

Crea una nueva orden de compra, venta, ingreso o retiro de efectivo.

**Body:**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `userId` | integer | ✅ | ID del usuario |
| `ticker` | string | ✅ | Ticker del instrumento |
| `side` | string | ✅ | `BUY`, `SELL`, `CASH_IN`, `CASH_OUT` |
| `type` | string | ✅ | `MARKET` o `LIMIT` |
| `size` | integer | condicional | Cantidad de acciones |
| `amount` | number | condicional | Monto en pesos (alternativa a `size`) |
| `price` | number | condicional | Precio límite (obligatorio si `type = LIMIT`) |

Al menos `size` o `amount` es requerido.

**Respuesta exitosa `201`:**
```json
{
  "id": 42,
  "instrumentId": 3,
  "userId": 1,
  "size": 5,
  "price": "930.00",
  "type": "MARKET",
  "side": "BUY",
  "status": "FILLED",
  "datetime": "2025-01-01T12:00:00.000Z"
}
```

**Lógica de negocio:**

```
Si viene amount → size = floor(amount / precio de mercado)
Si type = MARKET → precio = close más reciente del mercado → status = FILLED
Si type = LIMIT  → precio = el enviado por el usuario      → status = NEW
Si BUY  → se valida que availableCash >= size * precio
Si SELL → se valida que acciones disponibles >= size
Si no alcanza, o size = 0 → status = REJECTED (la orden se guarda igual)
```

---

### `POST /orders/:id/cancel`

Cancela una orden existente. Solo se pueden cancelar órdenes en estado `NEW`.

**Respuesta exitosa `200`:**
```json
{
  "id": 42,
  "status": "CANCELLED"
}
```

**Errores:**

| Status | Error | Descripción |
|---|---|---|
| `404` | `order_not_found` | La orden no existe |
| `400` | `order_not_cancellable` | La orden no está en estado NEW |

---