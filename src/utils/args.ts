// Server
export let address: string = "127.0.0.1";
export let doc: string = "https://127.0.0.1";
export let port: string = '5983';
export let sslPort: string = '5984';
export let isSecureCoookie: boolean = false;
export let certsDir: string = "./certs";
export let isSimple: boolean = true;

export let engine: "sqlite" | "postgres" = "sqlite";

// SQLite
export let dataDir = "./data";

// Postgres
export let host: string = "localhost";
export let username: string = "postgres";
export let password: string = "postgres";