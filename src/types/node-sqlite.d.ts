// ประกาศชนิดส่วนที่ใช้ของโมดูล node:sqlite (มากับ Node 22+; @types/node 20 ยังไม่รวมให้)
declare module "node:sqlite" {
  export type StatementResultingChanges = { changes: number | bigint; lastInsertRowid: number | bigint };
  export class DatabaseSync {
    constructor(path: string, options?: { enableForeignKeyConstraints?: boolean; open?: boolean });
    exec(sql: string): void;
    prepare(sql: string): {
      run(...params: (string | number | null)[]): StatementResultingChanges;
      get(...params: (string | number | null)[]): unknown;
      all(...params: (string | number | null)[]): unknown[];
    };
    close(): void;
  }
}
