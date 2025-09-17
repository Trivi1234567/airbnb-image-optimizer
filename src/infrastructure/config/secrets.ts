import { env } from './environment';

/**
 * Secrets management utility
 * Provides secure access to sensitive configuration values
 */
export class SecretsManager {
  private static instance: SecretsManager;
  private secrets: Map<string, string> = new Map();

  private constructor() {
    this.loadSecrets();
  }

  static getInstance(): SecretsManager {
    if (!SecretsManager.instance) {
      SecretsManager.instance = new SecretsManager();
    }
    return SecretsManager.instance;
  }

  private loadSecrets(): void {
    // Load secrets from environment variables
    this.secrets.set('APIFY_TOKEN', env.APIFY_TOKEN);
    this.secrets.set('GEMINI_API_KEY', env.GEMINI_API_KEY);
    this.secrets.set('NEXTAUTH_SECRET', env.NEXTAUTH_SECRET);
    
    if (env.JWT_SECRET) {
      this.secrets.set('JWT_SECRET', env.JWT_SECRET);
    }
    
    if (env.REDIS_PASSWORD) {
      this.secrets.set('REDIS_PASSWORD', env.REDIS_PASSWORD);
    }

    if (env.SMTP_PASSWORD) {
      this.secrets.set('SMTP_PASSWORD', env.SMTP_PASSWORD);
    }
  }

  /**
   * Get a secret value by key
   * @param key Secret key
   * @returns Secret value or undefined if not found
   */
  getSecret(key: string): string | undefined {
    return this.secrets.get(key);
  }

  /**
   * Get a secret value by key with fallback
   * @param key Secret key
   * @param fallback Fallback value if secret not found
   * @returns Secret value or fallback
   */
  getSecretWithFallback(key: string, fallback: string): string {
    return this.secrets.get(key) || fallback;
  }

  /**
   * Check if a secret exists
   * @param key Secret key
   * @returns True if secret exists
   */
  hasSecret(key: string): boolean {
    return this.secrets.has(key);
  }

  /**
   * Get all secret keys
   * @returns Array of secret keys
   */
  getSecretKeys(): string[] {
    return Array.from(this.secrets.keys());
  }

  /**
   * Mask sensitive values for logging
   * @param value Value to mask
   * @returns Masked value
   */
  maskSecret(value: string): string {
    if (value.length <= 8) {
      return '*'.repeat(value.length);
    }
    return value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4);
  }

  /**
   * Validate all required secrets are present
   * @returns True if all required secrets are present
   */
  validateSecrets(): boolean {
    const requiredSecrets = [
      'APIFY_TOKEN',
      'GEMINI_API_KEY',
    ];

    const missingSecrets = requiredSecrets.filter(key => !this.hasSecret(key));
    
    if (missingSecrets.length > 0) {
      console.error('❌ Missing required secrets:', missingSecrets);
      return false;
    }

    return true;
  }

  /**
   * Get secrets summary for health check (masked)
   * @returns Object with masked secret status
   */
  getSecretsSummary(): Record<string, { exists: boolean; masked: string }> {
    const summary: Record<string, { exists: boolean; masked: string }> = {};
    
    for (const key of this.getSecretKeys()) {
      const value = this.getSecret(key);
      summary[key] = {
        exists: !!value,
        masked: value ? this.maskSecret(value) : 'N/A',
      };
    }

    return summary;
  }
}

// Export singleton instance
export const secretsManager = SecretsManager.getInstance();

// Convenience functions
export const getSecret = (key: string): string | undefined => secretsManager.getSecret(key);
export const getSecretWithFallback = (key: string, fallback: string): string => 
  secretsManager.getSecretWithFallback(key, fallback);
export const hasSecret = (key: string): boolean => secretsManager.hasSecret(key);
export const maskSecret = (value: string): string => secretsManager.maskSecret(value);
export const validateSecrets = (): boolean => secretsManager.validateSecrets();
export const getSecretsSummary = () => secretsManager.getSecretsSummary();
