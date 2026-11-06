"use client";

import React from "react";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

interface Step {
  id: number;
  title: string;
  description: string;
}

interface ApplicationProgressIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function ApplicationProgressIndicator({ 
  steps, 
  currentStep 
}: ApplicationProgressIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* Step Circle */}
            <div className="flex flex-col items-center flex-1">
              <motion.div
                initial={false}
                animate={{
                  scale: currentStep === step.id ? 1.1 : 1,
                }}
                className={`
                  relative w-10 h-10 rounded-full flex items-center justify-center
                  transition-all duration-300 font-semibold text-sm
                  ${
                    currentStep > step.id
                      ? 'bg-green-500 text-white'
                      : currentStep === step.id
                      ? 'bg-primary text-white ring-4 ring-primary/20'
                      : 'bg-gray-200 text-gray-500'
                  }
                `}
              >
                {currentStep > step.id ? (
                  <Check className="h-5 w-5" />
                ) : (
                  step.id
                )}
              </motion.div>
              
              {/* Step Label */}
              <div className="mt-2 text-center">
                <div className={`
                  text-xs font-medium
                  ${currentStep >= step.id ? 'text-text' : 'text-muted'}
                `}>
                  {step.title}
                </div>
                <div className="text-xs text-muted hidden sm:block">
                  {step.description}
                </div>
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 mb-8 mx-2">
                <div className="relative h-0.5 bg-gray-200">
                  <motion.div
                    initial={false}
                    animate={{
                      width: currentStep > step.id ? '100%' : '0%',
                    }}
                    transition={{ duration: 0.3 }}
                    className="absolute top-0 left-0 h-full bg-green-500"
                  />
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
