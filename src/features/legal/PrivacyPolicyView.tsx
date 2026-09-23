"use client";

/**
 * Privacy Policy - Comprehensive privacy information
 */

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { ROUTES, SUPPORT_EMAIL } from "@/constants";

export function PrivacyPolicyView() {
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
            <h1 className="text-4xl font-bold text-text mb-4">Privacy Policy</h1>
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
            <p className="text-lg text-muted leading-relaxed mb-0">
              <strong className="text-text">Your privacy matters to us.</strong> TalkFriendly is designed to give you a private, supportive space to reflect, talk and look after your mental wellbeing. We aim to collect only the information we need to provide and improve the service.
            </p>
          </div>

          {/* Section 1 */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">1. Information We Collect</h2>
            <p className="text-muted leading-relaxed mb-4">
              Depending on how you use TalkFriendly, we may collect information such as:
            </p>
            <ul className="text-muted leading-relaxed space-y-2">
              <li><strong className="text-text">Account information</strong> — Your name, email address, username, profession, and date of birth (to verify you are 18 or older)</li>
              <li><strong className="text-text">Conversations and content</strong> — Journal entries, mood check-ins, AI conversations, messages in communities, and other content you choose to share within the app</li>
              <li><strong className="text-text">Usage information</strong> — Information about how you interact with the app, including features used, pages visited, and actions taken</li>
              <li><strong className="text-text">Device information</strong> — Device type, operating system, browser type, IP address, and unique identifiers needed to operate and improve the service</li>
              <li><strong className="text-text">Support communications</strong> — Information you provide when contacting our support team</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">2. Your Conversations and Personal Content</h2>
            <p className="text-muted leading-relaxed mb-4">
              Your conversations, journal entries, and other content you create in TalkFriendly may contain sensitive or personal information. We treat this information with care and use it only as described in this Privacy Policy.
            </p>
            <p className="text-muted leading-relaxed">
              <strong className="text-text">AI Conversations:</strong> Currently, TalkFriendly does not utilize external AI providers for conversation functionality. Any future integration with AI services will be clearly disclosed, and we will update this policy accordingly. Conversation data is stored securely in our database and is not used to train external AI models.
            </p>
          </div>

          {/* Section 3 */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">3. How We Use Your Information</h2>
            <p className="text-muted leading-relaxed mb-4">
              We may use your information to:
            </p>
            <ul className="text-muted leading-relaxed space-y-2">
              <li>Provide and personalise TalkFriendly services</li>
              <li>Save your conversations, journal entries, mood logs, and preferences</li>
              <li>Improve the safety, reliability, and performance of the app</li>
              <li>Respond to support requests and provide customer service</li>
              <li>Detect and prevent misuse, fraud, or security threats</li>
              <li>Analyze aggregated, anonymized usage patterns to improve our services</li>
              <li>Comply with legal obligations and protect the rights and safety of users</li>
            </ul>
            <p className="text-muted leading-relaxed mt-4">
              <strong className="text-text">Data Retention:</strong> We retain your personal information for as long as your account is active or as needed to provide you services. You may request deletion of your data at any time from your account settings. Some information may be retained for longer periods as required by law or for legitimate business purposes (such as preventing abuse or resolving disputes).
            </p>
          </div>

          {/* Section 4 */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">4. Sharing Your Information</h2>
            <p className="text-muted leading-relaxed mb-4">
              <strong className="text-text">We do not sell your personal information.</strong>
            </p>
            <p className="text-muted leading-relaxed mb-4">
              We may share limited information with trusted service providers who help us operate TalkFriendly, such as:
            </p>
            <ul className="text-muted leading-relaxed space-y-2">
              <li><strong className="text-text">Hosting and infrastructure</strong> — Supabase provides our database and authentication services</li>
              <li><strong className="text-text">Analytics</strong> — Aggregated, anonymized usage data to understand how people use TalkFriendly</li>
              <li><strong className="text-text">Security services</strong> — Providers that help detect and prevent fraud or abuse</li>
              <li><strong className="text-text">Customer support</strong> — Tools that help us respond to your questions and requests</li>
            </ul>
            <p className="text-muted leading-relaxed mt-4">
              These providers are only permitted to use information as necessary to provide their services to us and are contractually required to protect your information.
            </p>
            <p className="text-muted leading-relaxed mt-4">
              We may also disclose information where required by law, legal process, or where necessary to protect the safety, rights, or security of our users, our service, or others.
            </p>
          </div>

          {/* Section 5 */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">5. Human Review and Safety</h2>
            <p className="text-muted leading-relaxed mb-4">
              To maintain a safe and supportive community, authorized TalkFriendly team members may review content in the following circumstances:
            </p>
            <ul className="text-muted leading-relaxed space-y-2">
              <li><strong className="text-text">Safety concerns</strong> — When automated systems detect potential violations of our Community Guidelines, content that may indicate imminent harm, or content reported by other users</li>
              <li><strong className="text-text">Support requests</strong> — When you contact support and grant permission to view your account for troubleshooting</li>
              <li><strong className="text-text">Quality improvement</strong> — Occasionally, anonymized samples of conversations may be reviewed to improve our services, with all personally identifiable information removed</li>
            </ul>
            <p className="text-muted leading-relaxed mt-4">
              Private journal entries and AI conversations are not subject to routine human review unless you report an issue or we have a legal obligation to review content.
            </p>
          </div>

          {/* Section 6 */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">6. Your Choices and Rights</h2>
            <p className="text-muted leading-relaxed mb-4">
              Depending on where you live, you may have rights over your personal information, including:
            </p>
            <ul className="text-muted leading-relaxed space-y-2">
              <li><strong className="text-text">Access</strong> — Request a copy of the personal information we hold about you</li>
              <li><strong className="text-text">Correction</strong> — Update or correct inaccurate information from your account settings</li>
              <li><strong className="text-text">Deletion</strong> — Request deletion of your account and personal information</li>
              <li><strong className="text-text">Export</strong> — Download your data in a portable format from your account settings</li>
              <li><strong className="text-text">Objection</strong> — Object to certain types of processing of your information</li>
            </ul>
            <p className="text-muted leading-relaxed mt-4">
              To exercise these rights, please contact us at <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">{SUPPORT_EMAIL}</a> or use the data export and account deletion features in your account settings.
            </p>
          </div>

          {/* Section 7 */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">7. Keeping Your Information Secure</h2>
            <p className="text-muted leading-relaxed mb-4">
              We use appropriate technical and organizational measures designed to protect your information from unauthorized access, loss, misuse, or disclosure, including:
            </p>
            <ul className="text-muted leading-relaxed space-y-2">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication and access controls</li>
              <li>Regular security assessments and monitoring</li>
              <li>Employee training on data privacy and security</li>
            </ul>
            <p className="text-muted leading-relaxed mt-4">
              However, no online service can guarantee complete security. Please keep your account credentials secure and notify us immediately if you suspect unauthorized access to your account.
            </p>
          </div>

          {/* Section 8 */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">8. Children's Privacy</h2>
            <p className="text-muted leading-relaxed mb-4">
              <strong className="text-text">TalkFriendly is intended for adults and must not be used by anyone under the age of 18.</strong>
            </p>
            <p className="text-muted leading-relaxed">
              We do not knowingly collect or process personal information from children. During registration, users are required to confirm they are at least 18 years old and provide their date of birth. If we become aware that a person under 18 has provided personal information or created an account, we will take appropriate steps to delete that information and close the account. If you believe a child has used TalkFriendly, please contact us immediately.
            </p>
          </div>

          {/* Section 9 */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">9. International Users</h2>
            <p className="text-muted leading-relaxed">
              TalkFriendly may be accessed by people in different countries. Where information is transferred internationally, we take appropriate steps to protect it in accordance with applicable privacy laws and this Privacy Policy. Our hosting infrastructure is provided by Supabase, which maintains secure data centers with appropriate safeguards.
            </p>
          </div>

          {/* Section 10 */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">10. Cookies and Tracking</h2>
            <p className="text-muted leading-relaxed mb-4">
              TalkFriendly uses essential cookies and similar technologies to:
            </p>
            <ul className="text-muted leading-relaxed space-y-2">
              <li><strong className="text-text">Authentication</strong> — Keep you logged in and maintain your session</li>
              <li><strong className="text-text">Preferences</strong> — Remember your settings and preferences</li>
              <li><strong className="text-text">Security</strong> — Protect against fraud and abuse</li>
            </ul>
            <p className="text-muted leading-relaxed mt-4">
              We do not currently use non-essential tracking cookies or third-party advertising cookies. For more information, please see our <Link href={ROUTES.COOKIES} className="text-primary hover:underline">Cookie Policy</Link>.
            </p>
          </div>

          {/* Section 11 */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">11. Changes to This Policy</h2>
            <p className="text-muted leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes in our practices, services, or legal requirements. If we make significant changes, we will notify you through the app or by email. We encourage you to review this policy periodically. Your continued use of TalkFriendly after changes become effective constitutes acceptance of the revised policy.
            </p>
          </div>

          {/* Section 12 - Contact */}
          <div className="bg-primary-50 border border-primary-100 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">12. Contact Us</h2>
            <p className="text-muted leading-relaxed mb-4">
              If you have questions about this Privacy Policy or how we handle your personal information, please contact us:
            </p>
            <p className="text-muted leading-relaxed mb-2">
              <strong className="text-text">Email:</strong> <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">{SUPPORT_EMAIL}</a>
            </p>
            <p className="text-muted leading-relaxed">
              We will respond to your inquiry as promptly as possible, typically within 48 hours.
            </p>
          </div>

          <div className="text-center mt-8">
            <Link href={ROUTES.TERMS} className="text-primary hover:underline">
              View Terms of Service →
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
