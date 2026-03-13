const { Router } = require('express');

const { Logger } = require('../utils');
const Route = require('./route.routes');

class CreateRoutes {

	constructor(path) {

		this.router = Router();
		this.path = path;
		this.routes = [];
		this.errorMiddleware = null;
	}

	addRoutes(...routes) {

		if (!routes || !Array.isArray(routes) || routes.length == 0) return this;

		routes = routes.flat();
		routes.forEach((route = {}) => {

			this.routes.push(new Route(route));
		});

		return this;
	}

	addErrorMiddleware(middleware) {

		this.errorMiddleware = middleware;
		return this;
	}

	createRoutes() {

		this.routes.forEach(route => {

			if (!route.active) return;

			this.router[route.method](route.path, ...route.middlewares, async (req, res, next) => {

				try {

					const controller = route.controller;
					await controller.call(req,
						(result) => {

							if (typeof result === 'object') {

								const statusCode = result?.httpStatusCode ?? 200;
								const message = result?.message ?? result;
								res.body = message;

								if (typeof message === 'object') { res.status(statusCode).json(message); }
								else { res.status(statusCode).send(message); }

								Logger.res(res);

							} else {

								Logger.error(`Error al enviar al result un dato del tipo equivocado: ${result}`);
								return next(new Error('Objeto invalido'));
							}
						},
						(reject) => {

							if (typeof reject === 'object') {

								res.body = reject;
								Logger.res(res);
								return res.status(400).json(reject);
							}

							res.status(400).send(reject);
						}
					);

				} catch (error) { next(error); }
			});
		});

		// Si se ha definido un middleware de error, se agrega.
		if (this.errorMiddleware) this.router.use(this.errorMiddleware);

		return this.router;
	}
}

module.exports = CreateRoutes;
