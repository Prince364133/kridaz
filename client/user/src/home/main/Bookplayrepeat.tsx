'use client';

import React from 'react';
const Image = (props: any) => <img {...props} />;
import { Button } from '@/components/ui/button';
import { Apple, Play, Smartphone } from 'lucide-react';

const Bookplayrepeat = () => {
  return (
    <section className="relative w-full bg-black py-20 overflow-hidden">
        {/* Ambient Background Glow */}
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#A1FF00]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-24">
        
        {/* Left Column: Image / Mockup */}
        <div className="flex-1 w-full flex justify-center lg:justify-end relative">
             {/* Decor Circle */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] border border-[#A1FF00]/20 rounded-full animate-[spin_10s_linear_infinite]" />
             
             <div className="relative z-10 w-full max-w-md">
                <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm shadow-[0_0_50px_rgba(0,0,0,0.5)] p-4">
                     <Image 
                        src='/images/BookPlayRepeat.png' 
                        alt='Book Play Repeat App Interface' 
                        width={600} 
                        height={800} 
                        className='w-full h-auto object-contain rounded-2xl'
                    />
                </div>
             </div>
        </div>

        {/* Right Column: Content */}
        <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-1 rounded-full bg-[#A1FF00]/10 border border-[#A1FF00]/20 backdrop-blur-md">
                 <Smartphone className="w-4 h-4 text-[#A1FF00]" />
                 <span className="text-[#A1FF00] font-bold text-xs uppercase tracking-widest">Available on iOS & Android</span>
            </div>

            <h2 className="text-5xl md:text-7xl font-integral font-bold uppercase text-white leading-[0.9] tracking-tighter mb-6 drop-shadow-2xl">
                Book <span className="text-gray-600">.</span> Play <span className="text-gray-600">.</span> <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A1FF00] to-green-400">Repeat</span>
            </h2>

            <p className="text-gray-400 text-lg md:text-xl font-medium mb-10 max-w-lg mx-auto lg:mx-0">
                Kickstart your fitness journey with Owl Turf. The ultimate app for booking venues and finding players.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                {/* Google Play Button */}
                <Button className="h-14 px-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 hover:border-[#A1FF00]/50 transition-all group min-w-[180px] justify-start">
                    <Play className="w-6 h-6 mr-3 text-white fill-current group-hover:text-[#A1FF00] transition-colors" />
                    <div className="flex flex-col items-start text-white">
                        <span className="text-[10px] uppercase tracking-wider opacity-60">Get it on</span>
                        <span className="font-bold text-lg leading-none group-hover:text-[#A1FF00] transition-colors">Google Play</span>
                    </div>
                </Button>

                {/* App Store Button */}
                <Button className="h-14 px-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 hover:border-[#A1FF00]/50 transition-all group min-w-[180px] justify-start">
                    <Apple className="w-6 h-6 mr-3 text-white fill-current group-hover:text-[#A1FF00] transition-colors" />
                    <div className="flex flex-col items-start text-white">
                        <span className="text-[10px] uppercase tracking-wider opacity-60">Download on the</span>
                        <span className="font-bold text-lg leading-none group-hover:text-[#A1FF00] transition-colors">App Store</span>
                    </div>
                </Button>
            </div>
        </div>

      </div>
    </section>
  );
};

export default Bookplayrepeat;
