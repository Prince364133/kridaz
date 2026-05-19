import { useState } from "react";
import { ArrowRight, Video, Youtube, Globe, CheckCircle, Smartphone, X, User, Landmark, QrCode } from "lucide-react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import ScrollToTop from "@components/common/ScrollToTop";

const GRADIENT = "linear-gradient(90deg, #55DEE8 0%, #BFF367 100%)";
const GRADIENT_START = "#55DEE8";

const benefits = [
  { icon: Globe, title: "Reach Global Audience", desc: "Broadcast local matches to viewers everywhere and grow your following." },
  { icon: Youtube, title: "Monetize Streams", desc: "Get booked by tournament organizers and earn per match streamed." },
  { icon: Smartphone, title: "Build Your Brand", desc: "Showcase your setup, quality, and commentary skills to get more gigs." }
];

const BG = "https://images.unsplash.com/photo-1598550473361-b5182ba860d5?w=1800&q=80&auto=format&fit=crop";

export default function StreamerLanding() {
  const { isLoggedIn, role, user } = useSelector((state) => state.auth);
  const userRole = (role || user?.role || "").toLowerCase();
  const isStreamer = userRole === "streamer";
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="relative min-h-screen text-white pt-4 pb-20 overflow-hidden" style={{ backgroundColor: "#000" }}>
      <ScrollToTop />
      
      {/* ── Gradient Definition for Icons ── */}
      <svg width="0" height="0" className="absolute pointer-events-none">
        <defs>
          <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#55DEE8" />
            <stop offset="100%" stopColor="#BFF367" />
          </linearGradient>
        </defs>
      </svg>

      {/* ── Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${BG})` }}
      />
      {/* ── Dark overlay */}
      <div className="absolute inset-0"
        style={{ background: "linear-gradient(160deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.68) 40%, rgba(0,0,0,0.90) 100%)" }}
      />
      {/* ── Accent dot grid */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: `radial-gradient(${GRADIENT_START} 1px, transparent 1px)`, backgroundSize: "36px 36px" }}
      />
      {/* ── Glow blob */}
      <div className="absolute -top-20 right-0 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, rgba(85,222,232,0.15) 0%, transparent 70%)` }}
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* ── Hero Section */}
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center min-h-[80vh]">
          <div>
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] md:text-xs font-semibold mb-4 md:mb-6 uppercase tracking-widest"
              style={{ background: "rgba(85,222,232,0.08)", borderColor: "rgba(85,222,232,0.25)" }}
            >
              <span style={{ background: GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "'Inter'" }}>Professional Streamers</span>
            </div>
            <h1 className="text-[48px] md:text-[72px] leading-[1.1] uppercase mb-6 font-bold text-white" style={{ fontFamily: "'Open Sans'" }}>
              Stream & <br /><span style={{ background: GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Earn.</span>
            </h1>
            <p className="text-gray-400 mb-6 max-w-lg leading-relaxed text-sm md:text-base" style={{ fontFamily: "'Inter'" }}>
              Bring local sports to the world. Kridaz connects professional live streamers with organizers who want their matches broadcasted.
            </p>
            {isStreamer ? (
              <Link
                to="/streamer"
                className="inline-flex items-center gap-3 font-bold text-black rounded-full px-8 py-4 hover:brightness-110 transition-all uppercase tracking-widest shadow-[0_0_20px_rgba(85,222,232,0.3)]"
                style={{ background: GRADIENT }}
              >
                Go to Dashboard <ArrowRight size={20} />
              </Link>
            ) : (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-3 font-bold text-black rounded-full px-8 py-4 hover:brightness-110 transition-all uppercase tracking-widest shadow-[0_0_20px_rgba(85,222,232,0.3)]"
                style={{ background: GRADIENT }}
              >
                Join as a Streamer <ArrowRight size={20} />
              </button>
            )}
          </div>

          <div className="grid gap-4 md:gap-6">
            {benefits.map((b, i) => (
              <div
                key={i}
                className="flex gap-4 p-6 rounded-3xl border border-white/10 backdrop-blur-sm"
                style={{ background: "rgba(10,10,10,0.75)" }}
              >
                <div
                  className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 border"
                  style={{ borderColor: "rgba(85,222,232,0.2)", backgroundColor: "rgba(85,222,232,0.08)" }}
                >
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

        {/* ── How It Works */}
        <div className="mt-32 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-10 md:mb-12 uppercase tracking-tight" style={{ fontFamily: "'Open Sans'" }}>Your Streaming Career</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="p-8 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 hover:border-[#55DEE8]/30 transition-colors group">
              <div className="flex items-center justify-center w-14 h-14 mx-auto mb-6 rounded-2xl bg-white/10 group-hover:bg-[#55DEE8]/20 transition-colors">
                <Video className="w-7 h-7 text-white transition-colors" stroke="currentColor" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3 uppercase tracking-wider" style={{ fontFamily: "'Open Sans'" }}>Setup & Quality</h3>
              <p className="text-gray-400 text-sm md:text-base leading-relaxed" style={{ fontFamily: "'Inter'" }}>List your equipment, streaming platforms, and broadcast quality capabilities.</p>
            </div>
            <div className="p-8 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 hover:border-[#55DEE8]/30 transition-colors group">
              <div className="flex items-center justify-center w-14 h-14 mx-auto mb-6 rounded-2xl bg-white/10 group-hover:bg-[#55DEE8]/20 transition-colors">
                <CheckCircle className="w-7 h-7 text-white transition-colors" stroke="currentColor" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3 uppercase tracking-wider" style={{ fontFamily: "'Open Sans'" }}>Get Booked</h3>
              <p className="text-gray-400 text-sm md:text-base leading-relaxed" style={{ fontFamily: "'Inter'" }}>Organizers will book you for their tournaments. Manage your schedule in one place.</p>
            </div>
            <div className="p-8 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 hover:border-[#55DEE8]/30 transition-colors group">
              <div className="flex items-center justify-center w-14 h-14 mx-auto mb-6 rounded-2xl bg-white/10 group-hover:bg-[#55DEE8]/20 transition-colors">
                <Globe className="w-7 h-7 text-white transition-colors" stroke="currentColor" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3 uppercase tracking-wider" style={{ fontFamily: "'Open Sans'" }}>Go Live</h3>
              <p className="text-gray-400 text-sm md:text-base leading-relaxed" style={{ fontFamily: "'Inter'" }}>Stream the matches and get paid securely through the Kridaz platform.</p>
            </div>
          </div>
        </div>

      </div>

      {/* ── Registration Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-[10px] p-6 md:p-8 w-full max-w-lg relative animate-fadeInUp">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold mb-8 uppercase tracking-wider text-white text-center" style={{ fontFamily: "'Open Sans'" }}>Complete Your Application</h2>
            
            <form className="space-y-6 mt-4" onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); alert("Application submitted successfully!"); }}>
              
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                {/* Aadhaar Upload Box Skeleton */}
                <label className="flex flex-col items-center gap-3 md:gap-4 cursor-pointer group">
                  <span className="text-white font-black tracking-wider uppercase text-center text-sm md:text-base" style={{ fontFamily: "'Inter'" }}>AADHAAR CARD</span>
                  <div className="relative w-full h-[110px] md:h-[130px] bg-[#D9D9D9] rounded-[10px] p-2 md:p-3 overflow-hidden shadow-inner flex flex-col justify-between group-hover:ring-2 group-hover:ring-[#55DEE8] transition-all">
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                      <span className="text-white font-bold tracking-wider uppercase text-center text-[10px] md:text-xs" style={{ fontFamily: "'Inter'" }}>Upload Aadhaar</span>
                    </div>

                    {/* Content */}
                    <div className="flex justify-between items-start opacity-60">
                      <Landmark className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
                      <div className="space-y-1 md:space-y-1.5 flex flex-col items-end mt-0.5">
                        <div className="w-12 md:w-20 h-1.5 md:h-2 bg-gray-500 rounded-full"></div>
                        <div className="w-8 md:w-14 h-1.5 md:h-2 bg-gray-500 rounded-full"></div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 md:gap-3 mt-1 opacity-60">
                      <div className="w-10 h-12 md:w-12 md:h-14 bg-gray-400/30 rounded-[8px] overflow-hidden flex items-end justify-center border border-gray-400/20">
                        <User className="w-8 h-8 md:w-10 md:h-10 text-gray-600 -mb-1.5" fill="currentColor" />
                      </div>
                      <div className="flex-1 space-y-2 md:space-y-2.5 mt-0.5 md:mt-1">
                        <div className="w-full h-2 md:h-2.5 bg-gray-500 rounded-full"></div>
                        <div className="w-5/6 h-2 md:h-2.5 bg-gray-500 rounded-full"></div>
                        <div className="w-4/6 h-2 md:h-2.5 bg-gray-500 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  <input type="file" accept="image/*" className="hidden" required />
                </label>

                {/* PAN Upload Box Skeleton */}
                <label className="flex flex-col items-center gap-3 md:gap-4 cursor-pointer group">
                  <span className="text-white font-black tracking-wider uppercase text-center text-sm md:text-base" style={{ fontFamily: "'Inter'" }}>PAN CARD</span>
                  <div className="relative w-full h-[110px] md:h-[130px] bg-[#D9D9D9] rounded-[10px] overflow-hidden shadow-inner flex flex-col justify-between group-hover:ring-2 group-hover:ring-[#BFF367] transition-all">
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                      <span className="text-white font-bold tracking-wider uppercase text-center text-[10px] md:text-xs" style={{ fontFamily: "'Inter'" }}>Upload PAN</span>
                    </div>

                    {/* Top Stripe */}
                    <div className="w-full h-5 md:h-6 bg-gray-400/60 flex justify-between items-center px-2 md:px-3 opacity-60 shrink-0">
                      <div className="w-4 h-4 md:w-5 md:h-5 bg-gray-600 rounded-sm"></div>
                      <div className="w-12 md:w-20 h-1.5 md:h-2 bg-gray-600 rounded-full"></div>
                    </div>
                    
                    <div className="p-2 md:p-3 flex-1 flex flex-col justify-between opacity-60">
                      <div className="flex gap-1.5 md:gap-2">
                        <div className="flex-1 space-y-1.5 md:space-y-2 mt-0.5">
                          <div className="flex gap-1">
                            <div className="w-6 md:w-10 h-1.5 md:h-2 bg-gray-500 rounded-full"></div>
                            <div className="w-8 md:w-14 h-1.5 md:h-2 bg-gray-500 rounded-full"></div>
                          </div>
                          <div className="flex gap-1">
                            <div className="w-10 md:w-16 h-1.5 md:h-2 bg-gray-500 rounded-full"></div>
                            <div className="w-4 md:w-8 h-1.5 md:h-2 bg-gray-500 rounded-full"></div>
                          </div>
                          <div className="w-8 md:w-14 h-1.5 md:h-2 bg-gray-500 rounded-full"></div>
                        </div>
                        <div className="w-10 md:w-14 space-y-1 md:space-y-1.5 mt-0.5">
                           <div className="w-full h-1 md:h-1.5 bg-gray-500 rounded-full"></div>
                           <div className="w-3/4 h-1 md:h-1.5 bg-gray-500 rounded-full"></div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-end mt-1">
                        <span className="text-gray-600 font-bold tracking-widest font-mono text-[8px] md:text-[10px]">ABCDE1234F</span>
                        <QrCode className="w-6 h-6 md:w-8 md:h-8 text-gray-600" />
                      </div>
                    </div>
                  </div>
                  <input type="file" accept="image/*" className="hidden" required />
                </label>
              </div>

              <div className="flex justify-center mt-6">
                <button 
                  type="submit" 
                  className="w-full max-w-[240px] py-3 rounded-[10px] font-bold text-black uppercase tracking-widest hover:brightness-110 transition-all"
                  style={{ background: GRADIENT, fontFamily: "'Inter'" }}
                >
                  Submit Documents
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    
    </div>
  );
}
