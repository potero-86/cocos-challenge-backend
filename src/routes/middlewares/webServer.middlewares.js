const { Logger } = require('../../utils');
const { WebServerErrors } = require('../../errors');

const firstRequest = async function (req, res, next) {

	const id = req.headers['x-request-id'] ?? crypto.randomUUID();

	req.requestId = id;

	Logger.req(req);

	res.requestId = id;
	res.set('Request-Id', id);

	next();
};

// Dejamos esta salvedad porque el MW de cacheo de errores necesita los 4 parámetros.
const catchErrors = function (err, req, res, next) {

	Logger.error(err.message, req.requestId);

	if (err instanceof WebServerErrors) {

		return res.status(err.status).json(err.toJSON());
	}

	const internalError = WebServerErrors.internal(err.message);

	res.status(internalError.status).json(internalError.toJSON());
};

module.exports = {

	firstRequest,
	catchErrors
};
