"use client";

/**
 * Terms of Service - Complete legal terms for using TalkFriendly
 */

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { ROUTES, SUPPORT_EMAIL, PREMIUM_PRICE_MONTHLY } from "@/constants";

export function TermsOfServiceView() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href={ROUTES.HOME} 
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-text transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold text-text mb-4">Terms of Service</h1>
            <p className="text-muted">Last updated: September 19, 2026</p>
          </motion.div>
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="prose prose-lg max-w-none"
        >
          <div className="bg-white rounded-2xl border border-border p-8 mb-6">
            <p className="text-muted leading-relaxed mb-4">
              Welcome to TalkFriendly. These Terms of Service ("Terms") explain the rules for using the TalkFriendly app, website and related services ("TalkFriendly", "we", "us" or "our").
            </p>
            <p className="text-muted leading-relaxed mb-0">
              TalkFriendly is available to users around the world. By creating an account or using TalkFriendly, you agree to these Terms. If you do not agree with these Terms, please do not use the service.
            </p>
          </div>

          {/* Section 1 */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">1. About TalkFriendly</h2>
            <p className="text-muted leading-relaxed mb-4">
              TalkFriendly is a mental wellness and conversational support app designed to help you reflect, talk through your thoughts and support your general wellbeing.
            </p>
            <p className="text-muted leading-relaxed mb-4">
              <strong className="text-text">TalkFriendly is not a medical or healthcare service</strong> and does not provide medical diagnosis, treatment or emergency care.
            </p>
            <p className="text-muted leading-relaxed">
              AI conversations are designed to provide supportive and informational responses. They should not be relied upon as a substitute for a qualified healthcare professional, therapist, counsellor or other appropriate professional support.
            </p>
          </div>

          {/* Section 2 */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">2. Who Can Use TalkFriendly</h2>
            <p className="text-muted leading-relaxed mb-4">
              <strong className="text-text">TalkFriendly is intended for adults aged 18 and over.</strong>
            </p>
            <p className="text-muted leading-relaxed mb-4">
              By using TalkFriendly, users confirm that:
            </p>
            <ul className="text-muted leading-relaxed space-y-2">
              <li>They are at least 18 years old</li>
              <li>They are legally able to enter into these Terms in their country or region</li>
              <li>The information they provide is accurate and up to date</li>
              <li>They will use TalkFriendly in accordance with applicable laws</li>
            </ul>
            <p className="text-muted leading-relaxed mt-4">
              <strong className="text-text">TalkFriendly is not intended for children or anyone under 18.</strong> We do not knowingly collect information from minors.
            </p>
          </div>

          {/* Section 3 */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">3. International Users</h2>
            <p className="text-muted leading-relaxed">
              TalkFriendly is provided as a global service. You agree to comply with all applicable laws and regulations in your jurisdiction when accessing or using TalkFriendly. We make no representation that TalkFriendly is appropriate or available for use in all locations.
            </p>
          </div>

          {/* Section 4 */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">4. AI Conversations</h2>
            <p className="text-muted leading-relaxed mb-4">
              Currently, TalkFriendly's conversational features do not utilize external AI providers. Any future integration will be disclosed and reflected in updates to these Terms and our Privacy Policy.
            </p>
            <p className="text-muted leading-relaxed mb-4">
              AI-generated responses may sometimes be inaccurate, incomplete, inappropriate or unsuitable for individual circumstances. Users should use their own judgement when deciding whether to act on information or suggestions provided by TalkFriendly.
            </p>
            <p className="text-muted leading-relaxed">
              TalkFriendly does not guarantee that AI-generated responses will always be accurate, appropriate or suitable for particular needs.
            </p>
          </div>

          {/* Section 5 */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">5. Human Review</h2>
            <p className="text-muted leading-relaxed mb-4">
              To maintain safety and service quality, authorized TalkFriendly team members may review content in limited circumstances:
            </p>
            <ul className="text-muted leading-relaxed space-y-2">
              <li><strong className="text-text">Safety concerns:</strong> When automated systems or user reports indicate potential violations of our Community Guidelines or content suggesting imminent harm</li>
              <li><strong className="text-text">Support requests:</strong> When you contact support and grant access for troubleshooting</li>
              <li><strong className="text-text">Service improvement:</strong> Anonymized review of conversation samples with all personal information removed</li>
            </ul>
            <p className="text-muted leading-relaxed mt-4">
              Private journal entries are not subject to routine review unless required by law or safety concerns.
            </p>
          </div>

          {/* Section 6 */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">6. Not an Emergency or Crisis Service</h2>
            <p className="text-muted leading-relaxed mb-4">
              <strong className="text-text">TalkFriendly is not an emergency, crisis-response or suicide-prevention service.</strong>
            </p>
            <p className="text-muted leading-relaxed mb-4">
              If you are experiencing an emergency, believe there is immediate danger, or require urgent assistance, please contact your local emergency services or an appropriate crisis support service in your country.
            </p>
            <p className="text-muted leading-relaxed">
              Do not rely on TalkFriendly to provide immediate emergency assistance or respond to a crisis situation.
            </p>
          </div>

          {/* Section 7 */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">7. Your Content</h2>
            <p className="text-muted leading-relaxed mb-4">
              You retain all rights to content you create or share on TalkFriendly, including journal entries, messages, and other user-generated content.
            </p>
            <p className="text-muted leading-relaxed mb-4">
              By submitting content, you grant TalkFriendly a limited, non-exclusive license to store, process, and use that content to:
            </p>
            <ul className="text-muted leading-relaxed space-y-2">
              <li>Provide, maintain, and improve the service</li>
              <li>Ensure safety and security of the platform</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p className="text-muted leading-relaxed mt-4">
              You are responsible for content you choose to share. You must not post content that:
            </p>
            <ul className="text-muted leading-relaxed space-y-2">
              <li>Violates our <Link href={ROUTES.COMMUNITY_GUIDELINES} className="text-primary hover:underline">Community Guidelines</Link></li>
              <li>Infringes on intellectual property or other rights of others</li>
              <li>Contains malicious code, spam, or is misleading</li>
              <li>Violates applicable laws or regulations</li>
            </ul>
          </div>

          {/* Section 8 */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">8. Community Guidelines</h2>
            <p className="text-muted leading-relaxed mb-4">
              All users must follow our <Link href={ROUTES.COMMUNITY_GUIDELINES} className="text-primary hover:underline">Community Guidelines</Link>. Violations may result in content removal, account restrictions, or account termination.
            </p>
            <p className="text-muted leading-relaxed">
              We reserve the right to remove content or suspend accounts that violate these Terms or our Community Guidelines, at our sole discretion.
            </p>
          </div>

          {/* Section 9 */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">9. Your Account</h2>
            <p className="text-muted leading-relaxed mb-4">
              You are responsible for:
            </p>
            <ul className="text-muted leading-relaxed space-y-2">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized access</li>
            </ul>
            <p className="text-muted leading-relaxed mt-4">
              Do not share your account with others. We may suspend or terminate accounts that appear to be shared or used in violation of these Terms.
            </p>
          </div>

          {/* Section 10 */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">10. Availability and Changes</h2>
            <p className="text-muted leading-relaxed mb-4">
              We aim to provide a reliable service, but we cannot guarantee that TalkFriendly will always be available, uninterrupted, or error-free. We may:
            </p>
            <ul className="text-muted leading-relaxed space-y-2">
              <li>Suspend or discontinue features or the entire service</li>
              <li>Modify, update, or change functionality</li>
              <li>Perform maintenance that temporarily affects availability</li>
            </ul>
            <p className="text-muted leading-relaxed mt-4">
              Where possible, we will provide advance notice of significant changes or service interruptions.
            </p>
          </div>

          {/* Section 11 */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">11. Intellectual Property</h2>
            <p className="text-muted leading-relaxed mb-4">
              TalkFriendly and its content (excluding user-generated content) are owned by or licensed to TalkFriendly and are protected by intellectual property laws.
            </p>
            <p className="text-muted leading-relaxed">
              You may not copy, modify, distribute, sell, or lease any part of TalkFriendly or its content without our express written permission.
            </p>
          </div>

          {/* Section 12 */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">12. Third-Party Services</h2>
            <p className="text-muted leading-relaxed mb-4">
              TalkFriendly relies on third-party service providers for:
            </p>
            <ul className="text-muted leading-relaxed space-y-2">
              <li><strong className="text-text">Hosting and database:</strong> Supabase</li>
              <li><strong className="text-text">Infrastructure:</strong> Various cloud services</li>
              <li><strong className="text-text">Analytics:</strong> Usage analytics services</li>
            </ul>
            <p className="text-muted leading-relaxed mt-4">
              These services are subject to their own terms. We are not responsible for third-party service interruptions or changes.
            </p>
          </div>

          {/* Section 13 */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">13. Privacy</h2>
            <p className="text-muted leading-relaxed">
              Your privacy is important to us. Please review our <Link href={ROUTES.PRIVACY} className="text-primary hover:underline">Privacy Policy</Link> to understand how we collect, use, and protect your personal information.
            </p>
          </div>

          {/* Section 14 */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">14. Payments and Subscriptions</h2>
            <p className="text-muted leading-relaxed mb-4">
              TalkFriendly offers both free and paid subscription plans:
            </p>
            <ul className="text-muted leading-relaxed space-y-2">
              <li><strong className="text-text">Free Plan:</strong> Includes basic features with limited listener sessions (2 per month)</li>
              <li><strong className="text-text">Plus Plan:</strong> Monthly subscription with enhanced features</li>
              <li><strong className="text-text">Premium Plan:</strong> ${PREMIUM_PRICE_MONTHLY}/month with unlimited listener sessions and premium features</li>
            </ul>
            <p className="text-muted leading-relaxed mt-4">
              <strong className="text-text">Billing and Renewal:</strong>
            </p>
            <ul className="text-muted leading-relaxed space-y-2">
              <li>Subscriptions automatically renew at the end of each billing period</li>
              <li>You will be charged the then-current rate unless you cancel before renewal</li>
              <li>Prices may change with reasonable notice</li>
              <li>All fees are in USD unless otherwise stated</li>
              <li>Applicable taxes may be added to your subscription cost</li>
            </ul>
            <p className="text-muted leading-relaxed mt-4">
              <strong className="text-text">Cancellation:</strong> You may cancel your subscription at any time from your account settings. Cancellation takes effect at the end of your current billing period. No refunds for partial billing periods.
            </p>
            <p className="text-muted leading-relaxed mt-4">
              <strong className="text-text">Payment Processing:</strong> Payments are processed by third-party payment providers. You agree to their terms when making payments.
            </p>
          </div>

          {/* Section 15 */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">15. Ending Your Account</h2>
            <p className="text-muted leading-relaxed mb-4">
              <strong className="text-text">You may delete your account at any time</strong> from your account settings.
            </p>
            <p className="text-muted leading-relaxed mb-4">
              When you delete your account:
            </p>
            <ul className="text-muted leading-relaxed space-y-2">
              <li>Your profile, journal entries, and personal content will be deleted</li>
              <li>Active subscriptions will be cancelled (no refunds for remaining time)</li>
              <li>Some information may be retained as required by law or legitimate business needs</li>
              <li>Anonymized data may be retained for analytics and service improvement</li>
            </ul>
            <p className="text-muted leading-relaxed mt-4">
              We may suspend or terminate your account if you violate these Terms, our Community Guidelines, or engage in harmful behavior.
            </p>
          </div>

          {/* Section 16 */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">16. Disclaimer</h2>
            <p className="text-muted leading-relaxed mb-4">
              To the maximum extent permitted by law:
            </p>
            <p className="text-muted leading-relaxed mb-4">
              TalkFriendly is provided "as is" and "as available" without warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.
            </p>
            <p className="text-muted leading-relaxed">
              We do not guarantee that TalkFriendly will be uninterrupted, secure, or error-free, or that AI responses will always be accurate or appropriate. You use TalkFriendly at your own risk.
            </p>
          </div>

          {/* Section 17 */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">17. Limitation of Liability</h2>
            <p className="text-muted leading-relaxed mb-4">
              To the maximum extent permitted by law, TalkFriendly and its affiliates, officers, employees, and service providers will not be liable for:
            </p>
            <ul className="text-muted leading-relaxed space-y-2">
              <li>Indirect, incidental, special, consequential, or punitive damages</li>
              <li>Loss of profits, data, use, or other intangible losses</li>
              <li>Damages arising from your use or inability to use the service</li>
              <li>Reliance on any content, advice, or information obtained through TalkFriendly</li>
            </ul>
            <p className="text-muted leading-relaxed mt-4">
              Our total liability to you for all claims arising from your use of TalkFriendly shall not exceed the amount you paid to us in the 12 months before the claim arose.
            </p>
            <p className="text-muted leading-relaxed mt-4">
              Nothing in these Terms excludes or limits liability that cannot be excluded or limited under applicable law, including liability for death or personal injury caused by negligence or fraud.
            </p>
          </div>

          {/* Section 18 */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">18. Changes to These Terms</h2>
            <p className="text-muted leading-relaxed mb-4">
              We may update these Terms from time to time. If we make significant changes, we will notify you through the app or by email.
            </p>
            <p className="text-muted leading-relaxed">
              Your continued use of TalkFriendly after changes take effect constitutes acceptance of the revised Terms. If you do not agree to the changes, you should stop using TalkFriendly and delete your account.
            </p>
          </div>

          {/* Section 19 */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">19. Applicable Law and Disputes</h2>
            <p className="text-muted leading-relaxed mb-4">
              These Terms are governed by and construed in accordance with applicable international commercial laws.
            </p>
            <p className="text-muted leading-relaxed">
              Nothing in these Terms affects your mandatory consumer rights under applicable law in your jurisdiction.
            </p>
          </div>

          {/* Section 20 - Contact */}
          <div className="bg-primary-50 border border-primary-100 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">20. Contact Us</h2>
            <p className="text-muted leading-relaxed mb-4">
              If you have questions about these Terms or need to contact us regarding your account:
            </p>
            <p className="text-muted leading-relaxed">
              <strong className="text-text">Email:</strong> <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">{SUPPORT_EMAIL}</a>
            </p>
          </div>

          <div className="text-center mt-8">
            <Link href={ROUTES.PRIVACY} className="text-primary hover:underline">
              View Privacy Policy →
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
