'use client';

import React from 'react';
import { Book, Users, ShoppingBag, Sword, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@workspace/ui/components/button';

const AllinOneBanner = () => {
  return (
    <section className="relative w-full bg-black py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#A1FF00]/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-7xl font-integral font-bold uppercase text-white tracking-tighter italic leading-none drop-shadow-2xl">
            All In One <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">Sports</span>
          </h2>
          <div className="flex items-center justify-center gap-3 mt-4">
             <h3 className="text-4xl md:text-5xl font-integral font-bold uppercase text-white tracking-tighter italic leading-none">
                Experience
             </h3>
             <div className="relative rotate-[-2deg] bg-[#A1FF00] text-black px-4 py-1 rounded-full text-xl md:text-2xl font-freehand font-bold shadow-[0_0_20px_rgba(161,255,0,0.4)] animate-pulse">
                Powered by AI ✨
             </div>
          </div>
        </div>
        
        {/* Original Grid Structure (Restored) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

           {/* Left Column: Book Grounds (Full Height) */}
           <div className="group relative flex flex-col h-full overflow-hidden rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-500 hover:border-[#A1FF00]/50 hover:shadow-[0_0_30px_rgba(161,255,0,0.1)] hover:-translate-y-1 min-h-[500px]">
                <div className="absolute inset-0 z-0">
                    <Image 
                        src="/images/Allinoneimages/book-grounds-banner.png" 
                        alt="Book Grounds" 
                        fill
                        className="object-cover opacity-50 transition-transform duration-700 group-hover:scale-110 group-hover:opacity-40"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                </div>
                
                <div className="relative z-10 flex flex-col flex-grow p-8">
                    <div className="mb-4 bg-[#A1FF00]/10 w-fit p-3 rounded-2xl backdrop-blur-md border border-[#A1FF00]/20 text-[#A1FF00]">
                        <Book className="w-8 h-8" />
                    </div>
                    <div className="mt-auto">
                        <h3 className="text-4xl font-integral italic uppercase text-white mb-2">Book Venues</h3>
                        <p className="text-gray-400 mb-4 text-lg max-w-md">Find the perfect spot for Cricket, Football, Swimming, and more.</p>
                        
                        {/* Sports Tags */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            {['Cricket', 'Football', 'Swimming', 'Badminton'].map((sport) => (
                                <span key={sport} className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs text-white font-bold backdrop-blur-md">
                                    {sport}
                                </span>
                            ))}
                        </div>
                        <Button className="w-full sm:w-auto bg-white text-black font-bold h-12 px-8 rounded-xl border border-white hover:bg-[#A1FF00] hover:border-[#A1FF00] transition-all">
                            Find Venues
                        </Button>
                    </div>
                </div>
           </div>

           {/* Right Column: Other Cards Grid */}
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                
                {/* Challenge Players */}
                <div className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-500 hover:border-[#A1FF00]/50 hover:shadow-[0_0_30px_rgba(161,255,0,0.1)] p-6 min-h-[250px] flex flex-col justify-between hover:-translate-y-1">
                    <div className="absolute right-0 top-0 w-full h-full opacity-30 group-hover:opacity-50 transition-opacity">
                         <Image 
                            src="/images/Allinoneimages/challenge-players-banner.png" 
                            alt="Challenge" 
                            fill
                            className="object-cover"
                         />
                         <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                             <Sword className="w-6 h-6 text-[#A1FF00]" />
                             <span className="text-[#A1FF00] font-bold text-xs uppercase tracking-widest">Competitive</span>
                        </div>
                        <h3 className="text-2xl font-integral italic uppercase text-white leading-tight">Challenge<br/>Players</h3>
                    </div>
                    
                    <div className="relative z-10 mt-4">
                        <p className="text-gray-400 text-sm mb-3">Skill-matched opponents.</p>
                        <div className="flex items-center gap-2 text-white font-bold text-sm group-hover:text-[#A1FF00] transition-colors cursor-pointer">
                            Start Match <ArrowRight className="w-4 h-4" />
                        </div>
                    </div>
                </div>

                {/* Community */}
                <div className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-500 hover:border-[#A1FF00]/50 hover:shadow-[0_0_30px_rgba(161,255,0,0.1)] p-6 min-h-[250px] flex flex-col justify-between hover:-translate-y-1">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-[50px] group-hover:bg-blue-500/30 transition-colors" />
                    
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mb-4 text-[#A1FF00]">
                        <Users className="w-5 h-5" />
                    </div>
                    
                    <div>
                        <h3 className="text-2xl font-integral italic uppercase text-white mb-2">Community</h3>
                        <p className="text-gray-400 text-sm mb-4">Join tribes & share wins.</p>
                        <Link href="/community" className="text-white hover:text-[#A1FF00] underline decoration-[#A1FF00] underline-offset-4 font-bold text-sm flex items-center gap-2">
                            Join Now <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>

                {/* Marketplace (Spans 2 columns) */}
                <div className="group sm:col-span-2 relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-500 hover:border-[#A1FF00]/50 hover:shadow-[0_0_30px_rgba(161,255,0,0.1)] p-8 flex flex-col sm:flex-row items-center justify-between hover:-translate-y-1 gap-6">
                    <div className="absolute -left-20 top-0 w-64 h-64 bg-[#A1FF00] rounded-full blur-[100px] opacity-10 group-hover:opacity-20 transition-opacity" />
                    
                    <div className="relative z-10 flex-1 text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                             <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-[#A1FF00]">
                                <ShoppingBag className="w-5 h-5" />
                             </div>
                             <h3 className="text-3xl font-integral italic uppercase text-white">Marketplace</h3>
                        </div>
                        <p className="text-gray-400">Premium gear curated for your sport.</p>
                    </div>

                    <div className="relative z-10">
                        <Link href="/marketplace">
                            <Button variant="outline" className="border-white/20 text-white hover:border-[#A1FF00] hover:text-[#A1FF00] hover:bg-[#A1FF00]/10 rounded-xl px-8 h-12 font-bold font-bayon uppercase tracking-wide">
                                Shop Gear
                            </Button>
                        </Link>
                    </div>
                </div>

           </div>

        </div>
      </div>
    </section>
  );
};

export default AllinOneBanner;