#!/usr/bin/env node

/**
 * Headless Admin Bootstrap Script
 * Cybersecurity Challenge Portal
 *
 * Usage:
 *   node scripts/bootstrap-admin.mjs [--force]
 *
 * Environment variables (loaded from .env.local or process environment):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   ADMIN_BOOTSTRAP_EMAIL
 *   ADMIN_BOOTSTRAP_PASSWORD
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// Simple .env parser to read .env.local if not already in process.env
function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnvLocal();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('\n❌ Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in environment.');
  console.error('Please configure them in your local .env.local file.\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function getArg(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && idx + 1 < process.argv.length) {
    return process.argv[idx + 1];
  }
  return null;
}

async function bootstrap() {
  console.log('\n🔒 Starting Cybersecurity Challenge Portal Admin Bootstrap...\n');

  let email = getArg('--email') || process.env.ADMIN_BOOTSTRAP_EMAIL;
  let password = getArg('--password') || process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const displayName = getArg('--name') || 'SuperAdmin';
  const isForce = process.argv.includes('--force');

  if (!email) {
    email = await prompt('Enter Admin Email Address: ');
  }
  if (!password) {
    password = await prompt('Enter Admin Initial Password (min 8 characters): ');
  }

  if (!email || !password || password.length < 8) {
    console.error('\n❌ Invalid email or password. Password must be at least 8 characters.\n');
    process.exit(1);
  }

  // 1. Check if user already exists in auth.users
  const { data: userListData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('❌ Failed to query users via Supabase Admin API:', listError.message);
    process.exit(1);
  }

  const existingUser = userListData?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  let userId;

  if (existingUser) {
    console.log(`ℹ️ User with email "${email}" already exists (ID: ${existingUser.id}).`);
    if (!isForce) {
      const confirm = await prompt('Elevate this existing user to active admin? (y/N): ');
      if (confirm.toLowerCase() !== 'y') {
        console.log('Bootstrap cancelled.');
        process.exit(0);
      }
    }

    userId = existingUser.id;

    // Ensure email is confirmed and password updated if requested
    const { error: updateAuthError } = await supabase.auth.admin.updateUserById(userId, {
      email_confirm: true,
      password: password,
    });
    if (updateAuthError) {
      console.error('❌ Failed to update auth user credentials:', updateAuthError.message);
      process.exit(1);
    }
  } else {
    console.log(`Creating new confirmed admin user for "${email}"...`);
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
      },
    });

    if (createError) {
      console.error('❌ Failed to create admin user:', createError.message);
      process.exit(1);
    }

    userId = createData.user.id;
    console.log(`✓ Auth user created successfully (ID: ${userId}).`);
  }

  // 2. Ensure profile exists and has role='admin' and is_active=true
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, role, is_active')
    .eq('id', userId)
    .maybeSingle();

  if (!existingProfile) {
    console.log('ℹ️ Profiles row missing. Creating new admin profile row...');
    const username = `admin_${userId.slice(0, 6)}`;
    const { error: insertProfileError } = await supabase.from('profiles').insert({
      id: userId,
      email: email.toLowerCase(),
      username: username,
      display_name: displayName,
      role: 'admin',
      is_active: true,
    });

    if (insertProfileError) {
      console.error('❌ Failed to insert profile row:', insertProfileError.message);
      process.exit(1);
    }
  } else {
    console.log('Promoting profile to active admin...');
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({
        role: 'admin',
        is_active: true,
      })
      .eq('id', userId);

    if (updateProfileError) {
      console.error('❌ Failed to promote profile row:', updateProfileError.message);
      process.exit(1);
    }
  }

  console.log('\n======================================================');
  console.log('✅ Admin Bootstrap Complete!');
  console.log(`   Admin Email: ${email}`);
  console.log(`   Role:        admin`);
  console.log(`   Status:      active`);
  console.log('======================================================\n');
}

bootstrap().catch((err) => {
  console.error('\n❌ Unexpected error during bootstrap:', err);
  process.exit(1);
});
