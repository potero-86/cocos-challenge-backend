const { Logger } = require('../../utils');
const { dataBaseInstanceClass, createQueryGetPortfolio, createQueryGetAvailableCash } = require('../../database');

const getPortfolio = async (req, res, next) => {

	const { userId } = req.params;

	Logger.info(`Se procede a calcular el portfolio de la cuenta del usuario con Id: ${userId}.`, req.requestId);

	const queryPortfolio = createQueryGetPortfolio();
	const queryAvailableCash = createQueryGetAvailableCash();

	const [portfolio, [cashRow]] = await Promise.all([
		dataBaseInstanceClass.executeQuery(queryPortfolio, { userId }),
		dataBaseInstanceClass.executeQuery(queryAvailableCash, { userId })
	]);

	req.portfolio = portfolio;
	req.availableCash = parseFloat(cashRow?.availableCash ?? 0);

	next();
};

module.exports = {

	getPortfolio
};
