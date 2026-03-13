const checkBooleanProcessEnv = (varValue) => {

	try {

		const value = JSON.parse(varValue.toLowerCase());

		if (typeof value !== 'boolean') {
			throw new Error('Valor no booleano');
		}

		return value;

	} catch (e) {

		return false;
	}
};

module.exports = checkBooleanProcessEnv;
