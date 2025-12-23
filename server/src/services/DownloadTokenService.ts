import { v4 as uuidv4 } from 'uuid';

interface TokenData {
    userId: any;
    expires: number;
}

export class DownloadTokenService {
    private static tokens = new Map<string, TokenData>();
    private static TTL_MS = 30000; // 30 seconds

    /**
     * Generates a new one-time use token for the given user context.
     * @param userContext The user object/context to be restored when token is used.
     * @returns The generated token string (UUID).
     */
    static generateToken(userContext: any): string {
        const token = uuidv4();
        this.tokens.set(token, {
            userId: userContext,
            expires: Date.now() + this.TTL_MS,
        });

        // cleanup periodically? Or just lazy cleanup on access?
        // Let's do a quick lazy cleanup of expired tokens occasionally or relying on map size?
        // For MVP, just simple Map. Ideally run a cleanup interval.

        return token;
    }

    /**
     * Consumes a token. If valid and not expired, returns the user context and deletes the token.
     * If invalid or expired, returns null.
     * Enforces SINGLE USE (Nonce).
     * @param token The token to consume.
     */
    static consumeToken(token: string): any | null {
        const data = this.tokens.get(token);

        // Always delete to prevent replay
        if (data) {
            this.tokens.delete(token);

            if (Date.now() <= data.expires) {
                return data.userId;
            }
        }

        return null;
    }
}
