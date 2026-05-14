import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axiosInstance from "../../hooks/useAxiosInstance";
import {
  Users, Trophy, MapPin, User, Calendar, ChevronLeft, Download,
  ShieldCheck, Share2, Zap, Copy, UserPlus, AlertOctagon,
  QrCode as QrIcon
} from "lucide-react";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

// ── Design tokens ──────────────────────────────────────────────────────────
const BG      = "#000000";
const CARD_BG = "#000000";
const BORDER  = "#2D2D2D";
const ACCENT  = "#CCFF00";
const MUTED   = "#878C9F";
const MUTED2  = "#999999";

const TeamPass = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useSelector(state => state.auth);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const { data } = await axiosInstance.get(`/api/team/${id}`);
        setTeam(data.team);
      } catch (err) {
        setError("Team invitation not found or has expired.");
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, [id]);

  const handleJoinTeam = async () => {
    if (!isLoggedIn) {
      localStorage.setItem("pendingTeamInvite", id);
      toast.info("Please login to join the team");
      navigate("/login");
      return;
    }

    setIsJoining(true);
    try {
      const response = await axiosInstance.post(`/api/team/join-request/${id}`);
      if (response.data.success) {
        toast.success("Join request sent successfully!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send join request");
    } finally {
      setIsJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BG }}>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2" style={{ borderColor: ACCENT }} />
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6" style={{ backgroundColor: BG }}>
        <p className="text-white font-semibold text-xl uppercase tracking-widest">{error || "Team not found"}</p>
        <Link to="/" className="px-8 py-3 rounded-[8px] text-[13px] font-normal uppercase tracking-widest transition-all" style={{ border: `1px solid ${BORDER}`, color: MUTED2 }}>Go Back Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 pt-6 px-4" style={{ backgroundColor: BG }}>
      <div className="mx-auto max-w-lg">
        <Link to="/" className="inline-flex items-center gap-2 mb-8 text-[12px] font-normal uppercase tracking-[0.2em] transition-all" style={{ color: MUTED2 }}>
          <ChevronLeft size={16} /> Back to Kridaz
        </Link>

        <div className="rounded-[8px] overflow-hidden relative" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
          <div className="absolute top-0 right-0 w-40 h-40 blur-[80px] pointer-events-none" style={{ backgroundColor: `${ACCENT}08` }} />

          {/* Header */}
          <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <div>
              <h3 className="text-xl font-black italic tracking-tighter" style={{ color: ACCENT }}>KRIDAZ</h3>
              <p className="text-[10px] font-normal uppercase tracking-[0.3em] mt-0.5" style={{ color: MUTED }}>Team Invitation · {id.slice(-8).toUpperCase()}</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-[6px]" style={{ backgroundColor: `${ACCENT}15`, border: `1px solid ${ACCENT}30` }}>
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ backgroundColor: ACCENT }} />
              <span className="text-[10px] font-normal uppercase tracking-widest" style={{ color: ACCENT }}>Open Invite</span>
            </div>
          </div>

          {/* Team Name */}
          <div className="px-6 py-8 flex items-center gap-6" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
              {team.logo ? (
                <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
              ) : (
                <Users size={32} style={{ color: ACCENT }} />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-black text-white uppercase tracking-tight leading-none mb-2">{team.name}</h1>
              <div className="flex items-center gap-2" style={{ color: MUTED2 }}>
                <Trophy size={13} style={{ color: ACCENT }} />
                <span className="text-[12px]">{team.sportType} · {team.members?.length || 0} Members</span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-px" style={{ backgroundColor: BORDER }}>
            {[
              { label: "Captain", icon: User, value: team.captainName || "N/A" },
              { label: "Location", icon: MapPin, value: team.city || "Various" },
              { label: "Created", icon: Calendar, value: format(parseISO(team.createdAt), "MMM yyyy") },
              { label: "Status", icon: ShieldCheck, value: team.visibility || "PUBLIC" },
            ].map(({ label, icon: Icon, value }) => (
              <div key={label} className="px-6 py-5" style={{ backgroundColor: CARD_BG }}>
                <p className="text-[10px] font-normal uppercase tracking-[0.3em] mb-2" style={{ color: MUTED }}>{label}</p>
                <div className="flex items-center gap-2">
                  <Icon size={14} style={{ color: ACCENT }} />
                  <span className="text-[13px] font-semibold text-white">{value}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Description */}
          {team.description && (
            <div className="px-6 py-6" style={{ borderTop: `1px solid ${BORDER}` }}>
              <p className="text-[10px] font-normal uppercase tracking-[0.3em] mb-2" style={{ color: MUTED }}>About Team</p>
              <p className="text-[13px] text-white/80 leading-relaxed italic">"{team.description}"</p>
            </div>
          )}

          {/* QR Code */}
          <div className="flex flex-col items-center gap-4 py-8" style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
            <div className="p-4 rounded-[8px]" style={{ backgroundColor: "#fff", boxShadow: `0 0 40px ${ACCENT}15` }}>
              {team.qrCode ? (
                <img src={team.qrCode} alt="Team QR" className="w-44 h-44" />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center bg-black/5">
                  <QrIcon size={48} className="text-black/20" />
                </div>
              )}
            </div>
            <div className="text-center px-6">
              <p className="text-[12px] font-semibold text-white uppercase tracking-[0.2em]">Scan to Join Team</p>
              <p className="text-[10px] mt-1" style={{ color: MUTED2 }}>Scan this pass to view team details and join the squad</p>
            </div>
          </div>

          {/* Action */}
          <div className="p-6 space-y-3">
            <button
              onClick={handleJoinTeam}
              disabled={isJoining}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-[8px] text-[14px] font-black uppercase tracking-[0.2em] transition-all"
              style={{ backgroundColor: ACCENT, color: "#000" }}
            >
              {isJoining ? "Processing..." : (
                <>
                  <UserPlus size={18} />
                  Join This Team
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 py-3 rounded-[8px] text-[12px] font-normal uppercase tracking-widest transition-all"
                style={{ border: `1px solid ${BORDER}`, color: MUTED2 }}
              >
                <Download size={14} /> Save Pass
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Invite link copied!");
                }}
                className="flex items-center justify-center gap-2 py-3 rounded-[8px] text-[12px] font-normal uppercase tracking-widest transition-all"
                style={{ border: `1px solid ${BORDER}`, color: MUTED2 }}
              >
                <Share2 size={14} /> Copy Link
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2" style={{ color: MUTED }}>
          <ShieldCheck size={14} />
          <span className="text-[10px] font-normal uppercase tracking-[0.3em]">Official Kridaz Team Invitation</span>
        </div>
      </div>
    </div>
  );
};

export default TeamPass;
