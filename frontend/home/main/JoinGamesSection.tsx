'use client';

import React, { useState, useRef } from 'react';
import { MapPin, ChevronRight, Users, Info } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const sportsCategories = [
    'ALL SPORTS', 'BADMINTON', 'CRICKET', 'FOOTBALL', 'TENNIS', 'PICKLEBALL'
];

type GameStatus = 'OPEN' | 'STARTED' | 'SLOT FULL' | 'JOINED';

const gamesData = [
    {
        id: 1,
        sport: 'CRICKET',
        host: 'Sampad',
        timeRange: '8:00~9:00 pm',
        location: 'Malakpet, Hyderbad',
        distance: '2.1km Away',
        going: 2,
        capacity: 11,
        status: 'JOINED' as GameStatus,
        image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400&h=500&fit=crop&auto=format',
        bgColor: 'from-sky-400 to-blue-600',
    },
    {
        id: 2,
        sport: 'FOOTBALL',
        host: 'Sunny',
        timeRange: '8:00~9:00 pm',
        location: 'Malakpet, Hyderbad',
        distance: '3.6km Away',
        going: 6,
        capacity: 12,
        status: 'STARTED' as GameStatus,
        image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=500&fit=crop&auto=format',
        bgColor: 'from-yellow-400 to-orange-500',
    },
    {
        id: 3,
        sport: 'BADMINTON',
        host: 'Srikar',
        timeRange: '8:00~9:00 pm',
        location: 'Malakpet, Hyderbad',
        distance: '6km Away',
        going: 4,
        capacity: 4,
        status: 'SLOT FULL' as GameStatus,
        image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&h=500&fit=crop&auto=format',
        bgColor: 'from-green-300 to-emerald-500',
    },
    {
        id: 4,
        sport: 'CRICKET',
        host: 'Prince',
        timeRange: '8:00~9:00 pm',
        location: 'Malakpet, Hyderbad',
        distance: '9km Away',
        going: 2,
        capacity: 11,
        status: 'JOINED' as GameStatus,
        image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400&h=500&fit=crop&auto=format',
        bgColor: 'from-green-400 to-teal-600',
    },
    {
        id: 5,
        sport: 'TENNIS',
        host: 'Arjun',
        timeRange: '7:00~8:00 am',
        location: 'Banjara Hills, Hyd',
        distance: '4.2km Away',
        going: 2,
        capacity: 4,
        status: 'OPEN' as GameStatus,
        image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=500&fit=crop&auto=format',
        bgColor: 'from-purple-400 to-indigo-600',
    },
];

const statusConfig: Record<GameStatus, { label: string; className: string }> = {
    JOINED:    { label: 'Joined',    className: 'bg-white/20 text-white backdrop-blur-sm' },
    STARTED:   { label: 'Started',   className: 'bg-orange-400/90 text-white' },
    'SLOT FULL': { label: 'Slot Full', className: 'bg-white/20 text-white backdrop-blur-sm' },
    OPEN:      { label: 'Open',      className: 'bg-[#A1FF00]/90 text-black font-bold' },
};

const GameCard = ({ game }: { game: typeof gamesData[0] }) => {
    const cfg = statusConfig[game.status];
    const fillPct = Math.round((game.going / game.capacity) * 100);

    return (
        <motion.div
            whileHover={{ y: -6, transition: { duration: 0.25 } }}
            className="relative flex-shrink-0 w-[240px] md:w-[260px] rounded-[22px] overflow-hidden cursor-pointer group"
            style={{ aspectRatio: '3/4' }}
        >
            {/* Background Image */}
            <img
                src={game.image}
                alt={`${game.sport} by ${game.host}`}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                    // Fallback gradient if image fails
                    (e.target as HTMLImageElement).style.display = 'none';
                }}
            />

            {/* Gradient overlay: bottom half darkens for text readability */}
            <div className={cn(
                "absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"
            )} />

            {/* Top row: time badge + status */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                <span className="bg-[#A1FF00] text-black text-[10px] font-bold px-2.5 py-1 rounded-full">
                    {game.timeRange}
                </span>
                <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full', cfg.className)}>
                    {cfg.label}
                </span>
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                {/* Host + Sport */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-bold text-base leading-tight">{game.host}</span>
                    <span className="bg-white/15 backdrop-blur-sm text-white/80 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        {game.sport}
                    </span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-[#A1FF00]" />
                    <span className="text-white/70 text-[11px]">{game.location}</span>
                    <span className="text-[#A1FF00] text-[11px] font-bold ml-1">• {game.distance}</span>
                </div>

                {/* Progress bar */}
                <div className="pt-1">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-white/40 text-[10px] flex items-center gap-1">
                            <Users size={10} />
                            {game.going}/{game.capacity} Going
                        </span>
                        <span className="text-white/40 text-[10px]">{fillPct}%</span>
                    </div>
                    <div className="h-0.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#A1FF00] rounded-full transition-all duration-700"
                            style={{ width: `${fillPct}%` }}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const JoinGamesSection = () => {
    const [selectedSport, setSelectedSport] = useState('ALL SPORTS');
    const scrollRef = useRef<HTMLDivElement>(null);

    const filtered = gamesData.filter(
        g => selectedSport === 'ALL SPORTS' || g.sport === selectedSport
    );

    return (
        <section className="relative w-full bg-black py-12 md:py-20 overflow-hidden">
            <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <h2 className="text-3xl md:text-4xl font-bold text-white">
                                Join{' '}
                                <span className="text-[#A1FF00]">Games Near You</span>
                            </h2>
                            <Info className="w-4 h-4 text-white/30 flex-shrink-0" />
                        </div>
                        <p className="text-sm text-white/40">
                            No team? No problem. Find your people. Build your network. Play together.
                        </p>
                    </div>
                    <button className="group flex items-center gap-1.5 text-sm font-medium text-white/70 hover:text-white transition-colors whitespace-nowrap self-start md:self-auto mt-1">
                        View More Games
                        <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>

                {/* Sport filter pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
                    {sportsCategories.map((sport) => (
                        <button
                            key={sport}
                            onClick={() => setSelectedSport(sport)}
                            className={cn(
                                'whitespace-nowrap px-5 py-2 rounded-full text-xs font-bold border transition-all duration-300 tracking-widest',
                                selectedSport === sport
                                    ? 'bg-[#A1FF00] border-[#A1FF00] text-black shadow-[0_0_20px_rgba(161,255,0,0.25)]'
                                    : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/20'
                            )}
                        >
                            {sport}
                        </button>
                    ))}
                </div>

                {/* Horizontally scrollable cards */}
                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory"
                >
                    <AnimatePresence mode="popLayout">
                        {filtered.map((game) => (
                            <motion.div
                                key={game.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                                className="snap-start"
                            >
                                <GameCard game={game} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Scroll indicator dots */}
                <div className="flex items-center gap-1.5 mt-5 justify-start">
                    {filtered.map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                'h-0.5 rounded-full transition-all duration-300',
                                i === 0 ? 'w-6 bg-[#A1FF00]' : 'w-3 bg-white/20'
                            )}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default JoinGamesSection;
