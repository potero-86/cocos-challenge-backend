class Route {

	constructor(args) {

		this.active = args.active ?? true;
		this.path = args.path;
		this.method = args.method;
		this.middlewares = [...this.catchErrorsMiddlewares(args.middlewares)];
		this.controller = args.controller;
	}

	catchErrorsMiddlewares(middlewares = []) {

		return middlewares.map((middleware) => {

			if (typeof middleware === 'function') {

				return async (req, res, next) => {

					try {
						await middleware.call({}, req, res, next);
					} catch (error) {
						next(error);
					}
				};
			}

			return middleware;
		});
	}
}

module.exports = Route;
