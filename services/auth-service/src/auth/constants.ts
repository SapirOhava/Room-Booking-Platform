// this file for not writing the secret in many places ,
// but instead in one central place
export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'fallback-secret',
};
