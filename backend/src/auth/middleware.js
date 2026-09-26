/**
 * Account auth middleware — separate from MP guest JWT verification.
 */
import { verifyAccessToken } from './accessToken.js';
import { getAccountById } from './accountRepo.js';

/**
 * @param {{ accountJwtSecret: string }} config
 */
export function createRequireAccountAuth(config) {
  return async function requireAccountAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const match = /^Bearer\s+(.+)$/i.exec(header);
    if (!match) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const claims = verifyAccessToken(match[1], config.accountJwtSecret);
      const account = await getAccountById(claims.accountId);
      if (!account) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      if (account.status === 'pending_delete') {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      if (account.tokenVersion !== claims.tokenVersion) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      req.account = account;
      req.accessClaims = claims;
      return next();
    } catch {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  };
}
