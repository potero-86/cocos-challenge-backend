const { Logger } = require('../../utils');
const { orderStatusEnums, sideTypesEnums } = require('../../enums');
const { WebServerErrors } = require('../../errors');
const { UsersModel, OrdersModel } = require('../../database/models');
const {
	TransactionManager,
	dataBaseInstanceClass,
	createQueryGetAvailableCash,
	createQueryGetAvailableShares
} = require('../../database');

const fetchUserPosition = async (req, res, next) => {

	const { userId, side } = req.body;
	const { id: instrumentId } = req.instrument;

	const txManager = await new TransactionManager().startTransaction();
	req.transaction = txManager;
	const transaction = txManager.getTransaction();

	// Lockeamos la fila del usuario para garantizar serialización.
	await UsersModel.findByPk(userId, { lock: true, transaction });

	try {

		if (side === sideTypesEnums.CASH_IN) {

			req.userPosition = {};
			return next();
		}

		if (side === sideTypesEnums.BUY || side === sideTypesEnums.CASH_OUT) {

			Logger.info(`Se procede a verificar el cash disponible del usuario ${userId}.`, req.requestId);

			const query = createQueryGetAvailableCash();
			const [row] = await dataBaseInstanceClass.executeQuery(query, { userId }, transaction);

			req.userPosition = { availableCash: parseFloat(row?.availableCash ?? 0) };

			Logger.debug(`Cash disponible: $${req.userPosition.availableCash}.`, req.requestId);

			return next();
		}

		Logger.info(`Se procede a verificar las acciones disponibles del usuario ${userId} para el instrumento ${instrumentId}.`, req.requestId);

		const query = createQueryGetAvailableShares();
		const [row] = await dataBaseInstanceClass.executeQuery(query, { userId, instrumentId }, transaction);

		req.userPosition = { availableShares: parseFloat(row?.availableShares ?? 0) };

		Logger.debug(`Acciones disponibles: ${req.userPosition.availableShares}.`, req.requestId);

		next();

	} catch (error) {

		await transaction.abortTransaction();
		throw error;
	}
};

const checkOrderExists = async (req, res, next) => {

	const { id } = req.params;

	Logger.info(`Se procede a verificar que la orden ${id}, exista.`, req.requestId);

	const order = await OrdersModel.findOne({ where: { id }, raw: true });

	if (!order) {
		return next(new WebServerErrors(404, 'order_not_found', `La orden ${id} no existe.`));
	}

	if (order.status !== orderStatusEnums.NEW) {
		return next(new WebServerErrors(400, 'order_not_cancellable',
			`Solo se pueden cancelar órdenes en estado NEW. Estado actual: ${order.status}.`));
	}

	req.order = order;
	next();
};

module.exports = {

	fetchUserPosition,
	checkOrderExists
};
