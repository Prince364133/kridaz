'use client';

import React from 'react';
const Image = (props: any) => <img {...props} />;
import { ArrowRight, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Expanded Sport Data for Infinite Scroll Effect
const sports = [
  { name: "Cricket", img: "/images/Playercarousel/cricket.png", category: "Team Sport" },
  { name: "Football", img: "/images/Playercarousel/football.png", category: "Team Sport" },
  { name: "Badminton", img: "/images/Playercarousel/badminton.png", category: "Racquet" },
  { name: "Tennis", img: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=800&auto=format&fit=crop", category: "Racquet" },
  { name: "Swimming", img: "https://images.unsplash.com/photo-1600965962102-9d260a304c63?q=80&w=800&auto=format&fit=crop", category: "Aquatic" },
  { name: "Basketball", img: "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop", category: "Team Sport" },
  { name: "Volleyball", img: "https://images.unsplash.com/photo-1612872087720-48ca45b0d6b3?q=80&w=800&auto=format&fit=crop", category: "Team Sport" },
  { name: "Table Tennis", img: "https://images.unsplash.com/photo-1534158914592-062992bbe900?q=80&w=800&auto=format&fit=crop", category: "Indoor" },
  { name: "Hockey", img: "https://images.unsplash.com/photo-1532555088277-33633dbe265d?q=80&w=800&auto=format&fit=crop", category: "Team Sport" },
  { name: "Pickleball", img: "https://images.unsplash.com/photo-1629814585038-0245cd2e259b?q=80&w=800&auto=format&fit=crop", category: "Trending" },
];

const PlayerCarousel = () => {
  return (
    <section className="relative w-full bg-black py-24 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(161,255,0,0.05),transparent_70%)]" />
        
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-16 text-center">
            {/* Header */}
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                 <Flame className="w-4 h-4 text-[#A1FF00]" />
                 <span className="text-[#A1FF00] font-bold text-xs uppercase tracking-widest">100+ Sports Available</span>
            </div>
            
            <h2 className="text-5xl md:text-7xl font-integral font-bold uppercase text-white tracking-tighter italic leading-none drop-shadow-2xl mb-6">
                Unleash Your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-400 to-gray-600">Athlete Within</span>
            </h2>
            
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-medium">
                From the pitch to the pool, find your game and dominate the field.
            </p>
        </div>

        {/* Marquee Container */}
        <div className="relative w-full flex flex-col gap-8">
            {/* Decor Gradients for fade effect on edges */}
            <div className="absolute left-0 top-0 bottom-0 w-20 md:w-40 z-20 bg-gradient-to-r from-black to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 md:w-40 z-20 bg-gradient-to-l from-black to-transparent pointer-events-none" />

            {/* Row 1: Left Scroll */}
            <div className="flex overflow-hidden group">
                <div className="flex animate-marquee gap-6 min-w-full">
                    {[...sports, ...sports].map((sport, idx) => (
                        <SportCard key={`${sport.name}-1-${idx}`} sport={sport} />
                    ))}
                </div>
                <div className="flex animate-marquee gap-6 min-w-full" aria-hidden="true">
                     {[...sports, ...sports].map((sport, idx) => (
                        <SportCard key={`${sport.name}-1-clone-${idx}`} sport={sport} />
                    ))}
                </div>
            </div>

            {/* Row 2: Right Scroll (Reverse) */}
             <div className="flex overflow-hidden group">
                <div className="flex animate-marquee-reverse gap-6 min-w-full">
                    {[...sports.slice().reverse(), ...sports.slice().reverse()].map((sport, idx) => (
                        <SportCard key={`${sport.name}-2-${idx}`} sport={sport} />
                    ))}
                </div>
                <div className="flex animate-marquee-reverse gap-6 min-w-full" aria-hidden="true">
                     {[...sports.slice().reverse(), ...sports.slice().reverse()].map((sport, idx) => (
                        <SportCard key={`${sport.name}-2-clone-${idx}`} sport={sport} />
                    ))}
                </div>
            </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center relative z-10">
             <Button className="bg-[#A1FF00] text-black font-bold h-14 px-10 rounded-full text-lg hover:bg-white transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(161,255,0,0.3)]">
                Explore All Sports <ArrowRight className="ml-2 w-5 h-5" />
             </Button>
        </div>
    </section>
  );
};

// Individual Sport Card Component
const SportCard = ({ sport }: { sport: typeof sports[0] }) => (
    <div className="relative w-[280px] h-[400px] flex-shrink-0 group/card cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-500 hover:border-[#A1FF00] hover:shadow-[0_0_30px_rgba(161,255,0,0.2)] hover:-translate-y-2">
        {/* Image */}
        <div className="absolute inset-0">
             <Image 
                src={sport.img} 
                alt={sport.name} 
                fill 
                className="object-cover transition-transform duration-700 group-hover/card:scale-110 opacity-70 group-hover/card:opacity-50"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 w-full p-6 translate-y-2 group-hover/card:translate-y-0 transition-transform duration-300">
             <div className="flex items-center gap-2 mb-2 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 delay-100">
                 <span className="bg-[#A1FF00] text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase">{sport.category}</span>
             </div>
             <h3 className="text-3xl font-integral italic uppercase text-white leading-none mb-2">{sport.name}</h3>
             <div className="h-0 group-hover/card:h-auto overflow-hidden transition-all duration-300">
                <div className="flex items-center gap-2 text-[#A1FF00] font-bold text-sm mt-2 opacity-0 group-hover/card:opacity-100 transition-opacity delay-200">
                    Play Now <ArrowRight className="w-4 h-4" />
                </div>
             </div>
        </div>
    </div>
);

export default PlayerCarousel;
