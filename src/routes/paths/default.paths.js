module.exports = [{

	path: '/serviceStatus',
	method: 'get',
	middlewares: [],
	controller: function () { this.res.status(200).json({}); }
}];
