/** PSGC region code for National Capital Region (Metro Manila). */
export const NCR_REGION_CODE = "130000000";

export function isNcrFilterLabel(province: string | undefined): boolean {
  if (!province?.trim()) return false;
  const t = province.trim().toLowerCase();
  return t.includes("ncr") || t.includes("metro manila");
}
