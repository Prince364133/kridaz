/* eslint-disable react/prop-types */
import React from "react";
import { Link } from "react-router-dom";
import { Users, MapPin, Check, ChevronRight } from "lucide-react";

const GRAD = "linear-gradient(90deg, #BFF367 0%, #BFF367 100%)";
const BDR = "#2A2A2A";

export default function PlayersSection({
  loading,
  players,
  followingIds,
  handleFollowToggle,
}) {
  return (
    <section className="py-6 mb-6 w-full">
      <div className="w-full">
        {/* Refined Section Header */}
        <div className="relative flex flex-row items-center justify-between gap-4 mb-6 border-b border-white/5 pb-4">
          <div className="relative">
            <div
              className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-12 rounded-full shadow-[0_0_20px_rgba(85,222,232,0.4)] hidden md:block"
              style={{ background: GRAD }}
            ></div>
            <h2
              className="text-[18px] md:text-[30px] font-black text-white uppercase tracking-tighter leading-none"
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
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="shrink-0 w-[200px] md:w-[240px] rounded-[8px] border border-white/5 animate-pulse bg-white/5"
                style={{ height: 300 }}
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
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {players.slice(0, 10).map((p) => {
              const initials =
                p.name
                  ?.split(" ")
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) || "??";
              const isFollowing = followingIds.includes(p.id || p._id);
              const formatLoc = (loc) => {
                if (!loc) return "Nearby Player";
                const pts = loc.split(",").map((s) => s.trim());
                return pts.length >= 3
                  ? `${pts[0]}, ${pts[pts.length - 2]}, ${pts[pts.length - 1]}`
                  : loc;
              };

              return (
                <div
                  key={p.id || p._id}
                  className="shrink-0 w-[200px] md:w-[240px] group"
                >
                  <div className="relative rounded-[8px] p-[1px] bg-white/5 transition-all duration-500 group-hover:bg-gradient-to-r group-hover:from-[#BFF367] group-hover:to-[#BFF367] group-hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)]">
                    {/* Profile Image */}
                    <div className="relative bg-[#121212] rounded-[8px] p-2.5 h-full">
                      <Link
                        to={`/profile/${p.id || p._id}`}
                        className="relative aspect-[1/1.1] rounded-[8px] overflow-hidden block mb-4"
                      >
                        <div className="absolute top-2 right-2 z-20 px-1.5 py-0.5 bg-gradient-to-r from-[#BFF367] to-[#BFF367] rounded border border-black/20 text-[8px] font-black text-black uppercase tracking-widest shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                          {p.preferredSport || "ATHLETE"}
                        </div>
                        <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center">
                          {p.profilePicture || p.profileImage ? (
                            <img
                              src={p.profilePicture || p.profileImage}
                              alt={p.name}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextElementSibling.style.display =
                                  "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className="relative z-10 flex items-center justify-center w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]"
                            style={{
                              display:
                                p.profilePicture || p.profileImage
                                  ? "none"
                                  : "flex",
                            }}
                          >
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#BFF367] to-[#BFF367] font-black text-5xl tracking-tighter opacity-40 group-hover:opacity-80 transition-opacity duration-500">
                              {initials}
                            </span>
                          </div>
                        </div>
                      </Link>

                      {/* Content Section */}
                      <div className="px-2 pb-1.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Link to={`/profile/${p.id || p._id}`}>
                            <h3 className="text-white font-bold text-[15px] tracking-tight group-hover:text-[#BFF367] transition-colors line-clamp-1 font-open-sans">
                              {p.name || "Anonymous"}
                            </h3>
                          </Link>
                          <div className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] shrink-0">
                            <Check
                              size={8}
                              strokeWidth={4}
                              className="text-white"
                            />
                          </div>
                        </div>

                        <p className="text-[#BFF367] text-[10px] font-medium leading-tight mb-4 flex items-center gap-1.5 w-full">
                          <MapPin size={10} className="text-white shrink-0" />
                          <span className="truncate">
                            {p.distance
                              ? `${(p.distance / 1000).toFixed(1)} km Away`
                              : formatLoc(p.city)}
                          </span>
                        </p>

                        {/* Bottom Bar */}
                        <div className="w-full">
                          <button
                            onClick={(e) => handleFollowToggle(e, p)}
                            className={`w-full py-1.5 rounded-[6px] font-black text-[9px] uppercase tracking-wider transition-all duration-300 ${
                              isFollowing
                                ? "bg-white/5 border border-white/10 text-white/30 hover:bg-white/10"
                                : "bg-white text-black hover:bg-white/90 shadow-lg"
                            }`}
                          >
                            {isFollowing ? "Following" : "Follow +"}
                          </button>
                        </div>
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

