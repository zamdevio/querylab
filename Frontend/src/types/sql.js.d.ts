declare module 'sql.js' {
  export interface Database {
    run(sql: string): void;
    exec(sql: string): Array<{ columns: string[]; values: unknown[][] }>;
    export(): Uint8Array;
  }

  export interface InitSqlJsStatic {
    Database: new () => Database;
  }

  export default function initSqlJs(
    config?: { locateFile?: (file: string) => string }
  ): Promise<InitSqlJsStatic>;
}

