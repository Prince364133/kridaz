'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

const players = [
  {
    name: 'Alex Johnson',
    username: "@alexj",
    sport: 'Cricket',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
    text: "The easiest way to find a turf in my city. Love the rapid booking process!",
  },
  {
    name: 'Ben Carter',
    username: "@bencarter",
    sport: 'Football',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
    text: "Hosting my weekend games here is seamless. Great community and interface.",
  },
  {
    name: 'Chloe Davis',
    username: "@chloed",
    sport: 'Tennis',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
    text: "Found incredible hitting partners within a 5km radius. Game changer!",
  },
  {
    name: 'David Miller',
    username: "@millerd",
    sport: 'Basketball',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80',
    text: "Super clean interface. I can split payments with my team instantly.",
  },
  {
    name: 'Ella Garcia',
    username: "@ellag",
    sport: 'Cricket',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
    text: "The coaching options are fantastic! Really elevated my technique.",
  },
];

const PlayerReviewCard = ({ player }: { player: typeof players[0] }) => (
  <div className="w-[300px] flex-shrink-0 bg-[#111] border border-white/5 p-6 rounded-2xl flex flex-col gap-4">
    <div className="flex items-center gap-4">
      <div className="relative w-12 h-12 rounded-full overflow-hidden border border-[#A1FF00]/40">
        <Image
          src={player.avatar}
          alt={player.name}
          fill
          className="object-cover"
        />
      </div>
      <div>
        <h4 className="text-white text-sm font-black tracking-tight">{player.name}</h4>
        <p className="text-[#A1FF00] text-[10px] font-bold tracking-widest uppercase">{player.username}</p>
      </div>
    </div>
    <p className="text-white/60 text-xs leading-relaxed italic">"{player.text}"</p>
  </div>
);

const PlayersBanner = () => {
  return (
    <section className="w-full bg-black py-20 border-t border-white/5 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-16">
        
        {/* Left Side: Text */}
        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left">
          <h2 className="text-5xl md:text-7xl font-integral font-black uppercase tracking-tighter text-white leading-none">
            WHAT <br/>
            <span className="text-[#A1FF00]">PLAYERS</span> <br/>
            SAY
          </h2>
          <p className="text-white/50 font-bold text-[10px] uppercase tracking-widest mt-6 max-w-md">
            Join thousands of athletes who are leveling up their game with our platform.
          </p>
          <div className="flex items-center gap-4 mt-8">
            <button className="px-6 py-3 bg-[#A1FF00] text-black text-[10px] font-black tracking-widest uppercase rounded-xl hover:bg-white transition-colors">
              Read More
            </button>
            <button className="px-6 py-3 bg-transparent border border-white/20 text-white text-[10px] font-black tracking-widest uppercase rounded-xl hover:border-white transition-colors">
              Write Review
            </button>
          </div>
        </div>

        {/* Right Side: Autoscrolling Reviews */}
        <div className="flex-1 w-full relative overflow-hidden py-4">
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
          
          <div className="flex gap-4 animate-[scroll_20s_linear_infinite] hover:pause">
            {[...players, ...players, ...players].map((player, i) => (
              <PlayerReviewCard key={i} player={player} />
            ))}
          </div>
        </div>

      </div>

      <style jsx global>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .pause {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};

export default PlayersBanner;