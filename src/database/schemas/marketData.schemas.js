const { DataTypes } = require('sequelize');

const marketDataSchema = {

	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	instrumentid: {
		type: DataTypes.INTEGER
	},
	high: {
		type: DataTypes.DECIMAL(10, 2)
	},
	low: {
		type: DataTypes.DECIMAL(10, 2)
	},
	open: {
		type: DataTypes.DECIMAL(10, 2)
	},
	close: {
		type: DataTypes.DECIMAL(10, 2)
	},
	previousclose: {
		type: DataTypes.DECIMAL(10, 2)
	},
	date: {
		type: DataTypes.DATEONLY
	}
};

module.exports = { marketDataSchema };
