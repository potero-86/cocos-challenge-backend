class WebServerError extends Error {

    constructor(status, error, message) {

        super(message);

        this.status = status;
        this.error = error;
        this.message = message;
    }

    toJSON() {

        return {
            status: this.status,
            error: this.error,
            message: this.message
        };
    }

    static notFound(resource) {

        return new WebServerError(
            404,
            'Not Found',
            `Resource ${resource} not found`
        );
    }

    static internal(message = 'Internal Server Error') {

        return new WebServerError(
            500,
            'Internal Server Error',
            message
        );
    }
}

module.exports = WebServerError;
