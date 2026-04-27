'use client';

import React from 'react';
import { Activity, Trophy, Users, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
    {
        icon: <Activity size={24} className="text-[#00D1FF]" />,
        label: 'LIVE SCORE',
        href: '#',
        borderColor: 'border-[#00D1FF]/20',
    },
    {
        icon: <Trophy size={24} className="text-[#FF9F00]" />,
        label: 'JOIN TOURNAMENTS',
        href: '#',
        borderColor: 'border-[#FF9F00]/20',
    },
    {
        icon: <Users size={24} className="text-[#A1FF00]" />,
        label: 'FIND PLAYERS',
        href: '#',
        borderColor: 'border-[#A1FF00]/20',
    },
    {
        icon: <ShoppingBag size={24} className="text-[#C678FF]" />,
        label: 'MARKETPLACE',
        href: '#',
        borderColor: 'border-[#C678FF]/20',
    },
];

export const FeatureNav = () => {
    return (
        <section className="w-full bg-black border-y border-white/10">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-20">
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10 border-x border-white/10">
                    {features.map((feature, idx) => (
                        <motion.a
                            key={feature.label}
                            href={feature.href}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="group flex items-center justify-center gap-4 py-8 px-4 transition-all hover:bg-white/[0.03]"
                        >
                            <div className="transition-transform duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                                {feature.icon}
                            </div>
                            <span className="text-white/80 font-integral text-xs sm:text-sm tracking-widest font-bold group-hover:text-white transition-colors uppercase">
                                {feature.label}
                            </span>
                        </motion.a>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeatureNav;
