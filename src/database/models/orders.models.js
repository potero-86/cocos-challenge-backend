const { Model } = require('sequelize');

const { dataBaseInstanceClass } = require('../databaseManager.database');
const { ordersSchema } = require('../schemas');

class OrdersModel extends Model {

	static get schema() {

		return { ...ordersSchema };
	}

	static config(sequelize) {

		return {

			sequelize,
			tableName: 'orders',
			version: false,
			timestamps: false
		};
	}

	static relationTables() { return; }
}

dataBaseInstanceClass.models.push(OrdersModel);

module.exports = OrdersModel;
