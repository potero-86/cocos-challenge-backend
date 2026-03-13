const middlewares = require('../middlewares');
const controller = require('../controllers/cocos.controllers');

module.exports = [{

	path: '/instruments/search',
	method: 'get',
	middlewares: [

		middlewares.paramCheckSearchInstruments,
		middlewares.getInstruments
	],
	controller: controller.searchInstruments
}, {

	path: '/portfolio/:userId',
	method: 'get',
	middlewares: [

		middlewares.paramCheckPortfolio,
		middlewares.getPortfolio
	],
	controller: controller.portfolio
}, {

	path: '/orders',
	method: 'post',
	middlewares: [

		middlewares.bodyCheckOrder,
		middlewares.checkInstrumentExists,
		middlewares.fetchMarketPrice,
		middlewares.fetchUserPosition
	],
	controller: controller.createOrder
}, {

	path: '/orders/:id/cancel',
	method: 'post',
	middlewares: [

		middlewares.paramCheckCancelOrder,
		middlewares.checkOrderExists
	],
	controller: controller.cancelOrder
}];
