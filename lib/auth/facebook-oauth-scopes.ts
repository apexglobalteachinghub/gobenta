/**
 * Scopes sent to Facebook Login via Supabase OAuth.
 *
 * If Meta shows "Invalid Scopes: email", your app is not allowed to request
 * `email` yet. Default to `public_profile` only so sign-in works; add `email`
 * in Meta (Facebook Login → Permissions / Use cases) then set
 * NEXT_PUBLIC_FACEBOOK_LOGIN_SCOPES="public_profile email" in .env.local
 * (space-separated, per Supabase / Facebook Login).
 *
 * @see https://developers.facebook.com/docs/facebook-login/permissions
 */
export function getFacebookLoginScopes(): string {
  const raw = process.env.NEXT_PUBLIC_FACEBOOK_LOGIN_SCOPES?.trim();
  if (raw) return raw;
  return "public_profile";
}
