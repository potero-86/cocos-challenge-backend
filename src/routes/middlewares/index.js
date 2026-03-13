const webServer = require('./webServer.middlewares');
const paramsCheck = require('./paramsCheck.middlewares');
const bodyCheck = require('./bodyCheck.middlewares');
const instruments = require('./instruments.middlewares');
const portfolio = require('./portfolio.middlewares');
const order = require('./order.middlewares');
const marketData = require('./marketData.middlewares');

module.exports = {

	...webServer,
	...paramsCheck,
	...bodyCheck,
	...instruments,
	...portfolio,
	...order,
	...marketData
};
