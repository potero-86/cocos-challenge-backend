const { Logger } = require('../../utils');

const { sideTypesEnums, orderTypesEnums } = require('../../enums');
const { WebServerErrors } = require('../../errors');
const { MarketDataModel } = require('../../database/models');
const { createQueryGetMarketPrice } = require('../../database');

const fetchMarketPrice = async (req, res, next) => {

	const { type, price, ticker, side } = req.body;
	const { id } = req.instrument;

	Logger.info(`Procesamos la orden del tipo ${type}.`, req.requestId);

    // CASH_IN / CASH_OUT no tienen precio de mercado — siempre es 1.
    if (side === sideTypesEnums.CASH_IN || side === sideTypesEnums.CASH_OUT) {
        req.marketPrice = 1;
        return next();
    }

	// Si es LIMIT, el precio es el que viene en el body.
	if (type === orderTypesEnums.LIMIT) {

		req.marketPrice = parseFloat(price);
		return next();
	}

	// Solo buscamos precio si es MARKET. Si es LIMIT, usamos el que mandó el usuario.
	const query = createQueryGetMarketPrice(id);
	const lastPrice = await MarketDataModel.findOne(query);

	if (!lastPrice) {
		return next(new WebServerErrors(400, 'no_market_data', `No hay precios disponibles para este activo ${ticker} actualmente.`));
	}

	// Guardamos el precio de mercado.
	req.marketPrice = parseFloat(lastPrice.close);

	next();
}

module.exports = {

	fetchMarketPrice
};
