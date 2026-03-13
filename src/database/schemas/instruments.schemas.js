const { DataTypes } = require('sequelize');

const instrumentsSchema = {

	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		allowNull: false,
	},
	ticker: {
		type: DataTypes.TEXT,
		allowNull: false
	},
	name: {
		type: DataTypes.TEXT,
		allowNull: false
	},
	type: {
		type: DataTypes.TEXT,
		allowNull: false
	}
};

module.exports = { instrumentsSchema };
