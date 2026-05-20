import React from "react";
import { Link, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const currentYear = new Date().getFullYear();

  const regions = [
    {
      name: "HYDERABAD",
      links: [
        "Cricket in Hyderabad",
        "Football or Box Cricket in Hyderabad",
        "Badminton in Hyderabad",
        "Cricket Nets in Hyderabad",
        "Swimming in Hyderabad",
        "Pickleball in Hyderabad"
      ]
    }
  ];

  return (
    <footer className={`bg-black text-white relative overflow-hidden border-t border-white/5 pt-8 pb-12 font-sans ${!isHomePage ? 'hidden md:block' : ''}`}>
      {/* ΓöÇΓöÇ AMBIENT DECOR ΓöÇΓöÇ */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#55DEE8]/5 blur-[150px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#55DEE8]/5 blur-[150px] pointer-events-none rounded-full" />
      
      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        
        {/* ΓöÇΓöÇ TOP SECTION: BRANDING & REGIONAL LINKS ΓöÇΓöÇ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-24">
          
          {/* Branding Column */}
          <div className="lg:col-span-5 space-y-8">
            <Link to="/" className="group flex items-center gap-6">
              <div className="flex items-center justify-center">
                <img src="/logo.png" alt="Kridaz" className="h-10 lg:h-12 w-auto brightness-125" />
              </div>
            </Link>
            <p className="text-white/60 text-sm leading-relaxed font-sans max-w-lg">
              The premier platform for sports booking and venue management. 
              Engineering the next generation of sports accessibility and facility technology.
            </p>
            
            <div className="flex gap-4 pt-4">
              {[Facebook, Linkedin, Instagram].map((Icon, i) => (
                <Link key={i} to="#" className="w-10 h-10 rounded-sm border border-white/10 flex items-center justify-center text-white/30 hover:text-[#55DEE8] hover:border-[#55DEE8]/30 transition-all hover:-translate-y-1">
                  <Icon size={18} />
                </Link>
              ))}
            </div>
          </div>

          {/* Hyderabad Links Column */}
          <div className="lg:col-span-7">
            <div className="space-y-6">
              <h3 className="text-xl font-black tracking-wider text-white uppercase border-b border-white/10 pb-2 inline-block">
                HYDERABAD
              </h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                {regions[0].links.map((link, idx) => (
                  <React.Fragment key={link}>
                    <Link 
                      to="/turfs" 
                      className="text-[11px] font-bold text-white/40 hover:text-white transition-all uppercase tracking-wider hover:translate-x-1"
                    >
                      {link}
                    </Link>
                    {idx < regions[0].links.length - 1 && (
                      <span className="w-1 h-1 bg-[#55DEE8]/20 rounded-full" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* ΓöÇΓöÇ SUPPORT & CONTACT ΓöÇΓöÇ */}
        <div className="mb-24 border-t border-white/5 pt-16">
          <h4 className="text-sm font-bold text-white uppercase mb-8">Support & Contact</h4>
          <div className="flex flex-wrap gap-x-16 gap-y-8 items-start">

            {/* Nav Links */}
            {[
              { name: "Contact Us", path: "#" },
              { name: "FAQ", path: "#" },
              { name: "Terms of Service", path: "/terms-of-service" },
              { name: "Privacy Policy", path: "/privacy-policy" },
              { name: "Data Deletion Instructions", path: "/data-deletion-instructions" },
            ].map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="text-white/60 hover:text-white transition-colors text-sm font-medium"
              >
                {link.name}
              </Link>
            ))}

            {/* Divider */}
            <div className="w-px h-5 bg-white/10 self-center hidden sm:block" />

            {/* Email */}
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-[#55DEE8]/60 shrink-0" />
              <span className="text-sm text-white/80">contact@kridaz.com</span>
            </div>

            {/* Office */}
            <div className="flex items-center gap-2">
              <Globe size={14} className="text-[#55DEE8]/60 shrink-0" />
              <span className="text-sm text-white/80">Hyderabad, TS, India</span>
            </div>

            {/* Divider */}
            <div className="w-px h-5 bg-white/10 self-center hidden sm:block" />

            {/* Venue Owner CTA */}
            <Link
              to="/venue-owners"
              className="flex items-center gap-2 text-sm font-bold text-[#84CC16] hover:text-[#55DEE8] transition-colors group"
            >
              <Building2 size={15} className="group-hover:text-[#55DEE8] transition-colors" />
              Register as Venue Owner
              <ArrowUpRight size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>

          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <p className="text-xs text-white/40">
            &copy; {currentYear} Kridaz. All rights reserved.
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

