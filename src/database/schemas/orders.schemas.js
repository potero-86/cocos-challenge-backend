const { DataTypes } = require('sequelize');

const ordersSchema = {

	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	instrumentId: {
		type: DataTypes.INTEGER,
		allowNull: false,
		field: 'instrumentid'
	},
	userId: {
		type: DataTypes.INTEGER,
		allowNull: false,
		field: 'userid'
	},
	size: {
		type: DataTypes.INTEGER
	},
	price: {
		type: DataTypes.DECIMAL(10, 2)
	},
	type: {
		type: DataTypes.TEXT
	},
	side: {
		type: DataTypes.TEXT
	},
	status: {
		type: DataTypes.TEXT
	},
	datetime: {
		type: DataTypes.DATE
	}
};

module.exports = { ordersSchema };
