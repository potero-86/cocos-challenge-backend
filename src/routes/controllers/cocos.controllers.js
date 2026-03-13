const { Logger } = require('../../utils');
const { Order } = require('../../entities');
const { orderStatusEnums } = require('../../enums');
const { OrdersModel } = require('../../database/models');

const searchInstruments = async function (result) {

    result(this.instruments);
};

const portfolio = async function (result) {

    const assets = [];
    let totalAccountValue = this.availableCash;

    this.portfolio.forEach(row => {

        const size = parseFloat(row.totalSize);
        const closePrice = parseFloat(row.close || 0);
        const previousClose = parseFloat(row.previousclose || 0);
        const avgBuyPrice = parseFloat(row.avgBuyPrice || 0);
        const totalValue = size * closePrice;
        const performance = avgBuyPrice > 0
            ? ((closePrice / avgBuyPrice) - 1) * 100
            : 0;
        // Retorno del día: variación entre el cierre de hoy y el cierre anterior.
        const dailyPerformance = previousClose > 0
            ? ((closePrice / previousClose) - 1) * 100
            : 0;

        assets.push({
            ticker: row.ticker,
            name: row.name,
            quantity: size,
            totalValue: parseFloat(totalValue.toFixed(2)),
            performance: performance.toFixed(2) + '%',
            dailyPerformance: dailyPerformance.toFixed(2) + '%'
        });

        totalAccountValue += totalValue;
    });

    result({
        assets,
        availableCash: parseFloat(this.availableCash.toFixed(2)),
        totalAccountValue: parseFloat(totalAccountValue.toFixed(2))
    });
};

const createOrder = async function (result) {

    const { type, side } = this.body;

    Logger.info(`Se construye la orden del tipo: ${type} con operación de: ${side}.`, this.requestId);

    const order = new Order({
        instrument: this.instrument,
        marketPrice: this.marketPrice,
        userPosition: this.userPosition,
        requestId: this.requestId,
        ...this.body
    });

    Logger.debug(`Orden construida con status ${order.status}.`, this.requestId);
    Logger.info(`Registrando orden con status ${order.status}.`, this.requestId);

    try {

        const transaction = this.transaction.getTransaction();
        const savedOrder = await OrdersModel.create(order, { transaction });

        await this.transaction.commitTransaction();

        Logger.info(`Orden con id ${savedOrder.id}, Registrada.`, this.requestId);

        result({ httpStatusCode: 201, message: { ...savedOrder.dataValues } });

    } catch (error) {

        await this.transaction.abortTransaction();
        throw error;
    }
};

const cancelOrder = async function (result) {

    const { id } = this.params;

    Logger.info(`Se procede a cancelar la orden ${id}.`, this.requestId);

    await OrdersModel.update(
        { status: orderStatusEnums.CANCELLED },
        { where: { id } }
    );

    Logger.info(`Orden ${id} cancelada correctamente.`, this.requestId);

    result({ id: parseInt(id), status: orderStatusEnums.CANCELLED });
};

module.exports = {

    searchInstruments,
    portfolio,
    createOrder,
    cancelOrder
};
