const orderQueries = require('./order.queries');
const portfolioQueries = require('./portfolio.queries');
const marketDataQueries = require('./marketData.queries');
const instrumentsQueries = require('./instruments.queries');

module.exports = {

	...orderQueries,
	...portfolioQueries,
	...marketDataQueries,
	...instrumentsQueries
};
