const { body, validationResult } = require('express-validator');

const { WebServerErrors } = require('../../errors');
const { orderTypesEnums, sideTypesEnums } = require('../../enums');

const bodyCheckOrder = [

	body('userId').isInt().withMessage('ID de usuario inválido'),
	body('ticker').isString().notEmpty().withMessage('Ticker es obligatorio'),
	body('side').isIn(Object.values(sideTypesEnums)).withMessage(`Valores soportados ${Object.values(sideTypesEnums).join(', ')}`),
	body('type').isIn(Object.values(orderTypesEnums)).withMessage(`Valores soportados ${Object.values(orderTypesEnums).join(', ')}`),
	// Validación lógica: o viene size o viene amount, no ambos vacíos
	body().custom(body => {
		if (!body.size && !body.amount) throw new Error('Se debe enviar size o amount');
		if (body.type === orderTypesEnums.LIMIT && (!body.price || body.price <= 0)) {
			throw new Error('Precio obligatorio y mayor a 0 para órdenes LIMIT');
		}
		return true;
	}),

	(req, res, next) => {

		const errors = validationResult(req);
		if (!errors.isEmpty()) {

			return next(new WebServerErrors(400, 'validation error', `${JSON.stringify(errors.errors)}`));
		}

		req.body = {
			userId: req.body.userId,
			ticker: req.body.ticker,
			side: req.body.side,
			type: req.body.type,
			size: req.body.size,
			amount: req.body.amount,
			price: req.body.price
		};

		next();
	}
];

module.exports = {

	bodyCheckOrder
};
