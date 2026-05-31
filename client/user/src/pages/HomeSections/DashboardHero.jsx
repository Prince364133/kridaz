/* eslint-disable react/prop-types */
import React from "react";
import { Link } from "react-router-dom";

export default function DashboardHero() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 w-full">
      {/* Leaderboard */}
      <Link
        to="/leaderboard"
        className="relative rounded-[6px] px-3.5 py-2 overflow-visible force-overflow-visible flex flex-col justify-center h-[72px] cursor-pointer group hover:scale-[1.02] transition-all duration-300 shadow-xl border border-[#EBEBEB]/15"
        style={{
          background:
            "radial-gradient(circle at 80% 50%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 50%), radial-gradient(circle at 80% 50%, #2087FF 0%, #0E49B5 45%, #031533 100%)",
          overflow: "visible",
        }}
      >
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[6px]" />
        <span className="relative z-20 text-white font-bold text-xs sm:text-sm tracking-tight leading-tight max-w-[55%] font-open-sans">
          Leaderboard
        </span>
        <img
          src="/3d_map_location.svg"
          alt="Leaderboard Map Icon"
          className="absolute -right-2.5 -top-[16px] w-[98px] h-[98px] object-contain pointer-events-none transform group-hover:scale-105 group-hover:-translate-y-0.5 transition-all duration-300 z-10"
        />
      </Link>

      {/* Scoring */}
      <Link
        to="/my-teams"
        state={{ openStartScoringModal: true }}
        className="relative rounded-[6px] px-3.5 py-2 overflow-visible force-overflow-visible flex flex-col justify-center h-[72px] cursor-pointer group hover:scale-[1.02] transition-all duration-300 shadow-xl border border-[#EBEBEB]/15"
        style={{
          background:
            "radial-gradient(circle at 80% 50%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 50%), radial-gradient(circle at 80% 50%, #FF9800 0%, #E65100 45%, #3E1700 100%)",
          overflow: "visible",
        }}
      >
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[6px]" />
        <span className="relative z-20 text-white font-bold text-xs sm:text-sm tracking-tight leading-tight max-w-[55%] font-open-sans">
          Scoring
        </span>
        <img
          src="/3d_scoreboard_v2.png"
          alt="Scorer Icon"
          className="absolute -right-3 -top-[20px] w-[105px] h-[105px] object-contain pointer-events-none transform group-hover:scale-105 group-hover:-translate-y-0.5 transition-all duration-300 z-10"
        />
      </Link>

      {/* Host & Join Games */}
      <Link
        to="/join-games"
        className="relative rounded-[6px] px-3.5 py-2 overflow-visible force-overflow-visible flex flex-col justify-center h-[72px] cursor-pointer group hover:scale-[1.02] transition-all duration-300 shadow-xl border border-[#EBEBEB]/15"
        style={{
          background:
            "radial-gradient(circle at 80% 50%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 50%), radial-gradient(circle at 80% 50%, #22C55E 0%, #15803D 45%, #032512 100%)",
          overflow: "visible",
        }}
      >
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[6px]" />
        <span className="relative z-20 text-white font-bold text-xs sm:text-sm tracking-tight leading-tight max-w-[55%] font-open-sans">
          Host & Join Games
        </span>
        <img
          src="/3d_whistle.svg"
          alt="Host & Join Games Whistle Icon"
          className="absolute -right-2.5 -top-[14px] w-[98px] h-[98px] object-contain pointer-events-none transform group-hover:scale-105 group-hover:-translate-y-0.5 transition-all duration-300 z-10"
        />
      </Link>

      {/* Pros */}
      <Link
        to="/professionals"
        className="relative rounded-[6px] px-3.5 py-2 overflow-visible force-overflow-visible flex flex-col justify-center h-[72px] cursor-pointer group hover:scale-[1.02] transition-all duration-300 shadow-xl border border-[#EBEBEB]/15"
        style={{
          background:
            "radial-gradient(circle at 80% 50%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 50%), radial-gradient(circle at 80% 50%, #FFA2FF 0%, #A726E2 50%, #220038 100%)",
          overflow: "visible",
        }}
      >
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[6px]" />
        <span className="relative z-20 text-white font-bold text-xs sm:text-sm tracking-tight leading-tight max-w-[55%] font-open-sans">
          Pros
        </span>
        <img
          src="/3d_professional_v2.png"
          alt="Pros Icon"
          className="absolute -right-2 -top-[16px] w-[94px] h-[94px] object-contain pointer-events-none transform group-hover:scale-105 group-hover:-translate-y-0.5 transition-all duration-300 z-10"
        />
      </Link>
    </div>
  );
}

