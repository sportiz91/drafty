export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  /** Access token lifetime in seconds */
  expiresIn: number;
};

export type AccessTokenPayload = {
  userId: string;
  email: string;
};

/** User shape safe to send to the client (no hash, serializable dates). */
export type PublicUser = {
  id: string;
  email: string;
  createdAt: string;
};
