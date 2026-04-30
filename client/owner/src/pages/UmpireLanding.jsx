import { ArrowRight, Calendar, Star, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

const PRI = "#F59E0B"; // Amber for officials

const benefits = [
  { icon: Trophy, title: "Find Tournaments", desc: "Get notified about local tournaments and matches that need certified officials." },
  { icon: Calendar, title: "Flexible Schedule", desc: "Manage your availability and accept matches that fit your timeline." },
  { icon: Star, title: "Build Reputation", desc: "Earn ratings from players and organizers to unlock higher-tier match opportunities." }
];

export default function UmpireLanding() {
  return (
    <div className="min-h-screen text-white pt-32 pb-20" style={{ backgroundColor: "#000" }}>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: `radial-gradient(${PRI} 1px, transparent 1px)`, backgroundSize: "36px 36px" }} />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold mb-6 uppercase tracking-widest"
              style={{ background: "rgba(132,204,22,0.08)", borderColor: "rgba(132,204,22,0.25)", color: PRI }}>
              Certified Umpires
            </div>
            <h1 className="font-display text-5xl md:text-7xl leading-none uppercase mb-6">
              Officiate & <br /><span style={{ color: PRI }}>Earn.</span>
            </h1>
            <p className="text-gray-400 text-lg mb-8 max-w-lg">
              Turn your expertise into income. BookMySportz connects certified umpires and referees with local tournaments and leagues looking for professional officiating.
            </p>
            <Link to="/signup?role=umpire" className="inline-flex items-center gap-3 font-bold text-black rounded-full px-8 py-4 hover:brightness-110 transition-all uppercase tracking-widest" style={{ backgroundColor: PRI }}>
              Join as an Umpire <ArrowRight size={20} />
            </Link>
          </div>

          <div className="grid gap-6">
            {benefits.map((b, i) => (
              <div key={i} className="flex gap-4 p-6 rounded-3xl border border-white/10 bg-[#111]">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border" style={{ borderColor: "rgba(132,204,22,0.2)", backgroundColor: "rgba(132,204,22,0.05)" }}>
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
      </div>
    </div>
  );
}
