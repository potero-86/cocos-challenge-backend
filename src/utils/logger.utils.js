class Logger {

    log(level, message, traceId) {

        let stringLog = `|-> ${new Date().toISOString()} |-| ${level} |-| ${traceId ?? ''} |-| ${JSON.stringify(message) ?? ''} <-|`;

        console.log(stringLog);
    }

    info(message, traceId) {
        this.log('INFO', message, traceId);
    }

    debug(message, traceId) {
        this.log('DEBUG', message, traceId);
    }

    warn(message, traceId) {
        this.log('WARN', message, traceId);
    }

    error(message, traceId) {
        this.log('ERROR', message, traceId);
    }

    req(req) {

        const { method, url, body } = req;

        this.log('REQUEST', { method: method?.toUpperCase(), url, body }, req.requestId);
    }

    res(res) {

        const { method, originalUrl } = res.req;

        this.log('RESPONSE', { method: method?.toUpperCase(), url: originalUrl, body: res.body }, res.requestId);
    }
}

module.exports = new Logger();
