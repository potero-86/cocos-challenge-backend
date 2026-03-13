/**
 * Tests funcionales — createOrder
 *
 * Estrategia: testear el comportamiento de punta a punta de la lógica de negocio
 * de una orden. Se mockea únicamente OrdersModel.create (I/O de base de datos)
 * para aislar la lógica sin necesidad de una DB real.
 *
 * Lo que se verifica:
 *   - Que el status resultante sea el correcto según side, type y posición del usuario.
 *   - Que los campos de la orden persistida sean los esperados.
 *   - Que el controller responda con httpStatusCode 201 en todos los casos.
 */

const Order = require('../entities/order.entities');
const { OrdersModel } = require('../database/models');
const createOrder = require('../routes/controllers/cocos.controllers').createOrder;

const orderStatusEnums  = require('../enums/orderStatus.enums');
const orderTypesEnums   = require('../enums/orderTypes.enums');
const sideTypesEnums    = require('../enums/sideTypes.enums');

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('../database/models', () => ({
    OrdersModel: {
        create: jest.fn()
    }
}));

// ─── Fixtures ────────────────────────────────────────────────────────────────

const instrument = { id: 3, ticker: 'PAMP', type: 'ACCIONES' };
const MARKET_PRICE = 930;

/**
 * Construye el contexto (this) que recibe el controller,
 * simulando lo que dejan los middlewares en el req.
 */
const buildContext = ({ side, type, size, amount, price, userPosition, transactionOverride } = {}) => {

    const mockTransaction = {
        getTransaction: jest.fn().mockReturnValue({}),
        commitTransaction: jest.fn().mockResolvedValue(),
        abortTransaction: jest.fn().mockResolvedValue(),
        ...transactionOverride
    };

    return {
        body: {
            userId: 1,
            ticker: instrument.ticker,
            side:   side   ?? sideTypesEnums.BUY,
            type:   type   ?? orderTypesEnums.MARKET,
            size:   size   ?? undefined,
            amount: amount ?? undefined,
            price:  price  ?? undefined
        },
        instrument,
        marketPrice:  MARKET_PRICE,
        userPosition,
        transaction:  mockTransaction,
        requestId:    'test-request-id'
    };
};

/**
 * Simula OrdersModel.create devolviendo la orden tal como la recibiría
 * desde la DB (dataValues).
 */
const mockCreate = (order) => {
    OrdersModel.create.mockResolvedValue({ dataValues: { id: 99, ...order } });
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('createOrder — lógica de negocio', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ── BUY MARKET ────────────────────────────────────────────────────────────

    describe('BUY MARKET', () => {

        it('debe crear una orden FILLED cuando el usuario tiene cash suficiente', async () => {

            const context = buildContext({
                side: sideTypesEnums.BUY,
                type: orderTypesEnums.MARKET,
                size: 5,
                userPosition: { availableCash: 10000 }   // 5 * 930 = 4650 → alcanza
            });

            mockCreate({ ...context.body, status: orderStatusEnums.FILLED, price: MARKET_PRICE, size: 5 });

            let response;
            await createOrder.call(context, (result) => { response = result; });

            const createdOrder = OrdersModel.create.mock.calls[0][0];

            expect(createdOrder.status).toBe(orderStatusEnums.FILLED);
            expect(createdOrder.size).toBe(5);
            expect(createdOrder.price).toBe(MARKET_PRICE);
            expect(response.httpStatusCode).toBe(201);
        });

        it('debe crear una orden REJECTED cuando el usuario NO tiene cash suficiente', async () => {

            const context = buildContext({
                side: sideTypesEnums.BUY,
                type: orderTypesEnums.MARKET,
                size: 5,
                userPosition: { availableCash: 100 }   // 5 * 930 = 4650 → no alcanza
            });

            mockCreate({ ...context.body, status: orderStatusEnums.REJECTED, price: MARKET_PRICE, size: 5 });

            let response;
            await createOrder.call(context, (result) => { response = result; });

            const createdOrder = OrdersModel.create.mock.calls[0][0];

            expect(createdOrder.status).toBe(orderStatusEnums.REJECTED);
            expect(response.httpStatusCode).toBe(201);
        });

        it('debe crear una orden REJECTED cuando el amount no alcanza para comprar ni 1 acción', async () => {

            const context = buildContext({
                side: sideTypesEnums.BUY,
                type: orderTypesEnums.MARKET,
                amount: 1,                               // floor(1 / 930) = 0 → REJECTED
                userPosition: { availableCash: 10000 }
            });

            mockCreate({ ...context.body, status: orderStatusEnums.REJECTED, price: MARKET_PRICE, size: 0 });

            let response;
            await createOrder.call(context, (result) => { response = result; });

            const createdOrder = OrdersModel.create.mock.calls[0][0];

            expect(createdOrder.size).toBe(0);
            expect(createdOrder.status).toBe(orderStatusEnums.REJECTED);
        });

        it('debe calcular correctamente size a partir de amount', async () => {

            const amount = 5000;
            const expectedSize = Math.floor(amount / MARKET_PRICE); // 5

            const context = buildContext({
                side: sideTypesEnums.BUY,
                type: orderTypesEnums.MARKET,
                amount,
                userPosition: { availableCash: 10000 }
            });

            mockCreate({ ...context.body, status: orderStatusEnums.FILLED, price: MARKET_PRICE, size: expectedSize });

            await createOrder.call(context, () => {});

            const createdOrder = OrdersModel.create.mock.calls[0][0];
            expect(createdOrder.size).toBe(expectedSize);
        });
    });

    // ── SELL MARKET ───────────────────────────────────────────────────────────

    describe('SELL MARKET', () => {

        it('debe crear una orden FILLED cuando el usuario tiene acciones suficientes', async () => {

            const context = buildContext({
                side: sideTypesEnums.SELL,
                type: orderTypesEnums.MARKET,
                size: 10,
                userPosition: { availableShares: 50 }   // tiene 50 → alcanza
            });

            mockCreate({ ...context.body, status: orderStatusEnums.FILLED, price: MARKET_PRICE, size: 10 });

            let response;
            await createOrder.call(context, (result) => { response = result; });

            const createdOrder = OrdersModel.create.mock.calls[0][0];

            expect(createdOrder.status).toBe(orderStatusEnums.FILLED);
            expect(createdOrder.side).toBe(sideTypesEnums.SELL);
            expect(response.httpStatusCode).toBe(201);
        });

        it('debe crear una orden REJECTED cuando el usuario NO tiene acciones suficientes', async () => {

            const context = buildContext({
                side: sideTypesEnums.SELL,
                type: orderTypesEnums.MARKET,
                size: 999,
                userPosition: { availableShares: 50 }   // tiene 50, quiere vender 999
            });

            mockCreate({ ...context.body, status: orderStatusEnums.REJECTED, price: MARKET_PRICE, size: 999 });

            let response;
            await createOrder.call(context, (result) => { response = result; });

            const createdOrder = OrdersModel.create.mock.calls[0][0];
            expect(createdOrder.status).toBe(orderStatusEnums.REJECTED);
        });
    });

    // ── BUY LIMIT ─────────────────────────────────────────────────────────────

    describe('BUY LIMIT', () => {

        it('debe crear una orden NEW cuando el usuario tiene cash suficiente', async () => {

            const limitPrice = 900;

            const context = buildContext({
                side: sideTypesEnums.BUY,
                type: orderTypesEnums.LIMIT,
                size: 5,
                price: limitPrice,
                userPosition: { availableCash: 10000 }  // 5 * 900 = 4500 → alcanza
            });

            // Para LIMIT, marketPrice es el precio que mandó el usuario (lo setea fetchMarketPrice)
            context.marketPrice = limitPrice;

            mockCreate({ ...context.body, status: orderStatusEnums.NEW, price: limitPrice, size: 5 });

            let response;
            await createOrder.call(context, (result) => { response = result; });

            const createdOrder = OrdersModel.create.mock.calls[0][0];

            expect(createdOrder.status).toBe(orderStatusEnums.NEW);
            expect(createdOrder.price).toBe(limitPrice);
            expect(response.httpStatusCode).toBe(201);
        });

        it('debe crear una orden REJECTED cuando el usuario NO tiene cash suficiente (LIMIT)', async () => {

            const limitPrice = 900;

            const context = buildContext({
                side: sideTypesEnums.BUY,
                type: orderTypesEnums.LIMIT,
                size: 5,
                price: limitPrice,
                userPosition: { availableCash: 100 }   // no alcanza
            });

            context.marketPrice = limitPrice;

            mockCreate({ ...context.body, status: orderStatusEnums.REJECTED, price: limitPrice, size: 5 });

            await createOrder.call(context, () => {});

            const createdOrder = OrdersModel.create.mock.calls[0][0];
            expect(createdOrder.status).toBe(orderStatusEnums.REJECTED);
        });
    });

    // ── Transacción ───────────────────────────────────────────────────────────

    describe('manejo de transacción', () => {

        it('debe hacer commit si la orden se guarda correctamente', async () => {

            const context = buildContext({
                side: sideTypesEnums.BUY,
                type: orderTypesEnums.MARKET,
                size: 5,
                userPosition: { availableCash: 10000 }
            });

            mockCreate({ ...context.body, status: orderStatusEnums.FILLED });

            await createOrder.call(context, () => {});

            expect(context.transaction.commitTransaction).toHaveBeenCalledTimes(1);
            expect(context.transaction.abortTransaction).not.toHaveBeenCalled();
        });

        it('debe hacer rollback si OrdersModel.create lanza un error', async () => {

            const context = buildContext({
                side: sideTypesEnums.BUY,
                type: orderTypesEnums.MARKET,
                size: 5,
                userPosition: { availableCash: 10000 }
            });

            OrdersModel.create.mockRejectedValue(new Error('DB error'));

            await expect(createOrder.call(context, () => {})).rejects.toThrow('DB error');

            expect(context.transaction.abortTransaction).toHaveBeenCalledTimes(1);
            expect(context.transaction.commitTransaction).not.toHaveBeenCalled();
        });
    });
});
