// ลบไฟล์ฐานข้อมูล แล้วสร้างตารางใหม่จาก sql/schema.sql (ใช้ node:sqlite ที่มากับ Node)
// ต่อด้วย scripts/seed.mjs เพื่อเติมข้อมูลตัวอย่าง (npm run db:reset ทำให้ทั้งสองขั้น)
import { readFileSync, rmSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

const path = process.env.DATABASE_PATH ?? "prisma/dev.db";
for (const suffix of ["", "-wal", "-shm"]) {
  try { rmSync(`${path}${suffix}`); } catch {}
}
const db = new DatabaseSync(path, { enableForeignKeyConstraints: true });
db.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");
db.exec(readFileSync("sql/schema.sql", "utf-8"));
db.close();
console.log("สร้างตารางใหม่จาก sql/schema.sql แล้ว");
