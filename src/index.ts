import { Command } from 'commander';
import version from 'project-version';

const program = new Command();

program
  .name('stark-db')
  .description('Stark DB CLI')
  .version(version);

program
  .description('Run the Stark DB server')
  .option(
    '-a, --address <address>',
    'HTTP address to listen on',
    process.env.STARK_DB_HTTP_LISTEN_ADDRESS || '127.0.0.1'
  )
  .option(
    '-i, --doc <address>',
    'Address to query by the documentation',
    process.env.STARK_DB_DOCUMENTATION_ADDRESS || 'https://127.0.0.1'
  )
  .option(
    '-p, --port <port>',
    'HTTP port to listen on',
    process.env.STARK_DB_HTTP_PORT || '5983'
  )
  .option(
    '-s, --ssl <port>',
    'HTTPS port to listen on',
    process.env.STARK_DB_HTTPS_PORT || '5984'
  )
  .option('-c, --cookie',
    'Secure cookie, served over valid HTTPS only',
    process.env.STARK_DB_COOKIE === "true" || false)
  .option(
    '-d, --data-dir <path>',
    'Path to the data directory',
    process.env.STARK_DB_DATA_DIR || './data'
  )
  .option(
    '-c, --certs-dir <path>',
    'Path to the certs directory',
    process.env.STARK_DB_CERTS_DIR || './certs'
  );

program.parse(process.argv);
const options = program.opts();

options.port = parseInt(options.port);
options.ssl = parseInt(options.ssl);
options.cookie = !!options.cookie;

// DON'T USE CONSTANTS IN THIS FILE SO THEY CAN BE PRE-SET BY THE CLI
process.env.STARK_DB_HTTP_LISTEN_ADDRESS = options.address;
process.env.STARK_DB_DOCUMENTATION_ADDRESS = options.doc;
process.env.STARK_DB_HTTP_PORT = options.port;
process.env.STARK_DB_HTTPS_PORT = options.ssl;
process.env.STARK_DB_COOKIE = options.cookie;
process.env.STARK_DB_DATA_DIR = options.dataDir;
process.env.STARK_DB_CERTS_DIR = options.certsDir;

import { Server } from './server';
Server.start(); // eslint-disable-line