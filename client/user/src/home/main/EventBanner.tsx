'use client';

import React, { useState, useEffect } from 'react';
const Image = (props: any) => <img {...props} />;
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const slides = [
    {
        id: 'cricket-carnival',
        badge: 'TOURNAMENT',
        title: 'CRICKET\nCARNIVAL',
        subtitle: 'Join the biggest amateur league in Bengaluru',
        buttonText: 'REGISTER TODAY',
        image: '/images/event-cricket-carnival.png',
        color: '#A1FF00'
    },
    {
        id: 'pro-coaching',
        badge: 'NEW LAUNCH',
        title: 'PRO\nCOACHING',
        subtitle: 'Learn from national level coaches at top venues',
        buttonText: 'VIEW CLASSES',
        image: '/images/event-pro-coaching.png',
        color: '#A1FF00'
    }
];

const EventBanner = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    const SLIDE_DURATION = 5000;
    const INTERVAL_TIME = 50;

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev < 100) {
                    return prev + (INTERVAL_TIME / SLIDE_DURATION) * 100;
                }
                return 100;
            });
        }, INTERVAL_TIME);

        return () => clearInterval(timer);
    }, [activeIndex]);

    useEffect(() => {
        if (progress >= 100) {
            const timeout = setTimeout(() => {
                setActiveIndex((current) => (current + 1) % slides.length);
                setProgress(0);
            }, 200); // Small delay to show full bar
            return () => clearTimeout(timeout);
        }
    }, [progress]);

    const currentSlide = slides[activeIndex];

    return (
        <section className="px-4 md:px-8 lg:px-20 py-8 bg-black">
            <div className="relative w-full min-h-[320px] md:min-h-[400px] lg:min-h-[440px] rounded-[32px] md:rounded-[48px] overflow-hidden group">
                {/* Background Images with AnimatePresence for Fading */}
                <div className="absolute inset-0 z-0">
                    <AnimatePresence>
                        <motion.div
                            key={currentSlide.id}
                            initial={{ opacity: 0, scale: 1.05 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            transition={{ duration: 0.8 }}
                            className="absolute inset-0"
                        >
                            <Image
                                src={currentSlide.image}
                                alt={currentSlide.title}
                                fill
                                className="object-cover"
                                quality={90}
                            />
                            {/* Cinematic Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
                            <div className="absolute inset-0 bg-black/10" />
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 h-full flex flex-col justify-center p-8 md:p-12 lg:p-16 space-y-4 md:space-y-6">
                    {/* Category Badge */}
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={`badge-${activeIndex}`}
                        className="inline-flex items-center gap-2"
                    >
                        <span className="px-4 py-1 bg-[#A1FF00] text-black font-bold text-[9px] md:text-[11px] tracking-widest rounded-full uppercase">
                            {currentSlide.badge}
                        </span>
                        <div className="h-[1px] w-8 md:w-12 bg-white/30" />
                    </motion.div>

                    {/* Dynamic Heading */}
                    <div className="space-y-1 md:space-y-2">
                        <motion.h2 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={`title-${activeIndex}`}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-6xl lg:text-7xl font-integral italic uppercase leading-none tracking-tighter text-white whitespace-pre-line"
                        >
                            {currentSlide.title}
                        </motion.h2>
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            key={`subtitle-${activeIndex}`}
                            transition={{ delay: 0.2 }}
                            className="text-xs md:text-lg text-white/70 font-medium tracking-tight max-w-md"
                        >
                            {currentSlide.subtitle}
                        </motion.p>
                    </div>

                    {/* Action Button */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        key={`btn-${activeIndex}`}
                        transition={{ delay: 0.3 }}
                        className="pt-2 md:pt-4"
                    >
                        <button className={cn(
                            "group/btn flex items-center gap-4 md:gap-6 px-6 py-3 md:px-8 md:py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl md:rounded-3xl",
                            "hover:bg-white/20 transition-all active:scale-95 shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
                        )}>
                            <span className="text-white font-integral text-[10px] md:text-xs tracking-widest uppercase">
                                {currentSlide.buttonText}
                            </span>
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-[#A1FF00] rounded-full flex items-center justify-center text-black group-hover/btn:scale-110 transition-transform">
                                <ChevronRight size={20} />
                            </div>
                        </button>
                    </motion.div>

                    {/* Pager Indicator Dots */}
                    <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3">
                        {slides.map((_, index) => (
                            <button 
                                key={index}
                                onClick={() => { setActiveIndex(index); setProgress(0); }}
                                aria-label={`Go to slide ${index + 1}`}
                                className={cn(
                                    "transition-all duration-300 rounded-full",
                                    index === activeIndex ? "w-8 md:w-12 h-2 md:h-2.5 bg-[#A1FF00]" : "w-2 md:w-2.5 h-2 md:h-2.5 bg-white/30"
                                )}
                            />
                        ))}
                    </div>

                    {/* BOTTOM LOADER (The requested green line) */}
                    <div className="absolute bottom-0 left-0 w-full h-1.5 bg-white/5 overflow-hidden">
                        <motion.div 
                            className="h-full bg-[#A1FF00]"
                            initial={{ width: '0%' }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: INTERVAL_TIME / 1000, ease: 'linear' }}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default EventBanner;
