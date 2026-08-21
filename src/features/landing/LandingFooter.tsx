/**
 * Landing page footer.
 */

import React from "react";
import Image from "next/image";
import { Heart } from "lucide-react";

const FOOTER_LINKS = {
  Product: ["Features", "Pricing", "Changelog", "Roadmap"],
  Support: ["Help Center", "Contact", "Crisis Resources", "Community Guidelines"],
  Company: ["About", "Blog", "Careers", "Press"],
  Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy"],
};

export function LandingFooter() {
  return (
    <footer className="bg-gray-900 text-white py-16 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <Image 
                src="/images/logo.png" 
                alt="TalkFriendly" 
                width={40} 
                height={40}
                className="rounded-lg shrink-0"
              />
              <span className="font-bold text-xl text-white">TalkFriendly</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Professional mental wellness support, powered by empathy.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-white mb-3">{category}</h3>
              <ul className="space-y-2" role="list">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400 flex items-center gap-1.5">
            Made with <Heart className="h-3.5 w-3.5 fill-primary text-primary" /> for your wellbeing · © 2025 TalkFriendly, Inc.
          </p>
          <p className="text-xs text-gray-500">
            United States (English)
          </p>
        </div>
      </div>
    </footer>
  );
}
