export const getTimestamp = (): number => {
  return Math.floor(Date.now() / 1000);
};

export function getJwtFromRequest(req?: { headers?: Record<string, string> }) {
  const authHeader = req?.headers?.['authorization'];
  if (typeof authHeader !== 'string') {
    return null;
  }
  const [scheme, token] = authHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }
  return token;
}
