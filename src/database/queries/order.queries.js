const createQueryGetAvailableCash = () => {

    return `
        SELECT SUM(
            CASE
                WHEN side IN ('CASH_IN', 'SELL') THEN  size * price
                WHEN side IN ('CASH_OUT', 'BUY') THEN -(size * price)
            END
        ) AS "availableCash"
        FROM orders
        WHERE userid = :userId AND status = 'FILLED'`;
};

const createQueryGetAvailableShares = () => {

    return `
        SELECT SUM(
            CASE 
                WHEN side = 'BUY' THEN size ELSE -size 
            END
        ) AS "availableShares"
        FROM orders
        WHERE userid = :userId AND instrumentid = :instrumentId AND status = 'FILLED'`;
};

module.exports = {

    createQueryGetAvailableCash,
    createQueryGetAvailableShares
};
