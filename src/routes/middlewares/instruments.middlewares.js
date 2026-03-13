const { Logger } = require('../../utils');
const { WebServerErrors } = require('../../errors');
const { InstrumentsModel } = require('../../database/models');
const { createQueryExistsInstrument, createQueryGetInstruments } = require('../../database');

const getInstruments = async (req, res, next) => {

	const { name, ticker, limit } = req.queryParams;

	Logger.info(`Se procede a obtener los instrumentos solicitados.`, req.requestId);
	Logger.debug(`Los instrumentos solicitados son name: [${name ?? ''}] y ticker: [${ticker ?? ''}].`, req.requestId);

	const query = createQueryGetInstruments({ name, ticker, limit });
	req.instruments = await InstrumentsModel.findAll(query);

	next();
};

const checkInstrumentExists = async (req, res, next) => {

	const { ticker } = req.body;

	Logger.info(`Verificamos que el instrumento exista.`, req.requestId);

	const query = createQueryExistsInstrument(ticker);
	const instrument = await InstrumentsModel.findOne(query);

	if (!instrument) {
		return next(new WebServerErrors(400, 'instrument_not_found', `El ticker ${ticker} no existe en nuestra plataforma.`));
	}

	req.instrument = instrument;

	next();
};
module.exports = {

	getInstruments,
	checkInstrumentExists
};
