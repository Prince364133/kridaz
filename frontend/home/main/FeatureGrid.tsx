'use client';

import React from 'react';
import Image from 'next/image';
import { Layout, Users, ShoppingBag, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

export const FeatureGrid = () => {
    return (
        <section className="w-full bg-black py-20 lg:py-32 overflow-hidden">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-20">
                
                {/* ── The Grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
                    
                    {/* Left: Book Grounds (Columns 1-5) */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="lg:col-span-5 group relative bg-white/[0.03] border border-white/10 rounded-[40px] p-8 lg:p-12 flex flex-col justify-between overflow-hidden"
                    >
                        <div className="relative aspect-[1.4/1] w-full rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
                            <Image 
                                src="/images/book-grounds-app.png" 
                                alt="Book Grounds App View"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div className="mt-8">
                            <div className="flex items-center gap-3 mb-4">
                                <Layout className="text-[#A1FF00]" size={28} />
                                <h3 className="text-3xl font-integral font-black text-white uppercase italic">Book Grounds</h3>
                            </div>
                            <p className="text-white/40 text-lg">AI suggests the best venues near you.</p>
                        </div>
                    </motion.div>

                    {/* Center: Challenge Players (Columns 6-8) */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-3 group relative bg-white/[0.03] border border-white/10 rounded-[40px] flex flex-col overflow-hidden"
                    >
                        <div className="p-8 lg:p-10 pb-0">
                            <div className="flex items-start gap-3 mb-4">
                                <Users className="text-white" size={24} />
                                <div>
                                    <h3 className="text-2xl font-integral font-black text-white uppercase leading-tight italic">Challenge Players</h3>
                                    <p className="text-white/40 text-sm mt-3 leading-relaxed">Connect with skill-matched opponents.</p>
                                </div>
                            </div>
                        </div>
                        <div className="relative flex-1 mt-4 w-full h-[300px] lg:h-auto overflow-hidden">
                            <Image 
                                src="/images/challenge-players-graphic.png" 
                                alt="Challenge Players"
                                fill
                                className="object-cover object-top transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        </div>
                    </motion.div>

                    {/* Right: Community & Marketplace (Columns 9-12) */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        {/* Community */}
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="flex-1 group relative bg-white/[0.03] border border-white/10 rounded-[40px] p-10 flex flex-col justify-center gap-4 hover:bg-white/[0.05] transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <MessageSquare className="text-white" size={24} />
                                <h3 className="text-3xl font-integral font-black text-white uppercase italic">Community</h3>
                            </div>
                            <p className="text-white/40 text-lg leading-relaxed">Access tailored blogs, forums, and chats.</p>
                        </motion.div>

                        {/* Marketplace */}
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="flex-1 group relative bg-white/[0.03] border border-white/10 rounded-[40px] p-10 flex flex-col justify-center gap-4 hover:bg-white/[0.05] transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <ShoppingBag className="text-white" size={24} />
                                <h3 className="text-3xl font-integral font-black text-white uppercase italic">Marketplace</h3>
                            </div>
                            <p className="text-white/40 text-lg leading-relaxed">Get personalized gear and expert recommendations.</p>
                        </motion.div>
                    </div>

                </div>

                {/* ── Bottom Slogan ── */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center pt-10 border-t border-white/5"
                >
                    <p className="text-xl sm:text-2xl lg:text-3xl font-medium text-white max-w-4xl mx-auto leading-tight">
                        Everything you need to <span className="text-[#A1FF00]">play</span>, <span className="text-[#00D1FF]">connect</span>, and <span className="text-[#FF9F00]">grow</span> — unified in one powerful platform.
                    </p>
                </motion.div>

            </div>
        </section>
    );
};

export default FeatureGrid;
