const { Model } = require('sequelize');

const { dataBaseInstanceClass } = require('../databaseManager.database');
const { instrumentsSchema } = require('../schemas');

const OrdersModel = require('../models/orders.models');
const MarketDataModel = require('../models/marketdata.models');

class InstrumentsModel extends Model {

	static get schema() {

		return { ...instrumentsSchema };
	}

	static config(sequelize) {

		return {

			sequelize,
			tableName: 'instruments',
			version: false,
			timestamps: false
		};
	}

	static relationTables() {

		this.hasMany(OrdersModel, { as: 'orders', foreignKey: 'instrumentId' });
		OrdersModel.belongsTo(this, { as: 'instruments', foreignKey: 'instrumentId' });

		this.hasMany(MarketDataModel, { as: 'marketdata', foreignKey: 'instrumentId' });
		MarketDataModel.belongsTo(this, { as: 'instruments', foreignKey: 'instrumentId' });
	}
}

dataBaseInstanceClass.models.push(InstrumentsModel);

module.exports = InstrumentsModel;
