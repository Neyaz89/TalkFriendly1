/**
 * Generate Admin Credentials Script
 * 
 * This script generates secure admin credentials that can be added to
 * your environment variables.
 * 
 * Usage:
 * ```bash
 * npx tsx scripts/generate-admin-credentials.ts
 * ```
 * 
 * The script will:
 * 1. Prompt for username and password
 * 2. Prompt for the admin user's UUID from your profiles table
 * 3. Generate a secure hash
 * 4. Output the credential string to add to .env.local
 */

import * as readline from 'readline';
import * as crypto from 'crypto';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║      TalkFriendly Admin Credential Generator          ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log('This script will generate a secure admin credential string.');
  console.log('You will need to add this to your .env.local file.\n');

  // Get username
  const username = await question('Enter admin username: ');
  if (!username || username.length < 3) {
    console.error('\n❌ Error: Username must be at least 3 characters long.');
    process.exit(1);
  }

  // Get password
  const password = await question('Enter admin password (min 8 characters): ');
  if (!password || password.length < 8) {
    console.error('\n❌ Error: Password must be at least 8 characters long.');
    process.exit(1);
  }

  // Confirm password
  const passwordConfirm = await question('Confirm password: ');
  if (password !== passwordConfirm) {
    console.error('\n❌ Error: Passwords do not match.');
    process.exit(1);
  }

  console.log('\n📋 You need the UUID of the admin user from your profiles table.');
  console.log('   Steps to get this:');
  console.log('   1. Go to Supabase Dashboard → Table Editor → profiles');
  console.log('   2. Find or create a profile with account_type = "admin"');
  console.log('   3. Copy the UUID from the "id" column\n');

  const userId = await question('Enter admin user UUID: ');
  if (!userId || userId.length < 30) {
    console.error('\n❌ Error: Invalid UUID format.');
    process.exit(1);
  }

  console.log('\n⏳ Generating secure credential hash...\n');

  try {
    const passwordHash = await hashPassword(password);
    const credential = `${username}:${passwordHash}:${userId}`;

    console.log('✅ Credential generated successfully!\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Add this to your .env.local file:');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`ADMIN_CREDENTIALS="${credential}"\n`);
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('📝 IMPORTANT SECURITY NOTES:');
    console.log('   • Never commit this credential to Git');
    console.log('   • Never share this credential publicly');
    console.log('   • Store it securely in your environment variables');
    console.log('   • For production, use your hosting provider\'s secrets management');
    console.log('   • Rotate credentials periodically\n');

    console.log('🔐 To add multiple admin users:');
    console.log('   Separate credentials with semicolons:');
    console.log('   ADMIN_CREDENTIALS="admin1:hash1:uuid1;admin2:hash2:uuid2"\n');

    console.log('✨ Done! You can now log in to the admin dashboard.\n');

  } catch (error) {
    console.error('\n❌ Error generating credential:', error);
    process.exit(1);
  }

  rl.close();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
