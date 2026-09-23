"use client";

/**
 * Help Centre - Support articles and FAQs
 */

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Search, User, MessageCircle, Headphones, 
  CreditCard, Shield, AlertCircle, Mail 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ROUTES, SUPPORT_EMAIL } from "@/constants";

interface HelpArticle {
  id: string;
  category: string;
  icon: React.ReactNode;
  title: string;
  content: string;
}

const HELP_ARTICLES: HelpArticle[] = [
  {
    id: "account-setup",
    category: "Account",
    icon: <User className="h-5 w-5" />,
    title: "Setting up your account",
    content: "To create a TalkFriendly account, click 'Sign Up' on the homepage. You'll need to provide your name, profession, email, and create a password. You must be 18 years or older to use TalkFriendly. After signing up, check your email for a confirmation link to activate your account. Once confirmed, you can log in and start your mental wellbeing journey."
  },
  {
    id: "account-settings",
    category: "Account",
    icon: <User className="h-5 w-5" />,
    title: "Managing your account settings",
    content: "Access your account settings by clicking your profile picture and selecting 'Settings'. Here you can update your personal information, change your password, manage notification preferences, adjust privacy settings, and configure your theme. Changes are saved automatically when you update each field."
  },
  {
    id: "account-deletion",
    category: "Account",
    icon: <User className="h-5 w-5" />,
    title: "Deleting your account",
    content: "To delete your account, go to Settings and scroll to the 'Danger Zone' section. Click 'Delete Account' and follow the confirmation steps. This action is permanent and will remove your profile, journal entries, mood logs, and conversation history. Some data may be retained for legal compliance purposes. You can also export your data before deletion from the Settings page."
  },
  {
    id: "ai-companion",
    category: "AI Conversations",
    icon: <MessageCircle className="h-5 w-5" />,
    title: "How the AI Companion works",
    content: "The AI Companion is designed to provide empathetic, non-judgmental conversation. It uses your mood history and journal context to offer personalized responses. The AI can help you reflect on your thoughts, explore your feelings, and gain new perspectives. Remember that the AI Companion is not a replacement for professional mental health treatment. All conversations with the AI are private and not used to train external AI models."
  },
  {
    id: "ai-accuracy",
    category: "AI Conversations",
    icon: <MessageCircle className="h-5 w-5" />,
    title: "AI response accuracy",
    content: "While our AI is trained to be empathetic and helpful, AI-generated responses may sometimes be inaccurate, incomplete, or unsuitable for your specific situation. Always use your own judgment when considering advice or suggestions from the AI. For professional guidance on mental health matters, please consult a licensed mental health professional."
  },
  {
    id: "listener-sessions",
    category: "Listener Sessions",
    icon: <Headphones className="h-5 w-5" />,
    title: "Booking listener sessions",
    content: "Listener sessions connect you with trained individuals for compassionate conversation. To book a session: 1) Browse available listeners in the Listeners section, 2) View their profile, specializations, and reviews, 3) Click 'Book Session' and select your preferred date and time, 4) Complete the booking. Free accounts include 2 listener sessions per month. Premium subscribers get unlimited sessions."
  },
  {
    id: "listener-qualifications",
    category: "Listener Sessions",
    icon: <Headphones className="h-5 w-5" />,
    title: "Who are the listeners?",
    content: "TalkFriendly listeners are carefully selected and trained individuals, including certified coaches, peer support specialists, and some licensed therapists. They provide a supportive, non-judgmental space for conversation. Listeners are not replacing professional mental health treatment but offer real human connection and support for everyday challenges. All listeners undergo a vetting process and training on active listening, empathy, and boundary awareness."
  },
  {
    id: "subscription-plans",
    category: "Subscriptions",
    icon: <CreditCard className="h-5 w-5" />,
    title: "Subscription plans explained",
    content: "TalkFriendly offers three tiers: Free (daily check-ins, limited journal entries, basic AI access, 2 listener sessions/month), Plus ($12/month - unlimited journal, unlimited AI, advanced analytics), and Premium ($29/month - everything in Plus, plus unlimited listener sessions). You can upgrade or downgrade at any time from your account settings. All plans include access to communities and events."
  },
  {
    id: "subscription-cancel",
    category: "Subscriptions",
    icon: <CreditCard className="h-5 w-5" />,
    title: "Cancelling your subscription",
    content: "You can cancel your subscription at any time from Settings → Subscription. There are no cancellation fees or contracts. When you cancel, you'll retain access to your subscription features until the end of your current billing period. After cancellation, your account will automatically move to the Free plan. You can re-subscribe at any time."
  },
  {
    id: "privacy-security",
    category: "Privacy & Safety",
    icon: <Shield className="h-5 w-5" />,
    title: "How we protect your privacy",
    content: "Your privacy is fundamental to TalkFriendly. Your journal entries, mood data, and conversations are stored securely and privately. We never sell your personal information. You can export your data or delete your account at any time. Conversations with listeners are confidential, though listeners are required to report imminent safety concerns. For full details, please read our Privacy Policy."
  },
  {
    id: "data-usage",
    category: "Privacy & Safety",
    icon: <Shield className="h-5 w-5" />,
    title: "What happens to my data?",
    content: "Your data is used solely to provide and improve the TalkFriendly service. Journal entries and mood logs remain private to you. AI conversations are not shared with third parties or used to train external AI models. We use aggregated, anonymized data for service improvements and analytics. You can review our data practices in detail in our Privacy Policy, and you can request data export or deletion at any time from your account settings."
  },
  {
    id: "crisis-support",
    category: "Safety & Crisis",
    icon: <AlertCircle className="h-5 w-5" />,
    title: "If you're in crisis",
    content: "If you're in crisis or feel you may be in immediate danger, you're not alone. Please reach out to your local emergency services or an appropriate crisis support service in your country. TalkFriendly is not an emergency or crisis response service. We cannot provide immediate assistance in crisis situations. If you're experiencing thoughts of self-harm or suicide, please contact a crisis helpline or emergency services immediately."
  },
  {
    id: "contact-support",
    category: "Contact",
    icon: <Mail className="h-5 w-5" />,
    title: "Contacting TalkFriendly support",
    content: `For questions, feedback, or support requests, please email us at ${SUPPORT_EMAIL}. We typically respond within 24-48 hours. Please include as much detail as possible about your question or issue. For urgent account issues like being unable to log in, mention "URGENT" in your subject line. We're here to help make your TalkFriendly experience as smooth as possible.`
  },
];

const CATEGORIES = Array.from(new Set(HELP_ARTICLES.map(a => a.category)));

export function HelpCentreView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  const filteredArticles = HELP_ARTICLES.filter(article => {
    const matchesSearch = 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedArticles = CATEGORIES.reduce((acc, category) => {
    acc[category] = filteredArticles.filter(a => a.category === category);
    return acc;
  }, {} as Record<string, HelpArticle[]>);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
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
            <h1 className="text-4xl font-bold text-text mb-4">Help Centre</h1>
            <p className="text-xl text-muted">
              Find answers and get support for your TalkFriendly account
            </p>
          </motion.div>
        </div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
            <input
              type="text"
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-white text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
        </motion.div>

        {/* Category filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap gap-2 mb-8"
        >
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              !selectedCategory 
                ? "bg-primary text-white" 
                : "bg-white border border-border text-text hover:border-primary"
            }`}
          >
            All Topics
          </button>
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === category 
                  ? "bg-primary text-white" 
                  : "bg-white border border-border text-text hover:border-primary"
              }`}
            >
              {category}
            </button>
          ))}
        </motion.div>

        {/* Help Articles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-8"
        >
          {Object.entries(groupedArticles).map(([category, articles]) => 
            articles.length > 0 && (
              <div key={category}>
                <h2 className="text-2xl font-bold text-text mb-4">{category}</h2>
                <div className="space-y-3">
                  {articles.map((article) => (
                    <div
                      key={article.id}
                      className="bg-white rounded-xl border border-border overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedArticle(
                          expandedArticle === article.id ? null : article.id
                        )}
                        className="w-full flex items-center gap-3 p-5 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary shrink-0">
                          {article.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-text">{article.title}</h3>
                        </div>
                        <div className={`transition-transform ${expandedArticle === article.id ? 'rotate-180' : ''}`}>
                          <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>
                      {expandedArticle === article.id && (
                        <div className="px-5 pb-5 border-t border-border pt-4">
                          <p className="text-muted text-sm leading-relaxed">{article.content}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </motion.div>

        {/* No results */}
        {filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted mb-4">No articles found matching your search.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory(null);
              }}
              className="text-primary hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Contact support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 bg-primary-50 border border-primary-100 rounded-2xl p-8 text-center"
        >
          <h2 className="text-2xl font-bold text-text mb-2">Still need help?</h2>
          <p className="text-muted mb-6">
            Can't find what you're looking for? We're here to help.
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-600 transition-colors font-medium"
          >
            <Mail className="h-5 w-5" />
            Contact Support
          </a>
        </motion.div>
      </div>
    </div>
  );
}
