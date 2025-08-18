/* eslint-disable no-undef */
import { SHA256 } from 'crypto-js'

export class HashService {
  static sha256 (message) {
    // Use direct buffer output for better performance and security
    const hash = SHA256(message);
    return Buffer.from(hash.toString(), 'hex');
  }
  
  // Alternative method using native crypto if available
  static async sha256Native(message) {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      return Buffer.from(hashBuffer);
    }
    // Fallback to crypto-js
    return this.sha256(message);
  }
}
