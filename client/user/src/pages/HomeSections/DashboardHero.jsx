/* eslint-disable react/prop-types */
import React from "react";
import { Link } from "react-router-dom";

export default function DashboardHero() {
  return (
    <div className="flex overflow-x-auto gap-3 md:gap-4 mb-2 w-full pb-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {/* Leaderboard / Players Nearby */}
      <Link
        to="/players"
        className="flex-shrink-0 w-[85px] md:w-[100px] flex flex-col items-center gap-2 cursor-pointer group snap-start"
      >
        <div
          className="relative w-full rounded-[12px] overflow-visible force-overflow-visible flex items-center justify-center aspect-square transition-all duration-300 shadow-xl border border-[#EBEBEB]/15 group-hover:scale-[1.02]"
          style={{
            background:
              "radial-gradient(circle at 80% 50%, #2087FF 0%, #0E49B5 45%, #031533 100%)",
          }}
        >
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[12px]" />
          <img
            src="/3d_map_location.svg"
            alt="Leaderboard Map Icon"
            className="w-[85%] h-[85%] object-contain pointer-events-none transform group-hover:scale-110 transition-all duration-300 z-10"
          />
        </div>
        <div className="h-[28px] flex items-start justify-center">
          <span className="text-[9px] md:text-[11px] font-black text-white/70 uppercase tracking-wider text-center leading-tight group-hover:text-white transition-colors">
            Players Nearby
          </span>
        </div>
      </Link>

      {/* Scoring */}
      <Link
        to="/my-teams"
        state={{ openStartScoringModal: true }}
        className="flex-shrink-0 w-[85px] md:w-[100px] flex flex-col items-center gap-2 cursor-pointer group snap-start"
      >
        <div
          className="relative w-full rounded-[12px] overflow-visible force-overflow-visible flex items-center justify-center aspect-square transition-all duration-300 shadow-xl border border-[#EBEBEB]/15 group-hover:scale-[1.02]"
          style={{
            background:
              "radial-gradient(circle at 80% 50%, #FF9800 0%, #E65100 45%, #3E1700 100%)",
          }}
        >
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[12px]" />
          <img
            src="/3d_scoreboard_v2.png"
            alt="Scorer Icon"
            className="w-[85%] h-[85%] object-contain pointer-events-none transform group-hover:scale-110 transition-all duration-300 z-10"
          />
        </div>
        <div className="h-[28px] flex items-start justify-center">
          <span className="text-[9px] md:text-[11px] font-black text-white/70 uppercase tracking-wider text-center leading-tight group-hover:text-white transition-colors">
            Score Match
          </span>
        </div>
      </Link>

      {/* Host & Join Games */}
      <Link
        to="/join-games"
        className="flex-shrink-0 w-[85px] md:w-[100px] flex flex-col items-center gap-2 cursor-pointer group snap-start"
      >
        <div
          className="relative w-full rounded-[12px] overflow-visible force-overflow-visible flex items-center justify-center aspect-square transition-all duration-300 shadow-xl border border-[#EBEBEB]/15 group-hover:scale-[1.02]"
          style={{
            background:
              "radial-gradient(circle at 80% 50%, #22C55E 0%, #15803D 45%, #032512 100%)",
          }}
        >
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[12px]" />
          <img
            src="/3d_whistle.svg"
            alt="Host & Join Games Whistle Icon"
            className="w-[85%] h-[85%] object-contain pointer-events-none transform group-hover:scale-110 transition-all duration-300 z-10"
          />
        </div>
        <div className="h-[28px] flex items-start justify-center">
          <span className="text-[9px] md:text-[11px] font-black text-white/70 uppercase tracking-wider text-center leading-tight group-hover:text-white transition-colors">
            Join Game
          </span>
        </div>
      </Link>

      {/* Pros */}
      <Link
        to="/professionals"
        className="flex-shrink-0 w-[85px] md:w-[100px] flex flex-col items-center gap-2 cursor-pointer group snap-start"
      >
        <div
          className="relative w-full rounded-[12px] overflow-visible force-overflow-visible flex items-center justify-center aspect-square transition-all duration-300 shadow-xl border border-[#EBEBEB]/15 group-hover:scale-[1.02]"
          style={{
            background:
              "radial-gradient(circle at 80% 50%, #FFA2FF 0%, #A726E2 50%, #220038 100%)",
          }}
        >
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[12px]" />
          <img
            src="/3d_professional_v2.png"
            alt="Pros Icon"
            className="w-[85%] h-[85%] object-contain pointer-events-none transform group-hover:scale-110 transition-all duration-300 z-10"
          />
        </div>
        <div className="h-[28px] flex items-start justify-center">
          <span className="text-[9px] md:text-[11px] font-black text-white/70 uppercase tracking-wider text-center leading-tight group-hover:text-white transition-colors">
            Pro's
          </span>
        </div>
      </Link>
    </div>
  );
}

