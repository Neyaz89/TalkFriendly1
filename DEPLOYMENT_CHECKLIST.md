# TalkFriendly Production Deployment Checklist

**Status:** Ready for deployment with noted requirements  
**Date:** September 19, 2026

---

## 🎯 Pre-Deployment Requirements

### 1. Database Setup

**Required Actions:**

```bash
# 1. Apply the subscription and age fields migration to Supabase
# Go to Supabase Dashboard → SQL Editor → New Query
# Copy and paste: migrations/003_subscription_and_age_fields.sql
# Click "Run"
```

**Migration includes:**
- ✅ Subscription tier tracking (free, plus, premium)
- ✅ Listener session usage and limits
- ✅ Age confirmation fields
- ✅ Account deletion tracking
- ✅ RLS policies for all tables
- ✅ Server-side functions for session limit enforcement

**Verification:**
- [ ] Check tables exist: `listener_bookings`
- [ ] Verify new columns in `profiles`: `subscription_tier`, `listener_sessions_used`, `age_confirmed`, `date_of_birth`
- [ ] Test RLS policies by querying as different users

### 2. Supabase Authentication Configuration

**In Supabase Dashboard → Authentication → Providers:**

- [ ] Enable Email provider
- [ ] Enable "Confirm email" toggle
- [ ] Configure email templates (optional but recommended)
- [ ] Set redirect URLs to production domain
- [ ] Configure email rate limiting

**Email Configuration:**
- [ ] Set site URL to production URL
- [ ] Configure custom SMTP (optional, for branded emails)
- [ ] Test email delivery

### 3. Environment Variables

**Production Environment (.env.production or Vercel Environment Variables):**

```env
# Supabase (from your Supabase project settings)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App Configuration
NEXT_PUBLIC_APP_NAME=TalkFriendly
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_SUPPORT_EMAIL=support@yourdomain.com

# Subscription Configuration
NEXT_PUBLIC_FREE_LISTENER_SESSIONS_PER_MONTH=2
NEXT_PUBLIC_PREMIUM_PRICE_MONTHLY=29

# Feature Flags
NEXT_PUBLIC_ENABLE_PWA=true
```

**Security Notes:**
- ✅ Only NEXT_PUBLIC_ variables are exposed to client (safe)
- ✅ Never commit service role keys
- ✅ Keep payment provider keys server-side only

### 4. DNS & Domain Configuration

- [ ] Point domain to Vercel
- [ ] Configure SSL certificate (automatic with Vercel)
- [ ] Set up www redirect if needed
- [ ] Configure production URL in Supabase settings

---

## 🚀 Deployment Steps

### Step 1: Vercel Deployment

```bash
# If not already connected to Vercel:
# 1. Install Vercel CLI: npm i -g vercel
# 2. Login: vercel login
# 3. Deploy: vercel --prod

# Or use Vercel Dashboard:
# 1. Import Git repository
# 2. Configure environment variables
# 3. Deploy
```

### Step 2: Database Migration

```sql
-- Run in Supabase SQL Editor
-- File: migrations/003_subscription_and_age_fields.sql
```

### Step 3: Post-Deployment Verification

**Test These Critical Flows:**

1. **Registration Flow**
   - [ ] Navigate to /auth/register
   - [ ] Fill in all fields including date of birth
   - [ ] Confirm age checkbox works
   - [ ] Verify age validation (try under 18, should fail)
   - [ ] Complete registration
   - [ ] Check email for confirmation link
   - [ ] Click confirmation link
   - [ ] Login successfully

2. **Landing Page**
   - [ ] Verify "Join a growing community" text (not "Trusted by X users")
   - [ ] Check footer has: Features, Pricing, Help Centre, Contact, Community Guidelines, About
   - [ ] Verify footer does NOT have: Blog, Press, Careers, Changelog, Roadmap, Crisis Resources
   - [ ] Test all footer links work

3. **Legal Pages**
   - [ ] Navigate to /privacy - verify Privacy Policy loads
   - [ ] Navigate to /terms - verify Terms of Service loads
   - [ ] Navigate to /cookies - verify Cookie Policy loads
   - [ ] Navigate to /community-guidelines - verify page loads
   - [ ] Navigate to /about - verify About page loads
   - [ ] Navigate to /help - verify Help Centre loads
   - [ ] Navigate to /contact - verify Contact page loads
   - [ ] Verify support email is correct throughout

4. **Daily Check-in**
   - [ ] Login to dashboard
   - [ ] Go to check-in
   - [ ] Verify mood options: "Having a hard day", "Low", "Okay", "Good", "Great"
   - [ ] Complete check-in
   - [ ] Verify data saves correctly

5. **Listener Session Limits (Free User)**
   - [ ] Login as free user
   - [ ] Navigate to /listeners
   - [ ] View listener profile
   - [ ] Attempt to book session
   - [ ] Verify limit enforcement (should allow 2/month)
   - [ ] Try to book 3rd session (should show upgrade prompt)

6. **Account Deletion**
   - [ ] Login to test account
   - [ ] Go to Settings
   - [ ] Click "Delete Account"
   - [ ] Confirm deletion
   - [ ] Verify account is deleted
   - [ ] Verify cannot login with deleted account

---

## ⚠️ Known Limitations & Future Work

### Payment Provider Integration

**Status:** NOT IMPLEMENTED

**Current State:**
- Pricing page shows $29/month Premium
- Session limits are enforced
- No actual payment processing

**To Complete:**
1. Choose payment provider (Stripe recommended)
2. Integrate checkout flow
3. Set up webhook handlers
4. Update subscription_tier based on payments
5. Handle subscription lifecycle (cancel, renew, etc.)

**Files to Create:**
- `src/app/api/stripe/webhook/route.ts` (or razorpay equivalent)
- `src/app/api/subscription/checkout/route.ts`
- `src/services/payment.service.ts`

### Rate Limiting

**Status:** NOT IMPLEMENTED

**Recommended:** Add rate limiting to:
- Login attempts (prevent brute force)
- API endpoints (prevent abuse)
- Contact form (prevent spam)

**Suggested Tools:**
- Upstash Redis with Vercel Edge Config
- `@upstash/ratelimit` package

### Content Moderation

**Status:** BASIC FRAMEWORK ONLY

**Implemented:**
- Community Guidelines documented
- Human review policy in Privacy Policy
- User reporting mechanism described

**Not Implemented:**
- Automated content filtering
- Report handling workflow
- Admin moderation dashboard

---

## 📊 Testing Checklist

### Manual Testing

**Authentication:**
- [ ] Register new account (18+)
- [ ] Register fails for under 18
- [ ] Email confirmation required
- [ ] Login works
- [ ] Logout works
- [ ] Session persists across page reloads

**Legal Pages:**
- [ ] All legal pages load correctly
- [ ] No placeholder text visible
- [ ] Support email is correct
- [ ] Links between legal pages work

**Check-in:**
- [ ] Mood options show correct labels
- [ ] Check-in saves correctly
- [ ] Data appears in dashboard

**Session Limits:**
- [ ] Free user limited to 2 sessions/month
- [ ] Limit enforced server-side
- [ ] Cannot bypass by refreshing
- [ ] Error message shows when limit reached

**Account Deletion:**
- [ ] Deletion flow works
- [ ] Data is actually removed
- [ ] User is logged out
- [ ] Cannot login after deletion

### Automated Testing (Run Locally)

Due to PowerShell execution policy restrictions, these must be run manually:

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build
npm run build
```

**Expected Results:**
- Type checking should pass (or show only minor issues)
- Linting should pass
- Build should complete successfully

---

## 🔐 Security Pre-Flight

**Before Production:**

- [ ] Run `npm audit` and fix high/critical vulnerabilities
- [ ] Verify no secrets in client bundle
- [ ] Check RLS policies are enabled on all tables
- [ ] Test unauthorized access attempts fail
- [ ] Verify API routes require authentication
- [ ] Test session limit cannot be bypassed
- [ ] Confirm email confirmation is enabled in Supabase
- [ ] Review error messages don't leak sensitive info
- [ ] Test account deletion removes all user data

**Security Documentation:**
- ✅ See `SECURITY_AUDIT.md` for full security review

---

## 📱 Mobile Testing

**Test on actual devices:**
- [ ] iPhone Safari
- [ ] Android Chrome
- [ ] iPad
- [ ] Small phone (320px width)

**Check:**
- [ ] Navigation works
- [ ] Forms are usable
- [ ] Modals don't break
- [ ] Footer readable
- [ ] Legal pages readable
- [ ] Check-in interface works

---

## ♿ Accessibility

**Verify:**
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Form labels present
- [ ] Color contrast sufficient
- [ ] ARIA labels where needed
- [ ] Screen reader friendly

---

## 📈 Monitoring Setup (Recommended)

**After Deployment:**

1. **Error Tracking**
   - Set up Sentry or similar
   - Monitor 4xx/5xx errors
   - Track JavaScript errors

2. **Analytics** (Privacy-respecting)
   - Plausible or Simple Analytics
   - Track page views only
   - No user tracking

3. **Uptime Monitoring**
   - UptimeRobot or similar
   - Monitor critical pages
   - Alert on downtime

4. **Performance Monitoring**
   - Vercel Analytics
   - Core Web Vitals
   - API response times

---

## ✅ Go-Live Checklist

**Final Steps:**

- [ ] All deployment steps completed
- [ ] Database migration applied successfully
- [ ] Environment variables configured
- [ ] Critical user flows tested
- [ ] Legal pages reviewed and accurate
- [ ] Support email configured and tested
- [ ] Mobile responsive verified
- [ ] Security checklist completed
- [ ] Error monitoring active
- [ ] Team trained on support email responses
- [ ] Backup strategy in place

**When Ready:**
1. Deploy to production
2. Test registration flow immediately
3. Monitor error logs for first 24 hours
4. Announce launch

---

## 🆘 Rollback Plan

**If Issues Occur:**

1. **Minor Issues:**
   - Fix and redeploy
   - Vercel makes this instant

2. **Major Issues:**
   - Revert to previous deployment in Vercel dashboard
   - Investigate offline
   - Fix and redeploy when ready

3. **Database Issues:**
   - Supabase has point-in-time recovery
   - Contact Supabase support if needed

---

## 📞 Support Contacts

**Support Email:** ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@talkfriendly.app'}

**Response Time:** Typically 24-48 hours

**For Urgent Issues:**
- Check Vercel logs
- Check Supabase logs
- Check error monitoring dashboard

---

## 📝 Post-Launch Tasks

**Week 1:**
- [ ] Monitor error rates
- [ ] Respond to user feedback
- [ ] Fix any critical bugs
- [ ] Optimize performance bottlenecks

**Month 1:**
- [ ] Implement payment provider
- [ ] Add rate limiting
- [ ] Set up automated backups
- [ ] Review security logs

**Ongoing:**
- [ ] Regular dependency updates
- [ ] Security patch monitoring
- [ ] User feedback incorporation
- [ ] Feature development per roadmap

---

**Deployment Status:** ✅ READY (with noted future work)  
**Last Updated:** September 19, 2026
