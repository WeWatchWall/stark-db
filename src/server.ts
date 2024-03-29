import cluster from 'cluster'; // Only required if you want cluster.worker.id
import express from 'express';
import session from 'express-session';
import http from 'http';
import memoryStore from 'memorystore';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import sticky from 'sticky-session-custom';
import swaggerUi from 'swagger-ui-express';
import path from 'node:path';
import cors from 'cors';

import DBController from './controllers/DBs';
import authController from './controllers/auth';
import userController from './controllers/users';
import queryController from './controllers/query';
import {
  CERT_DIR,
  DOCUMENTATION_ADDRESS,
  HTTPS_PORT,
  HTTP_LISTEN_ADDRESS,
  HTTP_PORT,
  ONE,
  SECURE_COOKIE,
  SESSION_EXPIRY,
  ZERO
} from './utils/constants';
import { Services } from './controllers/services';
import { DB } from './services/DB';
import { User } from './services/user';
import { DBFile } from './services/DBFile';

export class Server {
  public static async start() {
    const app = express();
    app.use(cors());
    app.set('trust proxy', ONE) // trust first proxy

    /* #region Setup Swagger. */
    const JSONPath =
      path.join(__dirname, '..', '..', 'src', 'utils', 'swagger.json');
    const swaggerDocument =
      JSON.parse(fs.readFileSync(JSONPath).toString());
    swaggerDocument.servers[ZERO].url = `${DOCUMENTATION_ADDRESS}:${HTTPS_PORT}`;
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    /* #endregion */

    /* #region Setup the session store. */
    const MemoryStore = <any>memoryStore(session);
    app.use(session({
      secret: randomBytes(16).toString('hex'),
      resave: true,
      saveUninitialized: true,
      cookie: { secure: SECURE_COOKIE }, // TODO: Enable when HTTPS is enabled.
      store: new MemoryStore({
        checkPeriod: SESSION_EXPIRY
      }),
    }));
    /* #endregion */

    app.use(express.json());

    /* #region Setup the services. */
    Services.DB = new DB();
    await Services.DB.init();

    Services.User = new User(Services.DB.adminDB);

    Services.DBFile = new DBFile(Services.DB.adminDB);
    /* #endregion */

    /* #region Setup the routes. */
    app.use('', DBController);
    app.use('', userController);
    app.use('', authController);
    app.use('', queryController);
    /* #endregion */

    const server = http.createServer(app);

    // Setup sticky sessions with PID parameter.
    const master = sticky.listen(server, HTTP_PORT, HTTP_LISTEN_ADDRESS, {
      generatePrehashArray(req: any, _socket: any) {
        const parsed = new URL(req.url, 'https://dummyurl.example.com');
        // You can use '' instead of  Math.random().toString() if you want to use
        // a consistent worker for all unauthenticated requests.
        const userToken = parsed.searchParams.get('pid') || '';
        // turn string into an array of numbers for hashing
        return (userToken.split('') || [' ']).map(e => e.charCodeAt(0));
      }
    });

    if (master) {
      // Master code
      server.once('listening', function () {
        console.log(`HTTP Server listening on address: ${HTTP_LISTEN_ADDRESS}, port: ${HTTP_PORT}`);
        console.log(`HTTPS Proxy listening on address 0.0.0.0 (all incoming) port: ${HTTPS_PORT}`);
      });

      const { key, cert } = Server.getPems();

      /* #region Create the HTTPS proxy server in front of a HTTP server. */
      const httpProxy = require('http-proxy');
      httpProxy.createServer({
        target: {
          host: HTTP_LISTEN_ADDRESS,
          port: HTTP_PORT
        },
        ssl: { key, cert }
      }).listen(HTTPS_PORT);
      /* #endregion */
    } else {
      // Worker code
      console.log(`Worker: ${cluster.worker.id}, Status: Started`);
    }
  }

  /* #region Certificate generation. */
  private static getPems(): { key: string, cert: string } {
    const keyPath = path.join(CERT_DIR, 'key.pem');
    const certPath = path.join(CERT_DIR, 'cert.pem');

    const hasCert =
      fs.existsSync(keyPath) &&
      fs.existsSync(certPath);

    if (!hasCert) { Server.setPems(); }

    return {
      key: fs.readFileSync(keyPath, 'utf8'),
      cert: fs.readFileSync(certPath, 'utf8')
    };
  }

  private static setPems() {
    const selfsigned = require('selfsigned');
    const pems = selfsigned.generate([{
      name: 'commonName',
      value: '127.0.0.1'
    }], {
      days: 365
    });

    fs.mkdirSync(CERT_DIR, { recursive: true });

    fs.writeFileSync(path.join(CERT_DIR, 'key.pem'), pems.private, 'utf8');
    fs.writeFileSync(path.join(CERT_DIR, 'cert.pem'), pems.cert, 'utf8');
  }
  /* #endregion */
}