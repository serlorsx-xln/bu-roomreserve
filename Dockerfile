# ─── ระบบจองห้องเรียน BU RoomReserve — Docker image ───
# build ทีเดียว: ติดตั้ง → คอมไพล์ → รันด้วยไฟล์ที่จำเป็นเท่านั้น (standalone)

FROM node:24-alpine AS builder
WORKDIR /app

# ติดตั้ง dependencies ก่อน เพื่อใช้แคชของ Docker เมื่อ package.json ไม่เปลี่ยน
# --include=dev: บังคับติดตั้ง devDependencies เสมอ แม้ NODE_ENV=production ถูกส่งเข้ามาตอน build
# (Coolify ตั้ง NODE_ENV=production แบบ "Available at Buildtime" ซึ่งทำให้ npm ci ข้าม devDeps)
COPY package.json package-lock.json* ./
RUN npm ci --include=dev

# คอมไพล์แอป (output: "standalone" ใน next.config.ts)
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ─── ตัวรันจริง — ไฟล์น้อยที่สุด ───
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 TZ=Asia/Bangkok

# ผู้ใช้ที่ไม่ใช่ root (ความปลอดภัย)
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# ไฟล์ standalone + static + public จากขั้นคอมไพล์
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# โครงสร้างฐานข้อมูล (สร้างตารางตอนเปิดแอปครั้งแรกถ้ายังไม่มี) และสคริปต์เติมข้อมูลตัวอย่าง
COPY --from=builder --chown=nextjs:nodejs /app/sql ./sql
COPY --from=builder --chown=nextjs:nodejs /app/scripts/seed-cloud.mjs ./scripts/seed-cloud.mjs
# bcryptjs สำหรับ seed-cloud.mjs (คัดลอกแบบเจาะจง)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/bcryptjs ./node_modules/bcryptjs
# bcryptjs สำหรับ seed-cloud.mjs (จาก node_modules ของ standalone มีอยู่แล้ว)

# ฐานข้อมูล SQLite อยู่ใน volume เพื่อให้ข้อมูลอยู่รอดตอน container สร้างใหม่
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data
ENV DATABASE_PATH=/app/data/dev.db
VOLUME /app/data

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0

# เติมข้อมูลตัวอย่างเฉพาะเมื่อฐานข้อมูลยังว่าง (ครั้งแรกเท่านั้น) แล้วค่อยเริ่มเซิร์ฟเวอร์
CMD ["sh", "-c", "node scripts/seed-cloud.mjs && node server.js"]
