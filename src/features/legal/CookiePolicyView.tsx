"use client";

/**
 * Cookie Policy - Information about cookie usage
 */

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { ROUTES, SUPPORT_EMAIL } from "@/constants";

export function CookiePolicyView() {
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
            <h1 className="text-4xl font-bold text-text mb-4">Cookie Policy</h1>
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
            <p className="text-muted leading-relaxed mb-0">
              This Cookie Policy explains how TalkFriendly uses cookies and similar technologies to provide, secure, and improve our service.
            </p>
          </div>

          {/* Section 1 */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">1. What Are Cookies?</h2>
            <p className="text-muted leading-relaxed mb-4">
              Cookies are small text files that are placed on your device (computer, smartphone, or tablet) when you visit a website or use an app. Cookies help the website remember information about your visit, making it easier and more useful for you on subsequent visits.
            </p>
            <p className="text-muted leading-relaxed">
              Similar technologies include local storage, session storage, and other browser storage mechanisms that serve similar purposes.
            </p>
          </div>

          {/* Section 2 */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">2. How TalkFriendly Uses Cookies</h2>
            <p className="text-muted leading-relaxed mb-4">
              TalkFriendly uses cookies and similar technologies for essential functionality. We focus on cookies that are necessary to provide our service.
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-text mb-2">Essential Cookies</h3>
                <p className="text-muted text-sm leading-relaxed mb-2">
                  These cookies are necessary for the website to function and cannot be disabled. They include:
                </p>
                <ul className="text-muted text-sm leading-relaxed space-y-1">
                  <li><strong className="text-text">Authentication cookies:</strong> Keep you logged in and maintain your session</li>
                  <li><strong className="text-text">Security cookies:</strong> Protect against fraud and ensure secure connections</li>
                  <li><strong className="text-text">Preference cookies:</strong> Remember your settings like theme (light/dark mode) and language</li>
                </ul>
                <p className="text-muted text-sm mt-2">
                  <strong className="text-text">Examples:</strong> Supabase authentication tokens, session identifiers, CSRF protection tokens
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-text mb-2">Functional Storage</h3>
                <p className="text-muted text-sm leading-relaxed">
                  We use local storage and session storage to:
                </p>
                <ul className="text-muted text-sm leading-relaxed space-y-1">
                  <li>Cache data for better performance and offline access (PWA functionality)</li>
                  <li>Remember your preferences across sessions</li>
                  <li>Store draft content to prevent data loss</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">3. What We Don't Use</h2>
            <p className="text-muted leading-relaxed mb-4">
              <strong className="text-text">TalkFriendly does not currently use:</strong>
            </p>
            <ul className="text-muted leading-relaxed space-y-2">
              <li><strong className="text-text">Advertising cookies:</strong> We don't show ads or use advertising tracking</li>
              <li><strong className="text-text">Third-party tracking cookies:</strong> We don't allow third-party advertisers or trackers to collect your data</li>
              <li><strong className="text-text">Social media cookies:</strong> We don't use social media plugins that track you across the web</li>
            </ul>
            <p className="text-muted leading-relaxed mt-4">
              We may use basic, privacy-respecting analytics to understand aggregated usage patterns, but this does not involve cross-site tracking or personal identification.
            </p>
          </div>

          {/* Section 4 */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">4. Third-Party Services</h2>
            <p className="text-muted leading-relaxed mb-4">
              Some of our service providers may use cookies:
            </p>
            <ul className="text-muted leading-relaxed space-y-2">
              <li><strong className="text-text">Supabase:</strong> Our authentication and database provider uses cookies to maintain secure sessions</li>
              <li><strong className="text-text">Hosting services:</strong> May use cookies for load balancing and security</li>
            </ul>
            <p className="text-muted leading-relaxed mt-4">
              These cookies are necessary for the service to function and are covered by their respective privacy policies.
            </p>
          </div>

          {/* Section 5 */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">5. Managing Cookies</h2>
            <p className="text-muted leading-relaxed mb-4">
              <strong className="text-text">Browser Controls:</strong>
            </p>
            <p className="text-muted leading-relaxed mb-4">
              Most web browsers allow you to control cookies through their settings. You can:
            </p>
            <ul className="text-muted leading-relaxed space-y-2">
              <li>View what cookies are stored</li>
              <li>Delete existing cookies</li>
              <li>Block all cookies</li>
              <li>Block third-party cookies</li>
              <li>Set your browser to notify you when cookies are set</li>
            </ul>
            <p className="text-muted leading-relaxed mt-4">
              <strong className="text-text">Important:</strong> Because TalkFriendly relies on essential cookies for authentication and core functionality, blocking all cookies will prevent you from using the service properly. You will not be able to log in or maintain your session if essential cookies are blocked.
            </p>
            <p className="text-muted leading-relaxed mt-4">
              For information on managing cookies in specific browsers:
            </p>
            <ul className="text-muted text-sm leading-relaxed space-y-1">
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Chrome</a></li>
              <li><a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Mozilla Firefox</a></li>
              <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Apple Safari</a></li>
              <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Microsoft Edge</a></li>
            </ul>
          </div>

          {/* Section 6 */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">6. Cookie Duration</h2>
            <p className="text-muted leading-relaxed mb-4">
              Cookies can be either session cookies or persistent cookies:
            </p>
            <ul className="text-muted leading-relaxed space-y-2">
              <li><strong className="text-text">Session cookies:</strong> Temporary cookies that are deleted when you close your browser</li>
              <li><strong className="text-text">Persistent cookies:</strong> Remain on your device for a set period or until you delete them. We use persistent cookies to keep you logged in and remember your preferences</li>
            </ul>
            <p className="text-muted leading-relaxed mt-4">
              Authentication sessions typically last for 30 days, but you can log out at any time to end your session and remove these cookies.
            </p>
          </div>

          {/* Section 7 */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-6">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">7. Updates to This Policy</h2>
            <p className="text-muted leading-relaxed">
              We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We encourage you to review this page periodically for the latest information.
            </p>
          </div>

          {/* Contact */}
          <div className="bg-primary-50 border border-primary-100 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-text mt-0 mb-4">Questions?</h2>
            <p className="text-muted leading-relaxed mb-4">
              If you have questions about how we use cookies or this Cookie Policy:
            </p>
            <p className="text-muted leading-relaxed">
              <strong className="text-text">Email:</strong> <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">{SUPPORT_EMAIL}</a>
            </p>
          </div>

          <div className="text-center mt-8 space-x-4">
            <Link href={ROUTES.PRIVACY} className="text-primary hover:underline">
              Privacy Policy
            </Link>
            <span className="text-muted">·</span>
            <Link href={ROUTES.TERMS} className="text-primary hover:underline">
              Terms of Service
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
