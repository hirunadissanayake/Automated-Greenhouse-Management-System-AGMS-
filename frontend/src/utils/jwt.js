function base64UrlEncode(value) {
  return btoa(value)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export function buildDevJwt(validMinutes = 120, subject = 'agms-user') {
  const header = { alg: 'none', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: subject,
    iat: now,
    exp: now + validMinutes * 60,
    role: 'farmer',
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  return `${encodedHeader}.${encodedPayload}.signature`;
}

export function getJwtExpirationText(token) {
  try {
    const [, payload] = token.split('.');
    if (!payload) {
      return 'Invalid token format';
    }

    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    if (!decoded.exp) {
      return 'No exp claim';
    }

    const expiryDate = new Date(decoded.exp * 1000);
    return `Expires at ${expiryDate.toLocaleString()}`;
  } catch {
    return 'Unable to decode token';
  }
}
