const { Sequelize } = require('sequelize');

const { Logger } = require('./utils');
const Routes = require('./routes/paths');
const { WebServer } = require('./servers');
const { dataBaseInstanceClass } = require('./database');
const CreateRoutes = require('./routes/createRoutes.routes');

class CocosApp {

    constructor() {

        this.server = new WebServer(process.env.WEB_PORT, process.env.BASE_URL);
    }

    async start() {

        this.setRoutes();
        this.server.listen(process.env.APPLICATION_NAME);
        await this.startDataBaseSequelize();
    }

    setRoutes() {

        const cocosRoutes = new CreateRoutes('/v1').addRoutes(Routes.cocosPaths);
        this.server.setRoutes(cocosRoutes);
    }

    async startDataBaseSequelize() {

        dataBaseInstanceClass.createClient(Sequelize);
        dataBaseInstanceClass.defineModelsAndRelations();

        try {

            await dataBaseInstanceClass.authenticate();
            Logger.info('Postgres connection has been established successfully.');

        } catch (err) {

            console.error(err);
            process.exit(1);
        }
    }
}

module.exports = CocosApp;