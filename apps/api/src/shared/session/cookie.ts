import type { CookieOptions, Response } from 'express';
import { env } from '@repo/config/server';

/**
 * Atributos de la cookie de sesión.
 *
 * `secure` y `sameSite` salen de configuración porque valen distinto en local y
 * en producción: en local ambos puertos son el mismo sitio y `secure` sobre HTTP
 * haría que el navegador descartara la cookie; en producción el frontend y el
 * API están en dominios distintos y hace falta `none` + `secure`.
 *
 * Fijarlos en el código rompe uno de los dos entornos, y en producción lo hace
 * de la peor forma: el ingreso responde bien y la petición siguiente llega sin
 * sesión.
 */
function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAMESITE,
    path: '/',
  };
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(env.COOKIE_NAME, token, cookieOptions());
}

export function clearSessionCookie(res: Response): void {
  // Los atributos deben coincidir con los de emisión o el navegador no la borra.
  res.clearCookie(env.COOKIE_NAME, cookieOptions());
}

export function readSessionCookie(cookies: Record<string, unknown>): string | null {
  const value = cookies[env.COOKIE_NAME];
  return typeof value === 'string' && value.length > 0 ? value : null;
}
