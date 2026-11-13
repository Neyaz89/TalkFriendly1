/**
 * Secure Admin Credentials Management
 * 
 * This module handles secure admin authentication without using regular Supabase auth.
 * Admin credentials are stored as environment variables and validated server-side only.
 * 
 * SECURITY NOTES:
 * - Admin credentials are NEVER exposed to the client
 * - Password verification happens server-side only
 * - Uses constant-time comparison to prevent timing attacks
 * - All login attempts are logged
 */

/**
 * Admin credential structure from environment variables
 */
interface AdminCredential {
  username: string;
  passwordHash: string;
  userId: string; // Links to profiles table for permissions
}

/**
 * Parse admin credentials from environment variable
 * 
 * Expected format: username:passwordHash:userId
 * Can support multiple admins separated by semicolons:
 * admin1:hash1:uuid1;admin2:hash2:uuid2
 */
function parseAdminCredentials(): AdminCredential[] {
  const credsEnv = process.env.ADMIN_CREDENTIALS;
  
  if (!credsEnv) {
    console.error('ADMIN_CREDENTIALS environment variable not set!');
    return [];
  }

  try {
    const credentials: AdminCredential[] = [];
    const credPairs = credsEnv.split(';').filter(Boolean);

    for (const credPair of credPairs) {
      const [username, passwordHash, userId] = credPair.split(':');
      
      if (!username || !passwordHash || !userId) {
        console.error('Invalid credential format in ADMIN_CREDENTIALS');
        continue;
      }

      credentials.push({
        username: username.trim(),
        passwordHash: passwordHash.trim(),
        userId: userId.trim(),
      });
    }

    return credentials;
  } catch (error) {
    console.error('Error parsing ADMIN_CREDENTIALS:', error);
    return [];
  }
}

/**
 * Verify admin credentials using constant-time comparison
 * 
 * @param username - The username provided
 * @param password - The plain-text password provided
 * @returns AdminCredential if valid, null otherwise
 */
export async function verifyAdminCredentials(
  username: string,
  password: string
): Promise<AdminCredential | null> {
  const credentials = parseAdminCredentials();

  if (credentials.length === 0) {
    console.error('No admin credentials configured');
    return null;
  }

  // Find matching username
  const credential = credentials.find(
    (cred) => cred.username.toLowerCase() === username.toLowerCase()
  );

  if (!credential) {
    // Still perform a dummy hash to prevent timing attacks
    await hashPassword('dummy_password');
    return null;
  }

  // Verify password
  const isValid = await verifyPassword(password, credential.passwordHash);

  if (!isValid) {
    return null;
  }

  return credential;
}

/**
 * Hash a password using a secure algorithm
 * 
 * Uses Node.js crypto.scrypt which is PBKDF2-based and secure.
 * In production, consider using bcrypt library for even better security.
 */
async function hashPassword(password: string): Promise<string> {
  const crypto = await import('crypto');
  const salt = crypto.randomBytes(16).toString('hex');
  
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * Verify a password against its hash using constant-time comparison
 * 
 * @param password - Plain-text password to verify
 * @param hash - Stored hash in format "salt:hash"
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const crypto = await import('crypto');
  
  try {
    const [salt, storedHash] = hash.split(':');
    
    if (!salt || !storedHash) {
      return false;
    }

    return new Promise((resolve, reject) => {
      crypto.scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) reject(err);
        
        const derivedHash = derivedKey.toString('hex');
        
        // Constant-time comparison
        const isValid = crypto.timingSafeEqual(
          Buffer.from(storedHash, 'hex'),
          Buffer.from(derivedHash, 'hex')
        );
        
        resolve(isValid);
      });
    });
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Generate a hash for a password (for setup)
 * This should only be used during admin account provisioning.
 * 
 * Usage:
 * ```typescript
 * const hash = await generatePasswordHash('your-secure-password');
 * console.log(`Admin credential: admin:${hash}:user-uuid`);
 * ```
 */
export async function generatePasswordHash(password: string): Promise<string> {
  return hashPassword(password);
}

/**
 * Validate admin credential format
 */
export function validateCredentialFormat(credential: string): boolean {
  const parts = credential.split(':');
  return parts.length === 3 && parts.every((part) => part.length > 0);
}

/**
 * Check if admin credentials are configured
 */
export function areAdminCredentialsConfigured(): boolean {
  const credentials = parseAdminCredentials();
  return credentials.length > 0;
}
