import type { UserRole } from "@/types/database";

/** Cookie set before Google OAuth on register so we can store buyer/seller after callback. */
export const PENDING_ROLE_COOKIE = "pending_registration_role";

export type AccountRole = UserRole;

export function setPendingRoleCookieClient(role: AccountRole) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${PENDING_ROLE_COOKIE}=${role}; Path=/; Max-Age=600; SameSite=Lax${secure}`;
}

export function clearPendingRoleCookieClient() {
  if (typeof document === "undefined") return;
  document.cookie = `${PENDING_ROLE_COOKIE}=; Path=/; Max-Age=0`;
}
