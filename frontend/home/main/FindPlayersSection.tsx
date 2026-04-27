'use client';

import React, { useState } from 'react';
import { MapPin, Search, Filter, UserPlus } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { motion } from 'framer-motion';

const RANK_COLORS: Record<string, string> = {
  PRO: 'bg-yellow-400 text-black',
  INTERMEDIATE: 'bg-[#A1FF00] text-black',
  BEGINNER: 'bg-blue-400 text-black',
};

const playersData = [
  {
    id: 1,
    name: 'RAHUL KHANNA',
    distance: '2.5 KM AWAY',
    rank: 'INTERMEDIATE',
    sports: ['CRICKET', 'FOOTBALL'],
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
  },
  {
    id: 2,
    name: 'SANYA MIRZA',
    distance: '3.8 KM AWAY',
    rank: 'PRO',
    sports: ['TENNIS', 'BADMINTON'],
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
  },
  {
    id: 3,
    name: 'ARJUN DAS',
    distance: '1.2 KM AWAY',
    rank: 'BEGINNER',
    sports: ['FOOTBALL', 'TABLE TENNIS'],
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80',
  },
  {
    id: 4,
    name: 'PRIYA RAO',
    distance: '5.0 KM AWAY',
    rank: 'INTERMEDIATE',
    sports: ['CRICKET', 'BASKETBALL'],
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
  },
  {
    id: 5,
    name: 'VIKRAM SINGH',
    distance: '4.1 KM AWAY',
    rank: 'PRO',
    sports: ['CRICKET', 'FOOTBALL'],
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
  },
];

const PlayerCard = ({ player }: { player: typeof playersData[0] }) => (
  <motion.div
    whileHover={{ y: -6 }}
    transition={{ duration: 0.25 }}
    className="flex-shrink-0 w-[240px] bg-[#111] border border-white/5 rounded-2xl p-5 flex flex-col gap-4 hover:border-[#A1FF00]/30 transition-colors"
  >
    {/* Avatar + Name */}
    <div className="flex items-center gap-3">
      <div className="relative">
        <img
          src={player.avatar}
          alt={player.name}
          className="w-14 h-14 rounded-xl object-cover"
        />
        <span className={cn(
          'absolute -top-2 -right-2 text-[8px] font-black px-1.5 py-0.5 rounded-md tracking-widest uppercase',
          RANK_COLORS[player.rank]
        )}>
          {player.rank === 'INTERMEDIATE' ? 'MED' : player.rank}
        </span>
      </div>
      <div>
        <h4 className="text-xs font-black text-white tracking-tight">{player.name}</h4>
        <div className="flex items-center gap-1 mt-1">
          <MapPin size={9} className="text-[#A1FF00]" />
          <span className="text-[9px] text-[#A1FF00] font-bold tracking-widest">{player.distance}</span>
        </div>
      </div>
    </div>

    {/* Sports Tags */}
    <div className="flex flex-wrap gap-1.5">
      {player.sports.map(sport => (
        <span key={sport} className="text-[9px] font-bold text-white/50 tracking-widest uppercase">
          {sport}
        </span>
      ))}
    </div>

    {/* Invite Button */}
    <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#A1FF00]/40 text-[#A1FF00] text-[10px] font-black tracking-widest hover:bg-[#A1FF00] hover:text-black transition-all">
      <UserPlus size={12} />
      INVITE TO PLAY
    </button>
  </motion.div>
);

const FindPlayersSection = () => {
  const [location] = useState('KARNATAKA');
  const [city] = useState('BENGALURU');
  const [radius] = useState('5 KM RADIUS');

  return (
    <section className="w-full bg-black py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
          <div>
            <h2 className="font-integral text-3xl md:text-5xl text-white uppercase tracking-tighter leading-none">
              FIND PLAYERS <span className="text-[#A1FF00]">NEAR YOU</span>
            </h2>
            <p className="text-[10px] font-bold text-white/30 tracking-widest uppercase mt-2">
              Connect with athletes in your neighborhood
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl">
              <MapPin size={12} className="text-[#A1FF00]" />
              <span className="text-[10px] font-bold text-white/70 tracking-widest">{location}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl">
              <Search size={12} className="text-white/40" />
              <span className="text-[10px] font-bold text-white/70 tracking-widest">{city}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl">
              <Filter size={12} className="text-white/40" />
              <span className="text-[10px] font-bold text-white/70 tracking-widest">{radius}</span>
            </div>
            <button className="px-6 py-2.5 bg-[#A1FF00] text-black text-[10px] font-black tracking-widest rounded-xl hover:bg-white transition-colors">
              SEARCH
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-[1px] w-full bg-white/5 mb-10" />

        {/* Horizontal Scrollable Player Cards */}
        <div className="flex gap-5 overflow-x-auto pb-4 no-scrollbar">
          {playersData.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FindPlayersSection;
