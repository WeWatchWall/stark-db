class ArgsType {
  address: string;
  doc: string;
  port: string | number;
  sslPort: string | number;
  isSecureCookie: boolean;
  certsDir: string;
  isSimple: boolean;
  engine: 'sqlite' | 'postgres';
  dataDir: string;
  host: string;
  hostPort: string | number;
  username: string;
  password: string;
}

export const args: ArgsType = {
  address: '127.0.0.1',
  doc: 'https://127.0.0.1',
  port: '5983',
  sslPort: '5984',
  isSecureCookie: false,
  certsDir: './certs',
  isSimple: true,
  engine: 'sqlite',
  
  dataDir: './data',
  
  host: 'localhost',
  hostPort: '5432',
  username: 'postgres',
  password: 'postgres',
}

