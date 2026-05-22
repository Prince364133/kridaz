import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Rocket, Clock, CheckCircle2, Sparkles } from "lucide-react";

const ComingSoon = () => {
  const location = useLocation();
  const [mounted, setMounted] = useState(false);
  const [counter, setCounter] = useState(0);

  // Retrieve waitlist info passed via navigation state
  const { waitlistNumber, role, name } = location.state || {};

  const roleConfig = {
    coach: {
      label: "Coach",
      accent: "#3B82F6",
      accentLight: "text-blue-400",
      accentBg: "bg-blue-500/10",
      accentBorder: "border-blue-500/20",
      description: "The Coach module will give you powerful tools to manage sessions, connect with players, and build your coaching brand.",
    },
    umpire: {
      label: "Official",
      accent: "#55DEE8",
      accentLight: "text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367]",
      accentBg: "bg-gradient-to-r from-[#55DEE8]/10 to-[#BFF367]/10",
      accentBorder: "border-[#55DEE8]/20",
      description: "The Officials module will match you with events, manage your schedule, and help you build a verified track record.",
    },
  };

  const config = roleConfig[role] || roleConfig.coach;

  useEffect(() => {
    setMounted(true);
    // Animate the waitlist number counting up
    if (waitlistNumber) {
      let start = 0;
      const end = parseInt(waitlistNumber);
      const duration = 1500;
      const step = Math.ceil(end / (duration / 16));
      const timer = setInterval(() => {
        start += step;
        if (start >= end) {
          setCounter(end);
          clearInterval(timer);
        } else {
          setCounter(start);
        }
      }, 16);
      return () => clearInterval(timer);
    }
  }, [waitlistNumber]);

  return (
    <div className="min-h-screen bg-[#000] relative overflow-hidden flex flex-col items-center justify-start pt-4 px-6 font-sans">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/95 to-black" />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] blur-[180px] rounded-full pointer-events-none opacity-20"
          style={{ backgroundColor: config.accent }}
        />
      </div>

      <div className={`relative z-10 max-w-2xl w-full text-center transition-all duration-1000 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>

        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center"
            style={{ backgroundColor: `${config.accent}15`, border: `1px solid ${config.accent}30` }}
          >
            <Rocket size={40} style={{ color: config.accent }} />
          </div>
        </div>

        {/* Success pill */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-white/[0.02] mb-6"
          style={{ borderColor: `${config.accent}30` }}>
          <CheckCircle2 size={14} style={{ color: config.accent }} />
          <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: config.accent }}>
            Registration Successful
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-6xl md:text-8xl font-bold text-white uppercase tracking-tight leading-[0.9] mb-4">
          WE'RE<br />
          <span style={{ color: config.accent }}>LAUNCHING</span>
          <br />SOON.
        </h1>

        <p className="text-white/40 text-sm uppercase tracking-widest max-w-md mx-auto leading-relaxed mt-6 mb-12">
          {name && <span className="text-white/60">Welcome, {name}. </span>}
          {config.description}
        </p>

        {/* Waitlist Card */}
        {waitlistNumber && (
          <div
            className="relative rounded-3xl p-8 mb-12 overflow-hidden"
            style={{ backgroundColor: `${config.accent}08`, border: `1px solid ${config.accent}20` }}
          >
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${config.accent}40, transparent)` }} />
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} style={{ color: config.accent }} />
                <span className="text-xs font-bold uppercase tracking-widest text-white/30">Your Waitlist Position</span>
                <Sparkles size={14} style={{ color: config.accent }} />
              </div>
              <div className="text-8xl font-black" style={{ color: config.accent }}>
                #{counter || waitlistNumber}
              </div>
              <p className="text-xs text-white/30 uppercase tracking-widest mt-2">
                Out of all registered {config.label.toLowerCase()}s
              </p>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          {[
            { step: "01", label: "Registered", status: "done" },
            { step: "02", label: "Under Review", status: "next" },
            { step: "03", label: "Early Access", status: "pending" },
          ].map((item) => (
            <div key={item.step} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black"
                style={item.status === "done"
                  ? { backgroundColor: `${config.accent}20`, color: config.accent }
                  : { backgroundColor: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.2)" }}
              >
                {item.status === "done" ? "✓" : item.step}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${item.status === "done" ? "" : "text-white/20"}`}
                style={item.status === "done" ? { color: config.accent } : {}}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all group"
            style={{ backgroundColor: config.accent, color: "#000" }}
          >
            Go to Portal Login
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/"
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold uppercase tracking-wider text-sm text-white/30 hover:text-white border border-white/10 hover:border-white/30 transition-all"
          >
            <Clock size={16} />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
