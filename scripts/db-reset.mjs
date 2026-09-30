// ลบไฟล์ฐานข้อมูล แล้วสร้างตารางใหม่จาก sql/schema.sql (ใช้ node:sqlite ที่มากับ Node)
import { readFileSync, rmSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

for (const suffix of ["", "-wal", "-shm"]) {
  try { rmSync(`prisma/dev.db${suffix}`); } catch {}
}
const db = new DatabaseSync("prisma/dev.db", { enableForeignKeyConstraints: true });
db.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");
db.exec(readFileSync("sql/schema.sql", "utf-8"));
db.close();
console.log("สร้างตารางใหม่จาก sql/schema.sql แล้ว");
