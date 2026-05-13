import { ArrowRight, Calendar, Star, Trophy, CheckCircle, Layout, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import ScrollToTop from "@components/common/ScrollToTop";

const PRI = "#10B981"; // Emerald for scorers

const benefits = [
  { icon: Trophy, title: "Precision Scoring", desc: "Access professional scoring tools designed for real-time match tracking and analytics." },
  { icon: Calendar, title: "Join Any Match", desc: "Get invited to official tournaments and local matches that require certified scorers." },
  { icon: Layout, title: "Live Updates", desc: "Your scores power live dashboards and streaming tickers for fans everywhere." }
];

const BG = "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1800&q=80&auto=format&fit=crop";

export default function ScorerLanding() {
  const { isLoggedIn, role, user } = useSelector((state) => state.auth);
  const userRole = (role || user?.role || "").toLowerCase();
  const isScorer = ["scorer", "limited_scorer"].includes(userRole);

  return (
    <div className="relative min-h-screen text-white pt-4 pb-20 overflow-hidden" style={{ backgroundColor: "#000" }}>
      <ScrollToTop />
      
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
        style={{ backgroundImage: `radial-gradient(${PRI} 1px, transparent 1px)`, backgroundSize: "36px 36px" }}
      />
      {/* ── Emerald glow blob */}
      <div className="absolute -top-20 right-0 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%)` }}
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* ── Hero Section */}
        <div className="grid md:grid-cols-2 gap-16 items-center min-h-[80vh]">
          <div>
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold mb-6 uppercase tracking-widest"
              style={{ background: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.25)", color: PRI }}
            >
              Certified Scorers
            </div>
            <h1 className="font-display text-5xl md:text-7xl leading-none uppercase mb-6">
              Track Every <br /><span style={{ color: PRI }}>Moment.</span>
            </h1>
            <p className="text-gray-400 text-lg mb-8 max-w-lg">
              Become the brain of the game. Kridaz provides advanced digital scoring consoles for official match scorers to track performance and power live broadcasts.
            </p>
            {isScorer ? (
              <Link
                to="/scorer"
                className="inline-flex items-center gap-3 font-bold text-black rounded-full px-8 py-4 hover:brightness-110 transition-all uppercase tracking-widest"
                style={{ backgroundColor: PRI }}
              >
                Go to Dashboard <ArrowRight size={20} />
              </Link>
            ) : (
              <Link
                to="/business/register?role=scorer"
                className="inline-flex items-center gap-3 font-bold text-black rounded-full px-8 py-4 hover:brightness-110 transition-all uppercase tracking-widest"
                style={{ backgroundColor: PRI }}
              >
                Join as a Scorer <ArrowRight size={20} />
              </Link>
            )}
          </div>

          <div className="grid gap-6">
            {benefits.map((b, i) => (
              <div
                key={i}
                className="flex gap-4 p-6 rounded-3xl border border-white/10 backdrop-blur-sm"
                style={{ background: "rgba(10,10,10,0.75)" }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border"
                  style={{ borderColor: "rgba(16,185,129,0.2)", backgroundColor: "rgba(16,185,129,0.08)" }}
                >
                  <b.icon size={24} style={{ color: PRI }} />
                </div>
                <div>
                  <h3 className="font-display text-2xl uppercase mb-2">{b.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── How It Works */}
        <div className="mt-32 text-center">
          <h2 className="font-display text-4xl md:text-5xl font-black text-white mb-12 uppercase tracking-tight">The Digital Scoring Edge</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="p-8 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 hover:border-emerald-500/30 transition-colors group">
              <div className="flex items-center justify-center w-14 h-14 mx-auto mb-6 rounded-2xl bg-white/10 group-hover:bg-emerald-500/20 transition-colors">
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 uppercase tracking-wider">Expert Status</h3>
              <p className="text-gray-400">Complete your profile and get verified to access professional scoring gigs.</p>
            </div>
            <div className="p-8 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 hover:border-emerald-500/30 transition-colors group">
              <div className="flex items-center justify-center w-14 h-14 mx-auto mb-6 rounded-2xl bg-white/10 group-hover:bg-emerald-500/20 transition-colors">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 uppercase tracking-wider">Accept Matches</h3>
              <p className="text-gray-400">Review match invitations and accept those that match your availability.</p>
            </div>
            <div className="p-8 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 hover:border-emerald-500/30 transition-colors group">
              <div className="flex items-center justify-center w-14 h-14 mx-auto mb-6 rounded-2xl bg-white/10 group-hover:bg-emerald-500/20 transition-colors">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 uppercase tracking-wider">Power The Game</h3>
              <p className="text-gray-400">Launch the scoring console to track the match ball-by-ball with precision.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
