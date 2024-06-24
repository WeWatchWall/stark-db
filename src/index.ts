import { Command } from 'commander';
import { args } from "./utils/args";
import { writeFileSync } from 'fs';
import { Server } from './server';

const program = new Command();

program
  .name('stark-db')
  .description('Stark DB CLI');

program
  .description('Run the Stark DB server')
  .option(
    '-a, --address <address>',
    'HTTP address to listen on. Env var: STARK_DB_HTTP_LISTEN_ADDRESS',
    args.address
  )
  .option(
    '-i, --doc <address>',
    'Address to query by the documentation. Env var: STARK_DB_DOC_ADDRESS',
    args.doc
  )
  .option(
    '-p, --port <port>',
    'HTTP port to listen on. Env var: STARK_DB_HTTP_PORT',
    <string>args.port
  )
  .option(
    '-s, --ssl <port>',
    'HTTPS port to listen on. Env var: STARK_DB_HTTPS_PORT',
    <string>args.sslPort
  )
  .option('-c, --cookie',
    'Secure cookie, served over valid HTTPS only. Env var: STARK_DB_COOKIE',
    args.isSecureCookie
  )
  .option(
    '-k, --certs <path>',
    'Path to the certs directory. Env var: STARK_DB_CERTS_DIR',
    args.certsDir
  )
  
  .option(
    '-f, --simple',
    'Do not run change-tracking queries. Env var: STARK_DB_SIMPLE',
    args.isSimple
  )
  .option(
    '-e, --engine <engine>',
    'The DB engine running underneath, i.e. sqlite or postgres. Env var: STARK_DB_ENGINE',
    args.engine
  )
  
  .option(
    '-d, --data <path>',
    'Path to the data directory. Env var: STARK_DB_DATA_DIR',
    args.dataDir
  )
    
  .option(
    '-h, --host <path>',
    'Address of the engine host. Env var: STARK_DB_ENGINE_HOST',
    args.host
  )
  .option(
    '-r, --hostPort <port>',
    'Port of the engine host. Env var: STARK_DB_ENGINE_PORT',
    <string>args.hostPort
  )
  .option(
    '-u, --username <username>',
    'Username for the engine host. Env var: STARK_DB_ENGINE_USERNAME',
    args.username
  )
  .option(
    '-q, --password <password>',
    'Password for the engine host. Env var: STARK_DB_ENGINE_PASSWORD',
    args.password
  );

program.parse(process.argv);
const options = program.opts();

options.port = parseInt(options.port);
options.ssl = parseInt(options.ssl);
options.cookie = options.cookie === 'true' || options.cookie === 't';

options.simple = options.simple === true || options.simple === 'true' || options.simple === 't';

options.enginePort = parseInt(options.enginePort);

args.address = process.env.STARK_DB_HTTP_LISTEN_ADDRESS || options.address;
args.doc = process.env.STARK_DB_DOCUMENTATION_ADDRESS || options.doc;
args.port = parseInt(process.env.STARK_DB_HTTP_PORT) || options.port;
args.sslPort = parseInt(process.env.STARK_DB_HTTPS_PORT) || options.ssl;
args.isSecureCookie = process.env.STARK_DB_COOKIE ? (process.env.STARK_DB_COOKIE === 'true' || process.env.STARK_DB_COOKIE === 't') : options.cookie;
args.certsDir = process.env.STARK_DB_CERTS_DIR || options.certs;

args.isSimple = process.env.STARK_DB_SIMPLE ? (process.env.STARK_DB_SIMPLE === 'true' || process.env.STARK_DB_SIMPLE === 't') : options.simple;
args.engine = process.env.STARK_DB_ENGINE || options.engine;

args.dataDir = process.env.STARK_DB_DATA_DIR || options.data;

args.host = process.env.STARK_DB_ENGINE_HOST || options.host;
args.hostPort = parseInt(process.env.STARK_DB_ENGINE_PORT) || options.enginePort;
args.username = process.env.STARK_DB_ENGINE_USERNAME || options.username;
args.password = process.env.STARK_DB_ENGINE_PASSWORD || options.password;

async function start(): Promise<void>  {
  writeFileSync('stark-db.json', JSON.stringify(args));

  await Server.start(); 
};
start(); // eslint-disable-line