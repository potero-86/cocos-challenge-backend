const { query, param, validationResult } = require('express-validator');

const { WebServerErrors } = require('../../errors');

const paramCheckSearchInstruments = [

	query('name').optional().notEmpty(),
	query('ticker').optional().notEmpty(),
	query('limit').optional().isInt({ min: 1, max: 100 }),

	(req, res, next) => {

		if (!req.query.name && !req.query.ticker) {
			return next(new WebServerErrors(400, 'params error', 'Se debe enviar al menos name o ticker'));
		}

		const errors = validationResult(req);
		if (!errors.isEmpty()) {

			return next(new WebServerErrors(400, 'validation error', `${JSON.stringify(errors.errors)}`));
		}

		req.queryParams = {
			name: req.query.name?.toLowerCase(),
			ticker: req.query.ticker?.toUpperCase(),
			limit: req.query.limit ? parseInt(req.query.limit) : 20
		};

		next();
	}
];

const paramCheckPortfolio = [

	param('userId').exists().notEmpty().isNumeric(),

	(req, res, next) => {

		const errors = validationResult(req);

		if (!errors.isEmpty()) {

			return next(new WebServerErrors(400, 'validation error', `${JSON.stringify(errors.errors)}`));
		}

		next();
	}
];

const paramCheckCancelOrder = [

	param('id').exists().notEmpty().isInt(),

	(req, res, next) => {

		const errors = validationResult(req);

		if (!errors.isEmpty()) {

			return next(new WebServerErrors(400, 'validation error', `${JSON.stringify(errors.errors)}`));
		}

		next();
	}
];

module.exports = {

	paramCheckSearchInstruments,
	paramCheckPortfolio,
	paramCheckCancelOrder
};
