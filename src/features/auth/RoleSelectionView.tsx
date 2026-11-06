"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, Stethoscope, ArrowRight, Shield, Users, Calendar, MessageCircle, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

export function RoleSelectionView() {
  const router = useRouter();

  const handleRoleSelection = (role: 'user' | 'listener') => {
    if (role === 'user') {
      router.push('/auth/register?role=user');
    } else {
      // Go directly to listener application form (no password yet)
      router.push('/auth/register/listener-application');
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-2xl font-bold text-text mb-2">Choose Your Account Type</h1>
        <p className="text-muted">
          Select how you want to join our mental health support community
        </p>
      </motion.div>

      {/* Role Cards */}
      <div className="space-y-4 mb-6">
        {/* Normal User Card */}
        <motion.div variants={itemVariants}>
          <RoleCard
            icon={<Heart className="h-8 w-8" />}
            title="I Need Support"
            subtitle="Member Account"
            features={[
              { icon: <Users className="h-4 w-4" />, text: "Connect with verified Listeners" },
              { icon: <Calendar className="h-4 w-4" />, text: "Book consultations" },
              { icon: <MessageCircle className="h-4 w-4" />, text: "Private messaging" }
            ]}
            buttonText="Continue as Member"
            onClick={() => handleRoleSelection('user')}
            accentColor="blue"
          />
        </motion.div>

        {/* Listener Card */}
        <motion.div variants={itemVariants}>
          <RoleCard
            icon={<Stethoscope className="h-8 w-8" />}
            title="I'm a Professional"
            subtitle="Listener Account"
            features={[
              { icon: <Shield className="h-4 w-4" />, text: "Professional verification" },
              { icon: <Calendar className="h-4 w-4" />, text: "Manage availability" },
              { icon: <Award className="h-4 w-4" />, text: "Earn from expertise" }
            ]}
            buttonText="Start Application"
            onClick={() => handleRoleSelection('listener')}
            accentColor="green"
            isProfessional
          />
        </motion.div>
      </div>

      {/* Security Note */}
      <motion.div 
        variants={itemVariants}
        className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6"
      >
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800">
              <strong className="font-semibold">Your Safety Matters:</strong> All Listeners undergo credential verification. Your data is always protected.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div variants={itemVariants} className="text-center">
        <p className="text-sm text-muted">
          Already have an account?{" "}
          <Link 
            href="/auth/login" 
            className="text-primary font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </motion.div>
  );
}

interface RoleCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  features: Array<{ icon: React.ReactNode; text: string }>;
  buttonText: string;
  onClick: () => void;
  accentColor: 'blue' | 'green';
  isProfessional?: boolean;
}

function RoleCard({
  icon,
  title,
  subtitle,
  features,
  buttonText,
  onClick,
  accentColor,
  isProfessional = false
}: RoleCardProps) {
  const borderColor = accentColor === 'blue' 
    ? 'border-blue-200 hover:border-blue-300 hover:bg-blue-50/50' 
    : 'border-green-200 hover:border-green-300 hover:bg-green-50/50';

  const iconBg = accentColor === 'blue'
    ? 'bg-blue-100 text-blue-600'
    : 'bg-green-100 text-green-600';

  const buttonClasses = accentColor === 'blue'
    ? 'bg-blue-600 hover:bg-blue-700 text-white'
    : 'bg-green-600 hover:bg-green-700 text-white';

  return (
    <div 
      className={`relative border-2 ${borderColor} rounded-2xl p-5 transition-all duration-200 bg-background cursor-pointer group`}
      onClick={onClick}
    >
      {/* Professional Badge */}
      {isProfessional && (
        <div className="absolute top-4 right-4">
          <div className="flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full border border-green-200">
            <Shield className="h-3 w-3" />
            <span>Verified</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className={`flex-shrink-0 w-14 h-14 ${iconBg} rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform`}>
          {icon}
        </div>
        <div className="flex-1 pt-1">
          <h3 className="text-lg font-bold text-text mb-0.5">
            {title}
          </h3>
          <p className="text-sm text-muted font-medium">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="space-y-2 mb-4 pl-[72px]">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className={`flex-shrink-0 ${accentColor === 'blue' ? 'text-blue-600' : 'text-green-600'}`}>
              {feature.icon}
            </div>
            <span className="text-sm text-muted">{feature.text}</span>
          </div>
        ))}
      </div>

      {/* Button */}
      <Button
        className={`w-full ${buttonClasses} group-hover:shadow-md transition-all`}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        {buttonText}
        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
      </Button>
    </div>
  );
}
