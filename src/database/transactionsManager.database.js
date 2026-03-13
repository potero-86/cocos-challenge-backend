const { dataBaseInstanceClass } = require('./databaseManager.database');

class TransactionManager {

	async startTransaction() {

		this.transaction = await dataBaseInstanceClass.client.transaction();
		return this;
	}

	getTransaction() {

		return this.transaction;
	}

	async commitTransaction() {

		if (!this.transaction) return;
		await this.transaction.commit();
	}

	async abortTransaction() {

		if (!this.transaction) return;
		await this.transaction.rollback();
	}
}

module.exports = TransactionManager;
