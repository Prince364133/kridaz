'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Star, ShieldCheck, ChevronRight } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const sports = ['ALL SPORTS', 'CRICKET', 'BADMINTON', 'FOOTBALL', 'TENNIS', 'PICKLEBALL'];

const coaches = [
  {
    id: 1,
    name: 'VIKRAM RATHOUR',
    rating: 4.9,
    reviews: 174,
    experience: '12+ Years',
    specialty: 'Batting Consultant',
    price: '₹1,200/hr',
    sport: 'CRICKET',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
  },
  {
    id: 2,
    name: 'SANIA MIRZA',
    rating: 4.8,
    reviews: 38,
    experience: '8 Years',
    specialty: 'Advanced Drills',
    price: '₹800/hr',
    sport: 'TENNIS',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
  },
  {
    id: 3,
    name: 'ROGER FEDERER',
    rating: 5.0,
    reviews: 506,
    experience: '20+ Years',
    specialty: 'Grand Slam Expert',
    price: '₹5,000/hr',
    sport: 'TENNIS',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
  },
  {
    id: 4,
    name: 'RAHUL DRAVID',
    rating: 4.9,
    reviews: 820,
    experience: '15 Years',
    specialty: 'Technique Coach',
    price: '₹1,800/hr',
    sport: 'CRICKET',
    image: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&q=80',
  },
];

const umpires = [
  {
    id: 1,
    name: 'MARTIN MENON',
    rating: 5.0,
    reviews: 210,
    experience: '15 Years',
    specialty: 'ICC Elite Panel',
    price: '₹2,500/match',
    sport: 'CRICKET',
    image: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&q=80',
  },
  {
    id: 2,
    name: 'MARK CLATTENBURG',
    rating: 4.7,
    reviews: 143,
    experience: '10 Years',
    specialty: 'FIFA Certified',
    price: '₹1,500/game',
    sport: 'FOOTBALL',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80',
  },
];

type Mode = 'coaches' | 'umpires';

interface Pro {
  id: number;
  name: string;
  rating: number;
  reviews: number;
  experience: string;
  specialty: string;
  price: string;
  sport: string;
  image: string;
}

const ProCard = ({ pro }: { pro: Pro }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ duration: 0.3 }}
    className="flex-shrink-0 w-[220px] relative rounded-2xl overflow-hidden bg-[#111] border border-white/5 
               hover:border-[#A1FF00]/30 transition-all group cursor-pointer h-[400px]"
  >
    {/* Full-bleed image */}
    <div className="absolute inset-0">
      <Image src={pro.image} alt={pro.name} fill className="object-cover object-top" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
    </div>

    {/* Top badges */}
    <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10">
      <span className="px-2.5 py-1 bg-[#A1FF00] text-black text-[9px] font-black tracking-widest rounded-lg">PRO</span>
      <ShieldCheck size={18} className="text-[#A1FF00]" />
    </div>

    {/* Bottom content */}
    <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
      {/* Rating */}
      <div className="flex items-center gap-1 mb-1">
        <Star size={10} className="fill-[#A1FF00] text-[#A1FF00]" />
        <span className="text-[9px] text-[#A1FF00] font-bold">{pro.rating}</span>
        <span className="text-[9px] text-white/30 font-medium">({pro.reviews} reviews)</span>
      </div>

      {/* Name */}
      <h4 className="font-integral text-lg text-white uppercase tracking-tighter leading-none mb-3">{pro.name}</h4>

      {/* Details */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-2 mb-3">
        <div>
          <p className="text-[8px] text-white/30 font-black tracking-widest uppercase mb-0.5">EXPERIENCE</p>
          <p className="text-[10px] text-white font-bold">{pro.experience}</p>
        </div>
        <div>
          <p className="text-[8px] text-white/30 font-black tracking-widest uppercase mb-0.5">SPECIALTY</p>
          <p className="text-[10px] text-white font-bold">{pro.specialty}</p>
        </div>
      </div>

      {/* Price + Book */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[8px] text-white/30 font-black tracking-widest uppercase">STARTING FROM</p>
          <p className="text-xs font-black text-white">{pro.price}</p>
        </div>
        <button className="px-4 py-2 bg-white text-black text-[9px] font-black tracking-widest rounded-xl hover:bg-[#A1FF00] transition-colors">
          BOOK NOW
        </button>
      </div>
    </div>
  </motion.div>
);

const ViewAllCard = ({ label }: { label: string }) => (
  <div className="flex-shrink-0 w-[160px] flex flex-col items-center justify-center bg-[#0A0A0A] border border-white/5 rounded-2xl gap-3 cursor-pointer hover:border-[#A1FF00]/30 transition-all group h-[400px]">
    <div className="w-12 h-12 rounded-full border-2 border-[#A1FF00] flex items-center justify-center group-hover:bg-[#A1FF00]/10 transition-colors">
      <ChevronRight size={20} className="text-[#A1FF00]" />
    </div>
    <p className="text-[10px] font-black text-white/60 tracking-widest uppercase text-center px-4">{label}</p>
  </div>
);

const FindProsSection = () => {
  const [mode, setMode] = useState<Mode>('coaches');
  const [selectedSport, setSelectedSport] = useState('ALL SPORTS');

  const currentData = mode === 'coaches' ? coaches : umpires;
  const filtered = selectedSport === 'ALL SPORTS'
    ? currentData
    : currentData.filter(p => p.sport === selectedSport);

  return (
    <section className="w-full bg-black py-16 md:py-20 border-t border-white/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-6">
          <div>
            <h2 className="font-integral text-3xl md:text-5xl text-white uppercase tracking-tighter leading-none">
              FIND <span className="text-[#A1FF00]">PROS</span>
            </h2>
            <p className="text-[10px] font-bold text-white/30 tracking-widest uppercase mt-2 mb-5">
              Book certified experts for your next session
            </p>
            {/* Mode Toggles */}
            <div className="flex items-center gap-3">
              {(['coaches', 'umpires'] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    'px-5 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase border transition-all',
                    mode === m
                      ? 'bg-transparent border-white text-white'
                      : 'bg-transparent border-white/10 text-white/40 hover:border-white/30'
                  )}
                >
                  FIND {m.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Sport Filters */}
          <div className="flex flex-wrap gap-3 lg:justify-end">
            {sports.map((sport) => (
              <button
                key={sport}
                onClick={() => setSelectedSport(sport)}
                className={cn(
                  'text-[10px] font-black tracking-widest uppercase transition-colors',
                  selectedSport === sport
                    ? 'px-4 py-2 bg-[#A1FF00] text-black rounded-xl shadow-[0_0_20px_rgba(161,255,0,0.3)]'
                    : 'text-white/40 hover:text-white'
                )}
              >
                {sport}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-[1px] w-full bg-white/5 mb-10" />

        {/* Horizontal Cards Row */}
        <div className="flex gap-5 overflow-x-auto pb-4 no-scrollbar">
          <AnimatePresence mode="popLayout">
            {filtered.map((pro) => (
              <ProCard key={`${mode}-${pro.id}`} pro={pro} />
            ))}
          </AnimatePresence>
          <ViewAllCard label={mode === 'coaches' ? 'VIEW ALL COACHES' : 'VIEW ALL UMPIRES'} />
        </div>
      </div>
    </section>
  );
};

export default FindProsSection;
