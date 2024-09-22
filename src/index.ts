import { Command, Option } from 'commander';
import { createPinia } from 'pinia';
import { createApp } from 'vue';

import { useOptionsStore } from './stores/options';
import { DB_TYPES } from './utils/constants';


const pinia = createPinia();
const app = createApp({});
app.use(pinia);

const CLIStore = useOptionsStore();

const program = new Command();

program
  .name('stark-db')
  .description('Stark DB CLI');

program
  .description('Run the Stark DB server')
  .addOption(
    new Option('-a, --address <address>', 'unprotected HTTP address to listen on')
      .env('STARK_DB_HTTP_LISTEN_ADDRESS')
      .default('127.0.0.1')
  )
  .addOption(
    new Option('-i, --doc <address>', 'Address to query by the documentation')
      .env('STARK_DB_DOCUMENTATION_ADDRESS')
      .default('https://127.0.0.1')
  )
  .addOption(
    new Option('-p, --port <port>', 'HTTP port to listen on')
      .env('STARK_DB_HTTP_PORT')
      .default('5983')
  )
  .addOption(
    new Option('-s, --ssl <port>', 'HTTPS port to listen on')
      .env('STARK_DB_HTTPS_PORT')
      .default('5984')
  )
  .addOption(
    new Option('-c, --cookie', 'Secure cookie, served over valid HTTPS only')
      .env('STARK_DB_COOKIE')
      .default(false)
  )
  .addOption(
    new Option('-k, --certs <path>', 'Path to the certs directory')
      .env('STARK_DB_CERTS_DIR')
      .default('./certs')
  )
  
  .addOption(
    new Option('-e, --engine <engine>', 'DB engine to use (SQLite, PostgreSQL)')
      .env('STARK_DB_ENGINE')
      .default('SQLite')
  )
  
  .addOption(
    new Option('-d, --data <path>', 'Path to the data directory')
      .env('STARK_DB_DATA_DIR')
      .default('./data')
  )
  
  .addOption(
    new Option('-j, --pghost <address>', 'PostgreSQL host')
      .env('STARK_DB_PG_HOST')
      .default('localhost')
  
  )
  .addOption(
    new Option('-q, --pgport <port>', 'PostgreSQL port')
      .env('STARK_DB_PG_PORT')
      .default('5432')
  )
  .addOption(
    new Option('-u, --pguser <path>', 'PostgreSQL user')
      .env('STARK_DB_PG_USER')
      .default('postgres')
  )
  .addOption(
    new Option('-r, --pgpassword <password>', 'PostgreSQL password')
      .env('STARK_DB_PG_PASSWORD')
      .default('postgres')
  );

program.parse();
const options = program.opts();
  
options.port = parseInt(options.port);
options.ssl = parseInt(options.ssl);
options.cookie = !!options.cookie;
options.engine = options.engine === 'PostgreSQL' ? 'PostgreSQL' : 'SQLite' as DB_TYPES;
options.pgport = parseInt(options.pgport);

CLIStore.setOptions(options);