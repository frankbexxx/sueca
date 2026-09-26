/**
 * Suecão-owned access JWT (not Google ID token, not MP guest JWT).
 */
import jwt from 'jsonwebtoken';

export const ACCESS_TOKEN_TYP = 'suecao_access';
export const ACCESS_ISSUER = 'suecao';
export const ACCESS_AUDIENCE = 'suecao-api';

/**
 * @param {{ id: string, tokenVersion: number }} account
 * @param {{ secret: string, expiresIn: string }} opts
 */
export function signAccessToken(account, opts) {
  return jwt.sign(
    {
      typ: ACCESS_TOKEN_TYP,
      tv: account.tokenVersion
    },
    opts.secret,
    {
      subject: account.id,
      expiresIn: opts.expiresIn,
      issuer: ACCESS_ISSUER,
      audience: ACCESS_AUDIENCE
    }
  );
}

/**
 * @returns {{ accountId: string, tokenVersion: number, iat?: number, exp?: number }}
 */
export function verifyAccessToken(token, secret) {
  const payload = jwt.verify(token, secret, {
    issuer: ACCESS_ISSUER,
    audience: ACCESS_AUDIENCE
  });
  if (payload.typ !== ACCESS_TOKEN_TYP) {
    const err = new Error('Invalid token type');
    err.name = 'JsonWebTokenError';
    throw err;
  }
  if (typeof payload.sub !== 'string' || !payload.sub) {
    const err = new Error('Missing subject');
    err.name = 'JsonWebTokenError';
    throw err;
  }
  if (typeof payload.tv !== 'number') {
    const err = new Error('Missing token version');
    err.name = 'JsonWebTokenError';
    throw err;
  }
  return {
    accountId: payload.sub,
    tokenVersion: payload.tv,
    iat: payload.iat,
    exp: payload.exp
  };
}
