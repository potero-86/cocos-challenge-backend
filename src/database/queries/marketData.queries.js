const createQueryGetMarketPrice = (id) => {

    return {
        where: { 'instrumentid': id },
        order: [['date', 'DESC']],
        attributes: ['close'],
        raw: true
    };
};

module.exports = {

    createQueryGetMarketPrice
};
