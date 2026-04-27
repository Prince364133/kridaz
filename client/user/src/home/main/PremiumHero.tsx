'use client';

import React from 'react';
const Image = (props: any) => <img {...props} />;
import { Smartphone, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const PremiumHero = () => {
    return (
        <section className="relative min-h-[70vh] w-full flex items-center overflow-hidden bg-black">
            {/* ── Full-Width Athlete Background ── */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/images/hero-athletes-background.png"
                    alt="Champion athletes"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover object-[50%_35%] scale-90 transition-all duration-1000"
                    quality={90}
                />
                {/* Dark gradient — heavy on the left so text pops, fades right */}
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
                {/* Bottom fade so sections below look seamless */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
                {/* Subtle brand-color tint */}
                <div className="absolute inset-0 bg-[#A1FF00]/5 mix-blend-overlay" />
            </div>

            {/* ── Content Layer ── */}
            <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-20 pt-32 lg:pt-40 pb-20 lg:pb-28">
                <div className="flex flex-col max-w-2xl">

                    {/* ── Left: Headline + CTA ── */}
                    <div className="flex flex-col gap-6 lg:gap-8 max-w-xl">
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#A1FF00]/10 border border-[#A1FF00]/25 backdrop-blur-sm w-fit"
                        >
                            <div className="w-2 h-2 rounded-full bg-[#A1FF00] animate-pulse" />
                            <span className="text-[#A1FF00] font-bold text-xs uppercase tracking-widest">
                                India&apos;s #1 Sports Platform
                            </span>
                        </motion.div>

                        {/* Headline */}
                        <motion.h1
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.7, delay: 0.1 }}
                            className="text-5xl sm:text-6xl lg:text-7xl font-integral font-black leading-[1.05] tracking-tight text-white"
                        >
                            More Than<br />
                            Booking.<br />
                            <span className="text-[#A1FF00] drop-shadow-[0_0_40px_rgba(161,255,0,0.5)]">
                                This Is Where<br />Players Belong.
                            </span>
                        </motion.h1>

                        {/* Sub-copy */}
                        <motion.p
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                            className="text-white/60 text-base lg:text-lg leading-relaxed"
                        >
                            Book grounds. Join matches. Build community.<br />
                            Upgrade your game — All in one app.
                        </motion.p>

                        {/* CTAs */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.3 }}
                            className="flex flex-wrap gap-4 pt-2"
                        >
                            {/* Primary CTA */}
                            <button className="inline-flex items-center gap-2 px-7 py-4 rounded-full bg-[#A1FF00] text-black font-bold text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(161,255,0,0.4)] hover:shadow-[0_0_50px_rgba(161,255,0,0.6)] hover:scale-105 active:scale-95 transition-all duration-300">
                                <Smartphone size={16} />
                                Download App
                            </button>
                            {/* Secondary CTA */}
                            <button className="inline-flex items-center gap-2 px-7 py-4 rounded-full bg-white/8 border border-white/20 text-white font-bold text-sm uppercase tracking-wider hover:bg-white/15 hover:border-white/30 active:scale-95 transition-all duration-300">
                                About BMS
                                <ChevronRight size={16} />
                            </button>
                        </motion.div>
                    </div>


                </div>
            </div>
        </section>
    );
};

export default PremiumHero;
