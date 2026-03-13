const { Logger } = require('../utils');
const { sideTypesEnums, orderTypesEnums, orderStatusEnums } = require('../enums');

class Order {

    constructor({ userId, instrument, side, type, size, amount, marketPrice, userPosition, requestId }) {

        this.instrumentId = instrument.id;
        this.userId = userId;
        this.size = size > 0 ? size : Math.floor(amount / marketPrice);
        this.price = marketPrice;
        this.type = type;
        this.side = side;
        this.status = this.resolveStatus(userPosition, requestId);
        this.datetime = new Date();
    }

    get totalCost() {

        return this.size * this.price;
    }

    resolveStatus(userPosition, requestId) {

        // Si no tiene fondos o acciones → REJECTED sin importar el tipo.
        if (!this.hasSufficientPosition(userPosition)) {

            if (this.size === 0) {
                Logger.info(`Orden REJECTED — el monto enviado no alcanza para comprar ni 1 acción al precio $${this.price}.`, requestId);
            } else if (this.side === sideTypesEnums.BUY || this.side === sideTypesEnums.CASH_OUT) {
                Logger.info(`Orden REJECTED — cash insuficiente. Disponible: $${userPosition.availableCash}, requerido: $${this.totalCost}.`, requestId);
            } else if (this.side === sideTypesEnums.SELL) {
                Logger.info(`Orden REJECTED — acciones insuficientes. Disponibles: ${userPosition.availableShares}, requeridas: ${this.size}.`, requestId);
            }

            return orderStatusEnums.REJECTED;
        }

        // MARKET → FILLED, LIMIT → NEW
        return this.type === orderTypesEnums.MARKET ? orderStatusEnums.FILLED : orderStatusEnums.NEW;
    }

    hasSufficientPosition(userPosition) {

        // Si no se puede comprar ni una acción con el monto enviado.
        if (this.size === 0) return false;

        if (this.side === sideTypesEnums.CASH_IN) return true;

        if (this.side === sideTypesEnums.BUY || this.side === sideTypesEnums.CASH_OUT) return userPosition.availableCash >= this.totalCost;

        if (this.side === sideTypesEnums.SELL) return userPosition.availableShares >= this.size;

        return false;
    }
}

module.exports = Order;