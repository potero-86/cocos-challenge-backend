const cors = require('cors');
const express = require('express');

const { Logger } = require('../utils');
const { WebServerErrors } = require('../errors');
const CreateRoutes = require('../routes/createRoutes.routes');
const defaultsPaths = require('../routes/paths/default.paths');
const { firstRequest, catchErrors } = require('../routes/middlewares/webServer.middlewares');

class WebServer {

    constructor(portWeb, baseUrl) {

        this.port = portWeb;
        this.baseUrl = baseUrl ? baseUrl.replace(/ /g, '') : '';
        this.app = express();
        this.middlewares();
        this.setDefaultRoutes();
    }

    getApp() { return this.app }

    middlewares() {

        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(firstRequest.bind(this));
    }

    setRoutes(route) {

        this.app.use(`${this.baseUrl}${route.path}`, route.createRoutes());
    }

    setDefaultRoutes() {

        const defaultRoutes = new CreateRoutes('/').addRoutes(defaultsPaths);
        this.app.use(defaultRoutes.path, defaultRoutes.createRoutes());
    }

    listen(AppName) {

        this.app.use((req, res, next) => { next(WebServerErrors.notFound(req.originalUrl)); });
        this.app.use(catchErrors.bind(this));

        this.server = this.app.listen(this.port, () => {

            Logger.info(`${AppName} running on http://localhost:${this.port}.`);
        });

        this.server.on('error', (err) => {

            if (err.errno === 'EADDRINUSE') { Logger.error('Web Server: error, Port busy.'); }
            else { Logger.error('Web Server: error, ' + err); }
        });
    }
}

module.exports = WebServer;