export type OAuthProvider = "google" | "line" | "facebook" | "apple";

export interface OAuthProfile {
  provider: OAuthProvider;
  providerId: string;
  email?: string;
  displayName: string;
  avatarUrl?: string;
}

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}
