"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Shield, Sparkles } from "lucide-react";

interface AuthPageLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showBranding?: boolean;
}

const BrandingPanel = () => (
  <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden rounded-[2rem] bg-black items-center justify-center">
    {/* Abstract Clean Gradients (Reference Style) */}
    <div className="absolute top-0 right-0 w-[90%] h-[90%] bg-[#A1FF00] blur-[150px] opacity-20 rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
    <div className="absolute bottom-0 left-0 w-[70%] h-[70%] bg-blue-600 blur-[150px] opacity-25 rounded-full -translate-x-1/4 translate-y-1/4 pointer-events-none" />
    
    {/* Grid Overlay for texture */}
    <div 
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }}
    />

    <div className="relative z-10 flex flex-col justify-between h-full p-12 max-w-lg text-left">
       {/* Top: Logo */}
       <div>
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:bg-[#A1FF00] group-hover:text-black transition-all duration-300">
               <Sparkles className="w-5 h-5 text-white group-hover:text-black transition-colors" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white font-integral">Owl Turf</span>
          </Link>
       </div>

       {/* Middle: Hero Content */}
       <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="space-y-6"
       >
          <h1 className="text-5xl lg:text-6xl font-bold font-integral text-white leading-[0.9]">
             Your Game, <br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A1FF00] to-green-400">Your Rules</span>
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed font-medium max-w-sm">
             Book sports venues, join games, and connect with players near you. The ultimate platform for sports enthusiasts.
          </p>
       </motion.div>

       {/* Bottom: Trust/Stats */}
       <div className="flex items-center gap-6 pt-6 border-t border-white/10">
           <div>
               <p className="text-2xl font-bold text-white font-integral">10K+</p>
               <p className="text-xs text-gray-500 uppercase tracking-wider">Players</p>
           </div>
           <div className="w-px h-8 bg-white/10" />
           <div>
               <p className="text-2xl font-bold text-white font-integral">500+</p>
               <p className="text-xs text-gray-500 uppercase tracking-wider">Venues</p>
           </div>
       </div>
    </div>
  </div>
);

export function AuthPageLayout({ 
  children, 
  title,
  subtitle,
  showBranding = true 
}: AuthPageLayoutProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F4F4F5] dark:bg-[#09090b] p-4 sm:p-6 lg:p-8">
      {/* 
        Main Card Container 
        - Fits the "Floating Card" concept
        - max-w-7xl for wide spacious look
        - p-2 to create the "nested" look for the left panel
      */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[1400px] h-auto lg:h-[800px] bg-white dark:bg-card rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row p-2 shadow-black/5"
      >
        
        {/* Left: Branding Panel (Nested Card) */}
        {showBranding && <BrandingPanel />}

        {/* Right: Form Panel */}
        {/* Right: Form Panel */}
        <div className="flex-1 w-full h-full bg-white dark:bg-card relative overflow-y-auto overflow-x-hidden rounded-[2rem] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="min-h-full flex flex-col">
            
            {/* Mobile Header */}
            <div className="lg:hidden p-6 flex justify-between items-center">
               <Link href="/" className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-lg bg-[#A1FF00] flex items-center justify-center">
                   <Sparkles className="w-4 h-4 text-black" />
                 </div>
                 <span className="text-lg font-bold font-integral">Owl Turf</span>
               </Link>
            </div>

            {/* Form Container - Centered */}
            <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-16">
              <div className="w-full max-w-md space-y-8">
                 {/* Optional Title passed via props or children */}
                 {title && (
                   <div className="text-center space-y-2">
                     <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                     {subtitle && <p className="text-gray-500">{subtitle}</p>}
                   </div>
                 )}
                 {children}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-zinc-800 text-[10px] text-gray-500 font-medium">
                <Shield className="w-3 h-3" />
                <span>Secured with 256-bit SSL Encryption</span>
              </div>
            </div>

          </div>
        </div>

      </motion.div>
    </div>
  );
}
