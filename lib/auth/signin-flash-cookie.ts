/** Set by `/auth/callback` on failure; login page reads once and shows a toast. */
export const SIGNIN_FLASH_COOKIE = "gobenta_signin_flash";

export type SigninFlashValue = "oauth" | "missing_code";

export function readAndClearSigninFlashClient(): SigninFlashValue | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(
    new RegExp(`(?:^|; )${SIGNIN_FLASH_COOKIE}=([^;]*)`),
  );
  if (!m) return null;
  let v: string;
  try {
    v = decodeURIComponent(m[1]);
  } catch {
    v = m[1];
  }
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${SIGNIN_FLASH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
  if (v === "oauth" || v === "missing_code") return v;
  return "oauth";
}
