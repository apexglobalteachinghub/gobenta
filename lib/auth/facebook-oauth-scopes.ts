/**
 * Facebook Login scopes for Supabase OAuth (space-separated).
 * Live apps typically use `public_profile email`. Override with
 * NEXT_PUBLIC_FACEBOOK_LOGIN_SCOPES if needed (e.g. `public_profile` only).
 *
 * @see https://supabase.com/docs/guides/auth/social-login/auth-facebook
 */
export function getFacebookLoginScopes(): string {
  const raw = process.env.NEXT_PUBLIC_FACEBOOK_LOGIN_SCOPES?.trim();
  if (raw) return raw;
  return "public_profile email";
}
