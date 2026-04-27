"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useSocialAuth } from "@/lib/hooks/useSocialAuth";
import { Loader2 } from "lucide-react";

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg role="img" viewBox="0 0 24 24" {...props}>
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg role="img" fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path
      d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.048 0-2.733.984-2.733 2.039v1.932h3.588l-.642 3.667h-2.946v7.98c5.721-1.562 9.397-6.982 8.957-12.876C22.642 4.856 17.773 0 11.998 0S1.355 4.856 1.355 10.814c-.44 5.894 3.237 11.314 8.957 12.876"
      fill="#1877F2"
    />
  </svg>
);

const socialButtonVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.3,
    },
  }),
};

export function SocialLogins() {
  const { googleAuthUrl, isGoogleAuthUrlLoading } = useSocialAuth();

  const handleGoogleLogin = () => {
    if (googleAuthUrl) {
      window.location.href = googleAuthUrl;
    } else {
      console.error("[SocialLogins] Google Auth URL is not available");
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <motion.div
        custom={0}
        variants={socialButtonVariants}
        initial="hidden"
        animate="visible"
      >
        <Button
          variant="outline"
          type="button"
          className="w-full h-10 rounded-[8px] bg-background/50 hover:bg-background border-border/50 hover:border-[#4285F4]/50 hover:shadow-lg hover:shadow-[#4285F4]/10 transition-all duration-300 group"
          onClick={handleGoogleLogin}
          disabled={isGoogleAuthUrlLoading || !googleAuthUrl}
        >
          {isGoogleAuthUrlLoading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <GoogleIcon className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
          )}
          <span className="font-medium">Google</span>
        </Button>
      </motion.div>

      <motion.div
        custom={1}
        variants={socialButtonVariants}
        initial="hidden"
        animate="visible"
      >
        <Button
          variant="outline"
          type="button"
          className="w-full h-10 rounded-[8px] bg-background/50 border-border/50 opacity-60 cursor-not-allowed relative overflow-hidden group"
          disabled
          title="Coming Soon"
        >
          <FacebookIcon className="mr-2 h-5 w-5" />
          <span className="font-medium">Facebook</span>
          {/* Coming Soon Badge */}
          <span className="absolute top-0 right-0 bg-muted text-muted-foreground text-[10px] px-1.5 py-0.5 rounded-bl-lg font-medium">
            Soon
          </span>
        </Button>
      </motion.div>
    </div>
  );
}
