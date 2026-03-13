const { DataTypes } = require('sequelize');

const usersSchema = {

    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    email: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    accountnumber: {
        type: DataTypes.TEXT,
        allowNull: false
    }
};

module.exports = { usersSchema };