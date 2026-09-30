// ค่าจาก URL (?key=value) ที่ Next.js ส่งให้หน้าเพจ — ใช้ร่วมกันทุกหน้า

/** searchParams ของหน้าเพจ (Next.js 16 ส่งมาเป็น Promise) */
export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** เอาค่าแรก ถ้า URL มีคีย์เดียวกันหลายครั้ง เช่น ?date=a&date=b → "a" */
export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
