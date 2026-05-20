import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowRight, Calendar, Star, Trophy, CheckCircle, Layout, ShieldCheck, X, User, Landmark, QrCode, Upload, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import ScrollToTop from "@components/common/ScrollToTop";

const GRADIENT = "linear-gradient(90deg, #55DEE8 0%, #BFF367 100%)";
const GRADIENT_START = "#55DEE8";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const PENDING_KEY = "scorer_application_pending";

/** Maps a role string to its dashboard path */
const ROLE_DASHBOARD = {
  coach:    "/coach",
  umpire:   "/umpire",
  scorer:   "/scorer",
  streamer: "/streamer",
};

const benefits = [
  { icon: Trophy, title: "Precision Scoring", desc: "Access professional scoring tools designed for real-time match tracking and analytics." },
  { icon: Calendar, title: "Join Any Match", desc: "Get invited to official tournaments and local matches that require certified scorers." },
  { icon: Layout, title: "Live Updates", desc: "Your scores power live dashboards and streaming tickers for fans everywhere." }
];

const BG = "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1800&q=80&auto=format&fit=crop";

// ─── DocUploadSlot ────────────────────────────────────────────────────────────
function DocUploadSlot({ side, preview, onFileChange, disabled, children }) {
  const inputRef = useRef(null);
  const handleClick = () => { if (!disabled) inputRef.current?.click(); };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        {preview
          ? <CheckCircle2 size={12} className="text-green-400 shrink-0" />
          : <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${disabled ? "border-white/20" : "border-white/50"}`} />
        }
        <span className={`text-[10px] font-bold uppercase tracking-widest ${disabled ? "text-white/30" : "text-white/60"}`}>
          {side} side
        </span>
        {preview && <span className="text-[9px] text-green-400 font-bold uppercase tracking-wider ml-auto">✓ Recorded</span>}
      </div>

      <div
        onClick={handleClick}
        className={`relative w-full h-[110px] md:h-[130px] rounded-[10px] overflow-hidden shadow-inner transition-all
          ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer group"}
          ${preview ? "ring-2 ring-[#55DEE8]" : "bg-[#D9D9D9]"}
        `}
      >
        {preview ? (
          <>
            <img src={preview} alt={`${side} side`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-[10px] font-bold uppercase tracking-wider">Change</span>
            </div>
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center z-10 backdrop-blur-sm gap-2">
              <Upload size={18} className="text-white" />
              <span className="text-white font-bold tracking-wider uppercase text-center text-[10px] md:text-xs">Upload {side} side</span>
              <span className="text-white/50 text-[9px]">Max 10 MB · JPG / PNG</span>
            </div>
            {children}
          </>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" disabled={disabled} onChange={onFileChange} />
    </div>
  );
}

// ─── ScorerLanding ────────────────────────────────────────────────────────────
export default function ScorerLanding() {
  const navigate = useNavigate();
  const { role } = useSelector((state) => state.auth);

  // 1. Auto-redirect if user already has a professional role
  useEffect(() => {
    if (!role) return;
    const key = role.toLowerCase();
    for (const [roleName, path] of Object.entries(ROLE_DASHBOARD)) {
      if (key.includes(roleName)) { navigate(path, { replace: true }); return; }
    }
  }, [role, navigate]);

  // 2. Pending state — persisted in localStorage
  const [isPending, setIsPending] = useState(() => localStorage.getItem(PENDING_KEY) === "true");
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [docs, setDocs]                 = useState({ aadhaar: { front: null, back: null }, pan: { front: null, back: null } });
  const [errors, setErrors]             = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allUploaded = docs.aadhaar.front && docs.aadhaar.back && docs.pan.front && docs.pan.back;

  const handleFile = useCallback((docKey, side) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const errKey = `${docKey}_${side}`;
    if (file.size > MAX_FILE_SIZE) { setErrors(p => ({ ...p, [errKey]: "File must be under 10 MB" })); e.target.value = ""; return; }
    if (!file.type.startsWith("image/")) { setErrors(p => ({ ...p, [errKey]: "Only image files are allowed" })); e.target.value = ""; return; }
    setErrors(p => { const n = { ...p }; delete n[errKey]; return n; });
    setDocs(p => ({ ...p, [docKey]: { ...p[docKey], [side]: URL.createObjectURL(file) } }));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!allUploaded) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      localStorage.setItem(PENDING_KEY, "true");
      setIsPending(true);
      setIsModalOpen(false);
    }, 1200);
  };

  const openModal  = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    if (!isPending) { setDocs({ aadhaar: { front: null, back: null }, pan: { front: null, back: null } }); setErrors({}); }
  };

  return (
    <div className="relative min-h-screen text-white pt-4 pb-20 overflow-hidden" style={{ backgroundColor: "#000" }}>
      <ScrollToTop />
      
      <svg width="0" height="0" className="absolute pointer-events-none">
        <defs>
          <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#55DEE8" />
            <stop offset="100%" stopColor="#BFF367" />
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${BG})` }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.68) 40%, rgba(0,0,0,0.90) 100%)" }} />
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: `radial-gradient(${GRADIENT_START} 1px, transparent 1px)`, backgroundSize: "36px 36px" }} />
      <div className="absolute -top-20 right-0 w-[600px] h-[400px] rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, rgba(85,222,232,0.10) 0%, transparent 70%)` }} />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center min-h-[80vh]">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] md:text-xs font-semibold mb-4 md:mb-6 uppercase tracking-widest" style={{ background: "rgba(85,222,232,0.08)", borderColor: "rgba(85,222,232,0.25)" }}>
              <span style={{ background: GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "'Inter'" }}>Certified Scorers</span>
            </div>
            <h1 className="text-[48px] md:text-[72px] leading-[1.1] uppercase mb-6 font-bold text-white" style={{ fontFamily: "'Open Sans'" }}>
              Track Every <br /><span style={{ background: GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Moment.</span>
            </h1>
            <p className="text-gray-400 mb-6 max-w-lg leading-relaxed text-sm md:text-base" style={{ fontFamily: "'Inter'" }}>
              Become the brain of the game. Kridaz provides advanced digital scoring consoles for official match scorers to track performance and power live broadcasts.
            </p>
            <button onClick={openModal} className="inline-flex items-center gap-3 font-bold text-black rounded-full px-8 py-4 hover:brightness-110 transition-all uppercase tracking-widest" style={{ background: GRADIENT }}>
              Join as a Scorer <ArrowRight size={20} />
            </button>
          </div>

          <div className="grid gap-4 md:gap-6">
            {benefits.map((b, i) => (
              <div key={i} className="flex gap-4 p-6 rounded-3xl border border-white/10 backdrop-blur-sm" style={{ background: "rgba(10,10,10,0.75)" }}>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 border" style={{ borderColor: "rgba(85,222,232,0.2)", backgroundColor: "rgba(85,222,232,0.08)" }}>
                  <b.icon size={24} stroke="url(#primaryGradient)" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl uppercase mb-1 md:mb-2 font-bold text-white" style={{ fontFamily: "'Open Sans'" }}>{b.title}</h3>
                  <p className="text-gray-400 leading-relaxed text-sm md:text-base" style={{ fontFamily: "'Inter'" }}>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-32 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-10 md:mb-12 uppercase tracking-tight" style={{ fontFamily: "'Open Sans'" }}>The Digital Scoring Edge</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { icon: ShieldCheck, title: "Expert Status",  desc: "Complete your profile and get verified to access professional scoring gigs." },
              { icon: Calendar,    title: "Accept Matches", desc: "Review match invitations and accept those that match your availability." },
              { icon: CheckCircle, title: "Power The Game", desc: "Launch the scoring console to track the match ball-by-ball with precision." },
            ].map((s, i) => (
              <div key={i} className="p-8 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 hover:border-[#55DEE8]/30 transition-colors group">
                <div className="flex items-center justify-center w-14 h-14 mx-auto mb-6 rounded-2xl bg-white/10 group-hover:bg-[#55DEE8]/20 transition-colors">
                  <s.icon className="w-7 h-7 text-white" stroke="currentColor" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3 uppercase tracking-wider" style={{ fontFamily: "'Open Sans'" }}>{s.title}</h3>
                <p className="text-gray-400 text-sm md:text-base leading-relaxed" style={{ fontFamily: "'Inter'" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Registration Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-[10px] p-6 md:p-8 w-full max-w-lg relative animate-fadeInUp max-h-[90vh] overflow-y-auto mt-16 md:mt-0">

            <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10">
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold mb-1 uppercase tracking-wider text-white text-center" style={{ fontFamily: "'Open Sans'" }}>
              {isPending ? "Application Submitted" : "Complete Your Application"}
            </h2>
            <p className="text-white/40 text-center text-[10px] mb-6 uppercase tracking-widest" style={{ fontFamily: "'Inter'" }}>
              {isPending ? "Our team is reviewing your documents" : "Upload front & back of each document · Max 10 MB per photo"}
            </p>

            {isPending ? (
              <div className="flex flex-col items-center justify-center py-10 gap-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(85,222,232,0.15), rgba(191,243,103,0.15))", border: "2px solid rgba(85,222,232,0.3)" }}>
                    <Clock size={36} className="text-[#55DEE8]" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#BFF367] flex items-center justify-center">
                    <ShieldCheck size={14} className="text-black" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-white font-bold uppercase tracking-widest text-sm">Application Pending</p>
                  <p className="text-white/40 text-xs leading-relaxed max-w-[280px] mx-auto" style={{ fontFamily: "'Inter'" }}>
                    Your Aadhaar &amp; PAN documents have been submitted. Our team will review them within <span className="text-[#55DEE8] font-bold">24–48 hours</span>.
                  </p>
                </div>
                <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                  {[
                    { label: "Documents Submitted", done: true },
                    { label: "Identity Verification", done: false },
                    { label: "Profile Activation",   done: false },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${step.done ? "bg-green-500" : "bg-white/10 border border-white/20"}`}>
                        {step.done && <CheckCircle2 size={12} className="text-white" />}
                      </div>
                      <span className={`text-xs font-bold uppercase tracking-wider ${step.done ? "text-white" : "text-white/30"}`}>{step.label}</span>
                    </div>
                  ))}
                </div>
                <button onClick={closeModal} className="w-full max-w-[200px] py-3 rounded-[10px] font-bold text-black uppercase tracking-widest hover:brightness-110 transition-all" style={{ background: GRADIENT }}>
                  Got it
                </button>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4 md:gap-6">
                  {/* ── AADHAAR ── */}
                  <div className="flex flex-col gap-3">
                    <span className="text-white font-black tracking-wider uppercase text-center text-sm md:text-base" style={{ fontFamily: "'Inter'" }}>AADHAAR CARD</span>
                    <DocUploadSlot side="Front" preview={docs.aadhaar.front} onFileChange={handleFile("aadhaar", "front")} disabled={false}>
                      <div className="flex justify-between items-start opacity-60 p-2">
                        <Landmark className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
                        <div className="space-y-1 flex flex-col items-end mt-0.5">
                          <div className="w-12 md:w-20 h-1.5 md:h-2 bg-gray-500 rounded-full" />
                          <div className="w-8 md:w-14 h-1.5 md:h-2 bg-gray-500 rounded-full" />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-1 opacity-60 px-2 pb-2">
                        <div className="w-10 h-12 md:w-12 md:h-14 bg-gray-400/30 rounded-[8px] overflow-hidden flex items-end justify-center border border-gray-400/20">
                          <User className="w-8 h-8 md:w-10 md:h-10 text-gray-600 -mb-1.5" fill="currentColor" />
                        </div>
                        <div className="flex-1 space-y-2 mt-0.5">
                          <div className="w-full h-2 md:h-2.5 bg-gray-500 rounded-full" />
                          <div className="w-5/6 h-2 md:h-2.5 bg-gray-500 rounded-full" />
                          <div className="w-4/6 h-2 md:h-2.5 bg-gray-500 rounded-full" />
                        </div>
                      </div>
                    </DocUploadSlot>
                    {errors.aadhaar_front && <p className="text-red-400 text-[9px] font-bold flex items-center gap-1"><AlertCircle size={10} />{errors.aadhaar_front}</p>}
                    {docs.aadhaar.front && !docs.aadhaar.back && <p className="text-[#55DEE8] text-[9px] font-bold uppercase tracking-wider text-center animate-pulse">✓ Front recorded — upload back side</p>}
                    <DocUploadSlot side="Back" preview={docs.aadhaar.back} onFileChange={handleFile("aadhaar", "back")} disabled={!docs.aadhaar.front}>
                      <div className="flex flex-col items-center justify-center h-full gap-2 opacity-40 p-3">
                        <div className="w-full h-2 bg-gray-500 rounded-full" />
                        <div className="w-5/6 h-2 bg-gray-500 rounded-full" />
                        <div className="w-4/6 h-2 bg-gray-500 rounded-full" />
                      </div>
                    </DocUploadSlot>
                    {errors.aadhaar_back && <p className="text-red-400 text-[9px] font-bold flex items-center gap-1"><AlertCircle size={10} />{errors.aadhaar_back}</p>}
                  </div>

                  {/* ── PAN CARD ── */}
                  <div className="flex flex-col gap-3">
                    <span className="text-white font-black tracking-wider uppercase text-center text-sm md:text-base" style={{ fontFamily: "'Inter'" }}>PAN CARD</span>
                    <DocUploadSlot side="Front" preview={docs.pan.front} onFileChange={handleFile("pan", "front")} disabled={false}>
                      <div className="w-full h-5 md:h-6 bg-gray-400/60 flex justify-between items-center px-2 md:px-3 opacity-60 shrink-0">
                        <div className="w-4 h-4 md:w-5 md:h-5 bg-gray-600 rounded-sm" />
                        <div className="w-12 md:w-20 h-1.5 md:h-2 bg-gray-600 rounded-full" />
                      </div>
                      <div className="p-2 md:p-3 flex-1 flex flex-col justify-between opacity-60">
                        <div className="flex gap-1.5 md:gap-2">
                          <div className="flex-1 space-y-1.5 mt-0.5">
                            <div className="flex gap-1">
                              <div className="w-6 md:w-10 h-1.5 md:h-2 bg-gray-500 rounded-full" />
                              <div className="w-8 md:w-14 h-1.5 md:h-2 bg-gray-500 rounded-full" />
                            </div>
                            <div className="w-8 md:w-14 h-1.5 md:h-2 bg-gray-500 rounded-full" />
                          </div>
                        </div>
                        <div className="flex justify-between items-end mt-1">
                          <span className="text-gray-600 font-bold tracking-widest font-mono text-[8px] md:text-[10px]">ABCDE1234F</span>
                          <QrCode className="w-6 h-6 md:w-8 md:h-8 text-gray-600" />
                        </div>
                      </div>
                    </DocUploadSlot>
                    {errors.pan_front && <p className="text-red-400 text-[9px] font-bold flex items-center gap-1"><AlertCircle size={10} />{errors.pan_front}</p>}
                    {docs.pan.front && !docs.pan.back && <p className="text-[#BFF367] text-[9px] font-bold uppercase tracking-wider text-center animate-pulse">✓ Front recorded — upload back side</p>}
                    <DocUploadSlot side="Back" preview={docs.pan.back} onFileChange={handleFile("pan", "back")} disabled={!docs.pan.front}>
                      <div className="flex flex-col items-center justify-center h-full gap-2 opacity-40 p-3">
                        <div className="w-full h-2 bg-gray-500 rounded-full" />
                        <div className="w-5/6 h-2 bg-gray-500 rounded-full" />
                        <div className="w-4/6 h-2 bg-gray-500 rounded-full" />
                      </div>
                    </DocUploadSlot>
                    {errors.pan_back && <p className="text-red-400 text-[9px] font-bold flex items-center gap-1"><AlertCircle size={10} />{errors.pan_back}</p>}
                  </div>
                </div>

                {/* Progress dots */}
                <div className="flex items-center justify-center gap-3 pt-1">
                  {[
                    { label: "Aadhaar Front", done: !!docs.aadhaar.front },
                    { label: "Aadhaar Back",  done: !!docs.aadhaar.back  },
                    { label: "PAN Front",     done: !!docs.pan.front     },
                    { label: "PAN Back",      done: !!docs.pan.back      },
                  ].map((s, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div className={`w-2 h-2 rounded-full transition-all duration-300 ${s.done ? "bg-green-400 scale-125" : "bg-white/20"}`} />
                      <span className="text-[7px] text-white/30 uppercase tracking-wide hidden sm:block">{s.label}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center">
                  <button type="submit" disabled={!allUploaded || isSubmitting} className="w-full max-w-[240px] py-3 rounded-[10px] font-bold text-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2" style={{ background: GRADIENT, fontFamily: "'Inter'" }}>
                    {isSubmitting
                      ? <span className="animate-spin w-4 h-4 border-2 border-black/30 border-t-black rounded-full" />
                      : "Submit Documents"
                    }
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
