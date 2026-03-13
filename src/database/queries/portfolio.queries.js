const createQueryGetPortfolio = () => {

    // totalSize: Calcula el size de un activo (BUY - SELL).
    // avgBuyPrice: Calcula el promedio del valor de compras del activo (`avgBuyPrice` = (size * price)/size).
    // LEFT JOIN: Subquery que para cada instrumento agarra solo la fila más reciente.
    // WHERE: Solo órdenes ejecutadas (FILLED) del usuario, y solo instrumentos de tipo ACCIONES —> excluye el cash (MONEDA).
    // HAVING: Elimina activos donde totalSize = 0, es decir, posiciones que abriste y cerraste completamente. Si compraste 10 y vendiste 10, no aparece en el portfolio.

    return `
        SELECT
            o.instrumentid,
            i.ticker, i.name, i.type,
            md.close, md.previousclose,
            SUM(CASE WHEN o.side = 'BUY' THEN o.size ELSE -o.size END) AS "totalSize",
            SUM(CASE WHEN o.side = 'BUY' THEN o.size * o.price ELSE 0 END) /
            NULLIF(SUM(CASE WHEN o.side = 'BUY' THEN o.size ELSE 0 END), 0) AS "avgBuyPrice"
        FROM orders o
        JOIN instruments i ON o.instrumentid = i.id
        LEFT JOIN (
            SELECT DISTINCT ON (instrumentid) instrumentid, close, previousclose
            FROM marketdata
            ORDER BY instrumentid, date DESC
        ) md ON md.instrumentid = o.instrumentid
        WHERE o.userid = :userId AND o.status = 'FILLED' AND i.type = 'ACCIONES'
        GROUP BY o.instrumentid, i.ticker, i.name, i.type, md.close, md.previousclose
        HAVING SUM(CASE WHEN o.side = 'BUY' THEN o.size ELSE -o.size END) <> 0;`
};

module.exports = {

    createQueryGetPortfolio
};
