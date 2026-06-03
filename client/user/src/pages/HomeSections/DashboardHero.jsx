/* eslint-disable react/prop-types */
import React from "react";
import { Link } from "react-router-dom";

export default function DashboardHero() {
  return (
    <div className="grid grid-cols-4 gap-3 md:gap-4 mb-2 w-full">
      {/* Leaderboard */}
      <Link
        to="/venues"
        className="relative rounded-[12px] overflow-visible force-overflow-visible flex items-center justify-center aspect-square cursor-pointer group hover:scale-[1.02] transition-all duration-300 shadow-xl border border-[#EBEBEB]/15"
        style={{
          background:
            "radial-gradient(circle at 80% 50%, #2087FF 0%, #0E49B5 45%, #031533 100%)",
          overflow: "visible",
        }}
      >
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[12px]" />
        <img
          src="/3d_map_location.svg"
          alt="Leaderboard Map Icon"
          className="w-[85%] h-[85%] object-contain pointer-events-none transform group-hover:scale-110 transition-all duration-300 z-10"
        />
      </Link>

      {/* Scoring */}
      <Link
        to="/my-teams"
        state={{ openStartScoringModal: true }}
        className="relative rounded-[12px] overflow-visible force-overflow-visible flex items-center justify-center aspect-square cursor-pointer group hover:scale-[1.02] transition-all duration-300 shadow-xl border border-[#EBEBEB]/15"
        style={{
          background:
            "radial-gradient(circle at 80% 50%, #FF9800 0%, #E65100 45%, #3E1700 100%)",
          overflow: "visible",
        }}
      >
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[12px]" />
        <img
          src="/3d_scoreboard_v2.png"
          alt="Scorer Icon"
          className="w-[85%] h-[85%] object-contain pointer-events-none transform group-hover:scale-110 transition-all duration-300 z-10"
        />
      </Link>

      {/* Host & Join Games */}
      <Link
        to="/join-games"
        className="relative rounded-[12px] overflow-visible force-overflow-visible flex items-center justify-center aspect-square cursor-pointer group hover:scale-[1.02] transition-all duration-300 shadow-xl border border-[#EBEBEB]/15"
        style={{
          background:
            "radial-gradient(circle at 80% 50%, #22C55E 0%, #15803D 45%, #032512 100%)",
          overflow: "visible",
        }}
      >
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[12px]" />
        <img
          src="/3d_whistle.svg"
          alt="Host & Join Games Whistle Icon"
          className="w-[85%] h-[85%] object-contain pointer-events-none transform group-hover:scale-110 transition-all duration-300 z-10"
        />
      </Link>

      {/* Pros */}
      <Link
        to="/professionals"
        className="relative rounded-[12px] overflow-visible force-overflow-visible flex items-center justify-center aspect-square cursor-pointer group hover:scale-[1.02] transition-all duration-300 shadow-xl border border-[#EBEBEB]/15"
        style={{
          background:
            "radial-gradient(circle at 80% 50%, #FFA2FF 0%, #A726E2 50%, #220038 100%)",
          overflow: "visible",
        }}
      >
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[12px]" />
        <img
          src="/3d_professional_v2.png"
          alt="Pros Icon"
          className="w-[85%] h-[85%] object-contain pointer-events-none transform group-hover:scale-110 transition-all duration-300 z-10"
        />
      </Link>
    </div>
  );
}

