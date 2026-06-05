/* eslint-disable react/prop-types */
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, MapPin, Check, MessageCircle } from "lucide-react";
import useLoginOnDemand from "@hooks/useLoginOnDemand";

const GRAD = "linear-gradient(90deg, #BFF367 0%, #BFF367 100%)";
const BDR = "#2A2A2A";

export default function PlayersSection({
  loading,
  players,
  followingIds = [],
  handleFollowToggle,
}) {
  const navigate = useNavigate();
  const { gateInteraction } = useLoginOnDemand();

  return (
    <section className="mb-8 w-full">
      <div className="w-full">
        {/* Refined Section Header */}
        <div className="relative flex flex-row items-center justify-between gap-4 mb-6">
          <div className="relative">
            <h2
              className="text-[18px] md:text-[25px] font-black text-white tracking-tighter leading-none"
              style={{ fontFamily: "'Open Sans', sans-serif" }}
            >
              Find Players{" "}
              <span
                style={{
                  background: GRAD,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Near You
              </span>
            </h2>
          </div>
          <Link
            to="/players"
            className="flex items-center gap-1 font-semibold text-[10px] md:text-[15px] transition-all hover:text-[#BFF367] text-[#888] whitespace-nowrap"
          >
            View More <span className="hidden md:inline">Players</span>
          </Link>
        </div>

        {/* Player cards — 10 in one scrollable row */}
        {loading ? (
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="shrink-0 w-[145px] sm:w-[165px] md:w-[185px] snap-start rounded-[16px] border border-white/5 animate-pulse bg-white/5"
                style={{ height: 260 }}
              />
            ))}
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-12" style={{ color: "#888" }}>
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-display text-2xl">No Players Yet</p>
            <p className="text-sm mt-1">
              Be the first to join the community!
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 mt-4 font-bold text-black px-6 py-2.5 rounded-full"
              style={{ background: "linear-gradient(90deg, #BFF367 0%, #BFF367 100%)" }}
            >
              Join Now
            </Link>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2">
            {players.slice(0, 10).map((p) => {
              const playerId = p.id || p._id;
              const isFollowing = followingIds.includes(playerId);
              const initials =
                p.name
                  ?.split(" ")
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) || "??";

              const city = p.city ? p.city.split(",")[0].trim() : "Nearby";
              const country = p.country || "India";
              const locationText = `${city}, ${country}`;
              const primarySport = p.preferredSport || (p.sportTypes && p.sportTypes[0]) || (p.interests && p.interests[0]) || "Athlete";

              return (
                <div
                  key={playerId}
                  className="shrink-0 w-[145px] sm:w-[165px] md:w-[185px] snap-start group"
                >
                  <div className="relative rounded-[16px] p-[1px] bg-white/5 transition-all duration-500 group-hover:bg-gradient-to-b group-hover:from-[#BFF367]/30 group-hover:to-transparent group-hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)] h-full">
                    <div className="relative bg-[#121212] rounded-[15px] p-3 flex flex-col items-center text-center h-full">
                      {/* Circular Profile Image Container */}
                      <Link
                        to={`/profile/${playerId}`}
                        className="relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden mb-3 border-2 border-white/10 group-hover:border-[#BFF367] transition-all duration-300 shadow-inner block"
                      >
                        <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center">
                          {p.profilePicture || p.profileImage ? (
                            <img
                              src={p.profilePicture || p.profileImage}
                              alt={p.name}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextElementSibling.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className="relative z-10 flex items-center justify-center w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]"
                            style={{
                              display: p.profilePicture || p.profileImage ? "none" : "flex",
                            }}
                          >
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#BFF367] to-[#BFF367] font-black text-xl md:text-2xl tracking-tighter opacity-70 group-hover:opacity-100 transition-opacity duration-500">
                              {initials}
                            </span>
                          </div>
                        </div>
                      </Link>

                      {/* Player Name */}
                      <Link to={`/profile/${playerId}`} className="w-full">
                        <h3 className="text-white font-bold text-xs md:text-sm tracking-tight group-hover:text-[#BFF367] transition-colors line-clamp-1 mb-1 font-open-sans">
                          {p.name || "Anonymous"}
                        </h3>
                      </Link>

                      {/* Location: City and Country */}
                      <p className="text-[#888] text-[9px] md:text-[10px] font-medium line-clamp-1 mb-2">
                        {locationText}
                      </p>

                      {/* Primary Sport badge */}
                      <div className="mb-3">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-[#BFF367]/10 text-[#BFF367] text-[8px] md:text-[9px] font-black uppercase tracking-wider border border-[#BFF367]/20">
                          {primarySport}
                        </span>
                      </div>

                      {/* Follow / Message Row */}
                      <div className="w-full mt-auto flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleFollowToggle(playerId);
                          }}
                          className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 text-center ${
                            isFollowing
                              ? "text-white bg-white/5 border border-white/10 hover:bg-white/10"
                              : "text-black bg-[#BFF367] hover:bg-[#BFF367]/90 shadow-sm"
                          }`}
                        >
                          {isFollowing ? "Following" : "Follow"}
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            gateInteraction(() => navigate(`/messages?userId=${playerId}`));
                          }}
                          className="w-8 h-8 rounded-lg text-white bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center shrink-0"
                          title="Message"
                        >
                          <MessageCircle size={12} className="shrink-0" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}


      </div>
    </section>
  );
}

