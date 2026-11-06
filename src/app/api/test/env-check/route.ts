/**
 * Environment Variables Check
 * GET /api/test/env-check
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const envVars = {
    hasProjectId: !!process.env.GOOGLE_CLOUD_PROJECT_ID,
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID?.substring(0, 10) + '...',
    
    hasEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    
    hasPrivateKey: !!process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
    privateKeyStart: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.substring(0, 30) + '...',
    
    hasWebhookSecret: !!process.env.GOOGLE_MEET_WEBHOOK_SECRET,
    
    // Check if they're still the placeholder values
    isProjectIdPlaceholder: process.env.GOOGLE_CLOUD_PROJECT_ID === 'REPLACE_WITH_YOUR_PROJECT_ID',
    isEmailPlaceholder: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL === 'REPLACE_WITH_YOUR_SERVICE_ACCOUNT_EMAIL',
    isPrivateKeyPlaceholder: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY === '"REPLACE_WITH_YOUR_PRIVATE_KEY_FROM_JSON_FILE"',
  };

  const allConfigured = 
    envVars.hasProjectId && 
    envVars.hasEmail && 
    envVars.hasPrivateKey && 
    !envVars.isProjectIdPlaceholder &&
    !envVars.isEmailPlaceholder &&
    !envVars.isPrivateKeyPlaceholder;

  return NextResponse.json({
    configured: allConfigured,
    details: envVars,
    message: allConfigured 
      ? '✅ Google Meet credentials are configured!'
      : '❌ Google Meet credentials need to be set. Replace REPLACE_WITH_YOUR_* values in .env.local',
    nextSteps: allConfigured
      ? ['Restart your dev server', 'Test with: http://localhost:3000/api/test/meeting-link']
      : [
          '1. Download JSON key from Google Cloud Console',
          '2. Open your .env.local file',
          '3. Replace REPLACE_WITH_YOUR_* values with actual credentials from JSON',
          '4. Save the file',
          '5. Restart your dev server (Ctrl+C then npm run dev)',
        ]
  });
}
