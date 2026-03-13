const { Model } = require('sequelize');

const { dataBaseInstanceClass } = require('../databaseManager.database');
const { usersSchema } = require('../schemas');

const OrdersModel = require('../models/orders.models');

class UsersModel extends Model {

	static get schema() {

		return { ...usersSchema };
	}

	static config(sequelize) {

		return {

			sequelize,
			tableName: 'users',
			version: false,
			timestamps: false
		};
	}

	static relationTables() {

		this.hasMany(OrdersModel, { as: 'orders', foreignKey: 'userId' });
		OrdersModel.belongsTo(this, { as: 'users', foreignKey: 'userId' });
	}
}

dataBaseInstanceClass.models.push(UsersModel);

module.exports = UsersModel;
