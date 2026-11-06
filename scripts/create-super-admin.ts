/**
 * Super Admin Bootstrap Script
 * 
 * This script creates the first super admin account for the platform.
 * 
 * Usage:
 *   npm run create-super-admin
 * 
 * Or with custom values:
 *   npm run create-super-admin -- --email=admin@example.com --password=yourpassword
 * 
 * IMPORTANT: Run this script ONCE after deploying the database migration.
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function createSuperAdmin() {
  console.log('='.repeat(60));
  console.log('TalkFriendly Super Admin Bootstrap');
  console.log('='.repeat(60));
  console.log();

  // Get Supabase credentials from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Missing Supabase credentials');
    console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('✓ Connected to Supabase');
  console.log();

  // Parse command line arguments
  const args = process.argv.slice(2);
  const emailArg = args.find((arg) => arg.startsWith('--email='));
  const passwordArg = args.find((arg) => arg.startsWith('--password='));
  const usernameArg = args.find((arg) => arg.startsWith('--username='));
  const nameArg = args.find((arg) => arg.startsWith('--name='));

  // Get user input
  const email = emailArg ? emailArg.split('=')[1] : await question('Super Admin Email: ');
  const password = passwordArg ? passwordArg.split('=')[1] : await question('Password (min 8 chars): ');
  const username = usernameArg ? usernameArg.split('=')[1] : await question('Username: ');
  const fullName = nameArg ? nameArg.split('=')[1] : await question('Full Name: ');

  console.log();

  // Validate inputs
  if (!email || !password || !username || !fullName) {
    console.error('❌ Error: All fields are required');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('❌ Error: Password must be at least 8 characters');
    process.exit(1);
  }

  console.log('Creating super admin account...');
  console.log();

  try {
    // Step 1: Create auth user
    console.log('1/5 Creating authentication user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
        username,
      },
    });

    if (authError) {
      console.error('❌ Error creating auth user:', authError.message);
      process.exit(1);
    }

    const userId = authData.user.id;
    console.log(`   ✓ Auth user created (ID: ${userId})`);

    // Step 2: Create profile
    console.log('2/5 Creating profile...');
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        username,
        full_name: fullName,
        account_type: 'admin',
        is_verified: true,
      });

    if (profileError) {
      console.error('❌ Error creating profile:', profileError.message);
      // Try to delete the auth user
      await supabase.auth.admin.deleteUser(userId);
      process.exit(1);
    }

    console.log('   ✓ Profile created');

    // Step 3: Get or create super_admin role
    console.log('3/5 Setting up super admin role...');
    let { data: role, error: roleError } = await supabase
      .from('admin_roles')
      .select('id')
      .eq('name', 'super_admin')
      .single();

    if (roleError || !role) {
      // Create super_admin role
      const { data: newRole, error: createRoleError } = await supabase
        .from('admin_roles')
        .insert({
          name: 'super_admin',
          display_name: 'Super Administrator',
          description: 'Full system access with all permissions',
          is_system_role: true,
        })
        .select()
        .single();

      if (createRoleError) {
        console.error('❌ Error creating super_admin role:', createRoleError.message);
        await supabase.auth.admin.deleteUser(userId);
        process.exit(1);
      }

      role = newRole;
    }

    console.log(`   ✓ Super admin role ready (ID: ${role!.id})`);

    // Step 4: Create admin user record
    console.log('4/5 Creating admin user record...');
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .insert({
        user_id: userId,
        role_id: role!.id,
        email,
        username,
        full_name: fullName,
        is_active: true,
      })
      .select()
      .single();

    if (adminError) {
      console.error('❌ Error creating admin user:', adminError.message);
      await supabase.auth.admin.deleteUser(userId);
      process.exit(1);
    }

    console.log(`   ✓ Admin user created (ID: ${adminUser.id})`);

    // Step 5: Log activity
    console.log('5/5 Logging activity...');
    await supabase.from('admin_activity_log').insert({
      admin_id: adminUser.id,
      action: 'super_admin_created',
      resource_type: 'admin_user',
      resource_id: adminUser.id,
      details: { created_by: 'bootstrap_script' },
    });

    console.log('   ✓ Activity logged');
    console.log();
    console.log('='.repeat(60));
    console.log('✅ Super Admin Account Created Successfully!');
    console.log('='.repeat(60));
    console.log();
    console.log(`Email:    ${email}`);
    console.log(`Username: ${username}`);
    console.log(`Name:     ${fullName}`);
    console.log(`User ID:  ${userId}`);
    console.log();
    console.log('You can now log in to the admin panel at:');
    console.log('  /admin/login');
    console.log();
    console.log('⚠️  IMPORTANT: Keep your credentials secure!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the script
createSuperAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
