import React from "react";
import { Link } from "react-router-dom";
import { 
  Facebook, 
  Linkedin, 
  Instagram, 
  Mail, 
  MapPin, 
  MessageCircle, 
  ShieldCheck, 
  Activity, 
  Globe, 
  Cpu,
  ArrowUpRight,
  Smartphone,
  Zap
} from "lucide-react";

const UserFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black text-white relative overflow-hidden border-t border-white/5 pt-24 pb-12 font-sans">
      {/* ── AMBIENT DECOR ── */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#84CC16]/5 blur-[150px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#84CC16]/5 blur-[150px] pointer-events-none rounded-full" />
      
      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        
        {/* ── TOP BRANDING SECTION ── */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-20">
          <div className="space-y-8 max-w-2xl">
            <Link to="/" className="group flex items-center gap-6">
              <div className="flex items-center justify-center">
                <img src="/logo.png" alt="TurfSpot" className="h-10 lg:h-12 w-auto brightness-125" />
              </div>
              <div className="border-l-2 border-[#84CC16]/30 pl-6 h-12 flex flex-col justify-center">
                <span className="block text-[10px] font-mono font-black text-[#84CC16] tracking-[0.4em] uppercase leading-none mb-2 opacity-80">Operational_Hub</span>
                <span className="block text-2xl font-display-heavy text-white tracking-[0.15em] leading-none uppercase">TurfSpot</span>
              </div>
            </Link>
            <p className="text-white/40 text-sm leading-relaxed font-sans max-w-lg uppercase tracking-wider">
              The premier command center for athlete-venue synchronization. 
              Engineering the next generation of sports accessibility and high-performance facility management.
            </p>
          </div>
          
          <div className="flex flex-col items-start lg:items-end gap-4">
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-sm notched-corner">
              <Activity size={14} className="text-[#84CC16] animate-pulse" />
              <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-white/60 uppercase">System_Status: Operational</span>
            </div>
            <div className="flex gap-4">
              {[Facebook, Linkedin, Instagram].map((Icon, i) => (
                <Link key={i} to="#" className="w-10 h-10 rounded-sm border border-white/10 flex items-center justify-center text-white/30 hover:text-[#84CC16] hover:border-[#84CC16]/30 transition-all hover:-translate-y-1">
                  <Icon size={18} />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── LINKS GRID ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-24 border-t border-white/5 pt-16">
          
          {/* Platforms */}
          <div className="space-y-8">
            <h4 className="text-[10px] font-mono font-black text-[#84CC16] tracking-[0.4em] uppercase">Platforms</h4>
            <ul className="space-y-4">
              {[
                { name: "User Arena", path: "/" },
                { name: "Partner Portal", path: "http://localhost:5174" },
                { name: "Admin Command", path: "http://localhost:5174/admin" },
                { name: "Coach Access", path: "http://localhost:5174/coach-landing" }
              ].map((link) => (
                <li key={link.name}>
                  <a href={link.path} className="text-white/30 hover:text-white transition-colors text-[11px] font-mono font-bold uppercase tracking-widest flex items-center gap-2 group">
                    <span className="w-1 h-1 bg-[#84CC16] opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Ecosystem */}
          <div className="space-y-8">
            <h4 className="text-[10px] font-mono font-black text-[#84CC16] tracking-[0.4em] uppercase">Ecosystem</h4>
            <ul className="space-y-4">
              {[
                { name: "Mission Logs", path: "#" },
                { name: "Arena Network", path: "/turfs" },
                { name: "Intel (Blogs)", path: "#" },
                { name: "Partners Gateway", path: "/partners" }
              ].map((link) => (
                <li key={link.name}>
                  <Link to={link.path} className="text-white/30 hover:text-white transition-colors text-[11px] font-mono font-bold uppercase tracking-widest flex items-center gap-2 group">
                    <span className="w-1 h-1 bg-[#84CC16] opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-8">
            <h4 className="text-[10px] font-mono font-black text-[#84CC16] tracking-[0.4em] uppercase">Support</h4>
            <ul className="space-y-4">
              {["Comm_Link", "FAQ_DB", "Terms_Protocol", "Privacy_Shield"].map((link) => (
                <li key={link}>
                  <Link to="#" className="text-white/30 hover:text-white transition-colors text-[11px] font-mono font-bold uppercase tracking-widest flex items-center gap-2 group">
                    <span className="w-1 h-1 bg-[#84CC16] opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 space-y-8 lg:pl-12 border-l border-white/5">
            <h4 className="text-[10px] font-mono font-black text-[#84CC16] tracking-[0.4em] uppercase">Direct Uplink</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-[#84CC16]/50" />
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Email_Support</span>
                </div>
                <p className="text-sm font-display-heavy text-white tracking-widest uppercase">contact@bookmysportz.com</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Globe size={16} className="text-[#84CC16]/50" />
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Base_Operations</span>
                </div>
                <p className="text-sm font-display-heavy text-white tracking-widest uppercase leading-relaxed">Hyderabad, TS // India_Node</p>
              </div>
            </div>
            
            <Link to="/partners" className="btn-bms-outline w-full h-14 flex items-center justify-center gap-3 group">
              <Building2 size={16} className="group-hover:text-[#84CC16] transition-colors" />
              <span className="text-[11px] font-mono font-black tracking-[0.2em]">ENLIST YOUR FACILITY</span>
              <ArrowUpRight size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* ── BOTTOM TELEMETRY BAR ── */}
        <div className="border-t border-white/5 pt-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <Cpu size={14} className="text-white/20" />
              <span className="text-[9px] font-mono text-white/20 uppercase tracking-[0.3em]">Core_v1.0.4</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck size={14} className="text-white/20" />
              <span className="text-[9px] font-mono text-white/20 uppercase tracking-[0.3em]">Encrypted_Link</span>
            </div>
          </div>

          <p className="text-[9px] font-mono text-white/20 tracking-[0.4em] uppercase text-center md:text-right">
            &copy; {currentYear} BookMySportz // Engineered for Elite Performance
          </p>
        </div>
      </div>
    </footer>
  );
};

const Building2 = ({ size, className }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
    <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
    <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
    <path d="M10 6h4" />
    <path d="M10 10h4" />
    <path d="M10 14h4" />
    <path d="M10 18h4" />
  </svg>
);

export default UserFooter;

