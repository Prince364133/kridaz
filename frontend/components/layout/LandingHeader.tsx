'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingCart, Bell, User } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';

export const LandingHeader = () => {
    return (
        <header className="fixed top-6 left-0 right-0 z-[100] px-4 md:px-8 pointer-events-none">
            <div className="mx-auto max-w-7xl w-full pointer-events-auto">
                <div className={cn(
                    "flex items-center justify-between h-16 md:h-20 px-4 md:px-8",
                    "bg-[#00000066] backdrop-blur-xl",
                    "border border-white/10 rounded-full md:rounded-3xl",
                    "shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]"
                )}>
                    {/* Logo Section */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-[#A1FF00] rounded-lg flex items-center justify-center font-integral text-[#101010] text-xl md:text-2xl transition-transform group-hover:scale-110">
                            B
                        </div>
                        <span className="font-integral uppercase italic tracking-tighter text-white text-lg md:text-xl hidden sm:block">
                            BMS <span className="text-[#A1FF00] not-italic opacity-80">APP</span>
                        </span>
                    </Link>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="hidden md:flex items-center gap-4 text-white/60">
                            <button className="p-2 hover:bg-white/10 rounded-full transition-colors relative" aria-label="Shopping Cart">
                                <ShoppingCart className="w-5 h-5" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-[#A1FF00] rounded-full border border-black" />
                            </button>

                            <button className="p-2 hover:bg-white/10 rounded-full transition-colors" aria-label="Notifications">
                                <Bell className="w-5 h-5" />
                            </button>
                        </div>

                        {/* User Profile Card */}
                        <div className={cn(
                            "flex items-center gap-2 p-1 pl-3 bg-white/5 border border-white/10 rounded-full",
                            "hover:bg-white/10 transition-colors cursor-pointer group"
                        )}>
                            <div className="hidden sm:block text-right">
                                <p className="text-[10px] text-white/40 uppercase font-mono leading-none mb-1">Signed in</p>
                                <p className="text-sm font-integral text-white leading-none">PLAYER ONE</p>
                            </div>
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-zinc-800 border-2 border-white/10 rounded-full flex items-center justify-center overflow-hidden">
                                <User className="w-6 h-6 text-white/40" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
