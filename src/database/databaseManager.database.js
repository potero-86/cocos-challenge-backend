const { QueryTypes } = require('sequelize');

const { Logger } = require('../utils');
const { checkBooleanProcessEnv } = require('../helpers');

class DatabaseManager {

	constructor() {

		this.models = [];
	}
	addModel(model) {

		const modelInit = model.init(model.schema, model.config(this.client));
		model.instanceDatabase = modelInit;
		return modelInit;
	}
	createClient(Sequelize, dbConfig = {}) {

		this.client = new Sequelize(`${process.env.POSTGRES_CNN}`, {
			logging: false,
			dialectOptions: {
				ssl: {
					require: true,
					rejectUnauthorized: false
				}
			},
			define: {
				freezeTableName: true
			},
			pool: {
				max: dbConfig?.pool?.max ?? 20,   			// Máximo de conexiones simultáneas en el pool.
				min: dbConfig?.pool?.min ?? 0,   			// Número mínimo de conexiones que mantiene abiertas el pool.
				idle: dbConfig?.pool?.idle ?? 10000, 		// Tiempo (en ms) que una conexión puede estar inactiva antes de cerrarse.
				acquire: dbConfig?.pool?.acquire ?? 30000, 	// Tiempo máximo (en ms) que Sequelize esperará para obtener una conexión antes de lanzar un error.
			}
		});

		this.client.options.logging = (query) => {
			if (checkBooleanProcessEnv(process.env.POSTGRES_DEBUG_LOGS)) Logger.debug(`${query}`);
		};
	}
	async authenticate() {

		try {

			await this.client.authenticate();
			return;
		}
		catch (error) {
			throw new Error(`Error when trying to establish connection with Postgres: ${error.name}`);
		}
	}
	defineModelsAndRelations() {

		return this.models.map(model => {

			this.addModel(model);
			model.relationTables();
			return model;
		});
	}
	async executeQuery(query, replacements, transaction = null) {

		return await this.client.query(query, {
			replacements,
			type: QueryTypes.SELECT,
			...(transaction && { transaction })
		});
	}
}

module.exports = {

	dataBaseInstanceClass: new DatabaseManager(),
	dataBaseClass: DatabaseManager
};
