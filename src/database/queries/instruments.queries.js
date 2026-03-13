const { Op } = require('sequelize');

const createQueryGetInstruments = ({ name, ticker, limit }) => {

    const filters = [];

    if (name) {
        filters.push({
            name: { [Op.iLike]: `%${name}%` }
        });
    }

    if (ticker) {
        filters.push({
            ticker: { [Op.iLike]: `%${ticker}%` }
        });
    }

    return {
        where: {
            [Op.or]: filters
        },
        attributes: ['ticker', 'name', 'type'],
        limit,
        order: [['ticker', 'ASC']]
    };
};

const createQueryExistsInstrument = (ticker) => {

    return {
        where: {
            ticker: { [Op.iLike]: ticker }
        },
        raw: true
    };
};

module.exports = {

    createQueryGetInstruments,
    createQueryExistsInstrument
};
