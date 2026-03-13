const { Model } = require('sequelize');

const { dataBaseInstanceClass } = require('../databaseManager.database');
const { marketDataSchema } = require('../schemas');

class MarketDataModel extends Model {

	static get schema() {

		return { ...marketDataSchema };
	}

	static config(sequelize) {

		return {

			sequelize,
			tableName: 'marketdata',
			version: false,
			timestamps: false
		};
	}

	static relationTables() { return; }
}

dataBaseInstanceClass.models.push(MarketDataModel);

module.exports = MarketDataModel;
