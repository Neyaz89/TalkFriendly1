"use client";

/**
 * Secure Logout Confirmation Dialog
 * Prevents accidental logouts and ensures proper cleanup
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LogoutConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function LogoutConfirmDialog({ isOpen, onClose, onConfirm }: LogoutConfirmDialogProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsLoggingOut(true);
      await onConfirm();
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  const handleClose = () => {
    if (!isLoggingOut) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isLoggingOut) {
      handleClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-dialog-title"
          onKeyDown={handleKeyDown}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            {!isLoggingOut && (
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            )}

            <div className="p-6 sm:p-8">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <LogOut className="h-8 w-8 text-red-600 dark:text-red-400" aria-hidden="true" />
                </div>
              </div>

              {/* Content */}
              <div className="text-center mb-8">
                <h2 
                  id="logout-dialog-title"
                  className="text-2xl font-bold text-gray-900 dark:text-white mb-3"
                >
                  Log out of TalkFriendly?
                </h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Are you sure you want to log out? You'll need to sign in again to access your account.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-12"
                  onClick={handleClose}
                  disabled={isLoggingOut}
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 h-12"
                  onClick={handleConfirm}
                  disabled={isLoggingOut}
                  type="button"
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Logging out...
                    </>
                  ) : (
                    <>
                      <LogOut className="h-5 w-5 mr-2" />
                      Yes, Log Out
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
