import * as crypto from "crypto";
import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { OAuthProvider, OAuthProfile } from "./oauth.types";

@Injectable()
export class OAuthService {
  constructor(private readonly config: ConfigService) {}

  getAuthorizationUrl(provider: OAuthProvider, sessionId: string): string {
    const callbackUrl = this.getCallbackUrl(provider);
    const state = Buffer.from(JSON.stringify({ sessionId })).toString(
      "base64url",
    );

    switch (provider) {
      case "google":
        return this.googleAuthUrl(callbackUrl, state);
      case "line":
        return this.lineAuthUrl(callbackUrl, state);
      case "facebook":
        return this.facebookAuthUrl(callbackUrl, state);
      case "apple":
        return this.appleAuthUrl(callbackUrl, state);
      default:
        throw new BadRequestException(`Unsupported provider: ${provider}`);
    }
  }

  async exchangeCode(
    provider: OAuthProvider,
    code: string,
  ): Promise<OAuthProfile> {
    const callbackUrl = this.getCallbackUrl(provider);

    switch (provider) {
      case "google":
        return this.exchangeGoogleCode(code, callbackUrl);
      case "line":
        return this.exchangeLineCode(code, callbackUrl);
      case "facebook":
        return this.exchangeFacebookCode(code, callbackUrl);
      case "apple":
        return this.exchangeAppleCode(code, callbackUrl);
      default:
        throw new BadRequestException(`Unsupported provider: ${provider}`);
    }
  }

  private getCallbackUrl(provider: OAuthProvider): string {
    const baseUrl =
      this.config.get<string>("API_BASE_URL") || "http://localhost:3000";
    return `${baseUrl}/api/auth/${provider}/callback`;
  }

  private getRequired(key: string): string {
    const val = this.config.get<string>(key);
    if (!val) throw new BadRequestException(`${key} is not configured`);
    return val;
  }

  // ─── Google ──────────────────────────────────────────

  private googleAuthUrl(callbackUrl: string, state: string): string {
    const clientId = this.getRequired("GOOGLE_CLIENT_ID");
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: "code",
      scope: "openid email profile",
      state,
      access_type: "offline",
      prompt: "select_account",
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  private async exchangeGoogleCode(
    code: string,
    callbackUrl: string,
  ): Promise<OAuthProfile> {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: this.getRequired("GOOGLE_CLIENT_ID"),
        client_secret: this.getRequired("GOOGLE_CLIENT_SECRET"),
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      error?: string;
    };
    if (!tokenData.access_token)
      throw new BadRequestException("Google auth failed");

    const userRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } },
    );
    const user = (await userRes.json()) as {
      id: string;
      email?: string;
      name?: string;
      picture?: string;
    };

    return {
      provider: "google",
      providerId: user.id,
      email: user.email,
      displayName: user.name || "Google User",
      avatarUrl: user.picture,
    };
  }

  // ─── LINE ────────────────────────────────────────────

  private lineAuthUrl(callbackUrl: string, state: string): string {
    const clientId = this.getRequired("LINE_CHANNEL_ID");
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: callbackUrl,
      state,
      scope: "profile openid email",
    });
    return `https://access.line.me/oauth2/v2.1/authorize?${params}`;
  }

  private async exchangeLineCode(
    code: string,
    callbackUrl: string,
  ): Promise<OAuthProfile> {
    const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: callbackUrl,
        client_id: this.getRequired("LINE_CHANNEL_ID"),
        client_secret: this.getRequired("LINE_CHANNEL_SECRET"),
      }),
    });
    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      error?: string;
    };
    if (!tokenData.access_token)
      throw new BadRequestException("LINE auth failed");

    const profileRes = await fetch("https://api.line.me/v2/profile", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = (await profileRes.json()) as {
      userId: string;
      displayName?: string;
      pictureUrl?: string;
    };

    return {
      provider: "line",
      providerId: profile.userId,
      displayName: profile.displayName || "LINE User",
      avatarUrl: profile.pictureUrl,
    };
  }

  // ─── Facebook ────────────────────────────────────────

  private facebookAuthUrl(callbackUrl: string, state: string): string {
    const clientId = this.getRequired("FACEBOOK_APP_ID");
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      state,
      scope: "email,public_profile",
      response_type: "code",
    });
    return `https://www.facebook.com/v19.0/dialog/oauth?${params}`;
  }

  private async exchangeFacebookCode(
    code: string,
    callbackUrl: string,
  ): Promise<OAuthProfile> {
    const params = new URLSearchParams({
      client_id: this.getRequired("FACEBOOK_APP_ID"),
      client_secret: this.getRequired("FACEBOOK_APP_SECRET"),
      redirect_uri: callbackUrl,
      code,
    });
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?${params}`,
    );
    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      error?: unknown;
    };
    if (!tokenData.access_token)
      throw new BadRequestException("Facebook auth failed");

    const userRes = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${tokenData.access_token}`,
    );
    const user = (await userRes.json()) as {
      id: string;
      name?: string;
      email?: string;
      picture?: { data?: { url?: string } };
    };

    return {
      provider: "facebook",
      providerId: user.id,
      email: user.email,
      displayName: user.name || "Facebook User",
      avatarUrl: user.picture?.data?.url,
    };
  }

  // ─── Apple ───────────────────────────────────────────

  private appleAuthUrl(callbackUrl: string, state: string): string {
    const clientId = this.getRequired("APPLE_CLIENT_ID");
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: "code",
      scope: "name email",
      state,
      response_mode: "form_post",
    });
    return `https://appleid.apple.com/auth/authorize?${params}`;
  }

  private async exchangeAppleCode(
    code: string,
    callbackUrl: string,
  ): Promise<OAuthProfile> {
    const clientSecret = this.generateAppleClientSecret();

    const tokenRes = await fetch("https://appleid.apple.com/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.getRequired("APPLE_CLIENT_ID"),
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: callbackUrl,
      }),
    });
    const tokenData = (await tokenRes.json()) as {
      id_token?: string;
      error?: string;
    };
    if (!tokenData.id_token)
      throw new BadRequestException("Apple auth failed");

    const payload = JSON.parse(
      Buffer.from(tokenData.id_token.split(".")[1], "base64").toString(),
    ) as { sub: string; email?: string };

    return {
      provider: "apple",
      providerId: payload.sub,
      email: payload.email,
      displayName: payload.email?.split("@")[0] || "Apple User",
    };
  }

  /**
   * Apple requires a JWT client secret signed with the private key.
   * This is a simplified implementation — production should cache the generated token.
   */
  private generateAppleClientSecret(): string {
    const teamId = this.getRequired("APPLE_TEAM_ID");
    const clientId = this.getRequired("APPLE_CLIENT_ID");
    const keyId = this.getRequired("APPLE_KEY_ID");
    const privateKey = this.getRequired("APPLE_PRIVATE_KEY").replace(
      /\\n/g,
      "\n",
    );

    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "ES256", kid: keyId };
    const claims = {
      iss: teamId,
      iat: now,
      exp: now + 15777000,
      aud: "https://appleid.apple.com",
      sub: clientId,
    };

    const encode = (obj: object) =>
      Buffer.from(JSON.stringify(obj)).toString("base64url");
    const unsigned = `${encode(header)}.${encode(claims)}`;
    const sign = crypto.createSign("SHA256");
    sign.update(unsigned);
    const signature = sign
      .sign(privateKey, "base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    return `${unsigned}.${signature}`;
  }
}
