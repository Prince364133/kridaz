import { CheckCircle, BarChart3, CalendarDays, Zap, Play } from "lucide-react";
import { Link } from "react-router-dom";
import ScrollToTop from "@components/common/ScrollToTop";

const benefits = [
  { icon: CalendarDays, title: "Automated Bookings", desc: "No more phone calls. Let players book your turf 24/7." },
  { icon: BarChart3, title: "Revenue Tracking", desc: "Real-time insights into your earnings, peak hours, and customer retention metrics." },
  { icon: CheckCircle, title: "Seamless Management", desc: "Block maintenance hours, set dynamic pricing, and manage your team with ease." }
];

export default function VenueOwnerLanding() {
  return (
    <div className="relative min-h-screen text-white bg-[#121414] font-inter overflow-hidden">
      <ScrollToTop />
      
      {/* ── Hero Section ── */}
      <section className="relative pt-24 pb-32 overflow-hidden bg-black">
        {/* Atmospheric Glow Background */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none"
             style={{ backgroundColor: "rgba(191,243,103,0.06)" }}></div>
             
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-left max-w-5xl">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#BFF367]/30 bg-[#BFF367]/10 rounded-full mb-8">
              <span className="text-[#BFF367] text-[10px] uppercase tracking-widest font-black">For Venue Owners & Partners</span>
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-[80px] leading-[1.05] font-black uppercase tracking-tight mb-8">
              <span className="text-white">Grow Your Venue.</span><br/>
              <span className="text-[#BFF367]">Maximize Every Slot.</span>
            </h1>

            {/* Paragraph */}
            <p className="text-white/70 text-lg md:text-xl mb-12 max-w-3xl font-medium leading-relaxed">
              Kridaz helps you automate bookings, manage operations, and connect with thousands of players looking for venues like yours.
            </p>

            {/* Features Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 mb-16 border-t border-white/10 pt-12">
              {benefits.map((b, i) => (
                <div key={i} className="flex gap-5 group">
                  <div className="w-14 h-14 shrink-0 rounded-[12px] flex items-center justify-center border border-[#BFF367]/20 bg-gradient-to-b from-[#262626] to-[#1A1A1A]">
                    <b.icon size={24} className="text-[#BFF367]" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-white text-sm font-black mb-2 uppercase tracking-wide">{b.title}</h3>
                    <p className="text-white/50 text-sm leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap items-center gap-8">
              <Link to="/business/register?role=venu_owners" className="bg-[#BFF367] text-black px-10 py-4 font-black text-lg rounded-[8px] hover:scale-105 transition-transform shadow-[0_0_20px_rgba(191,243,103,0.25)]">
                Register Your Venue
              </Link>
              <button className="flex items-center gap-4 group">
                <div className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center bg-white/5 transition-all group-hover:bg-white/10 group-hover:scale-110">
                  <Play size={20} className="text-white fill-white" />
                </div>
                <div className="text-left">
                  <div className="text-white font-black uppercase tracking-widest text-sm">Watch Demo</div>
                  <div className="text-white/50 text-xs mt-0.5 font-medium">See how it works</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bento Grid Stats Section ── */}
      <section className="py-24 bg-[#0c0f0f]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Large Feature Card */}
            <div className="md:col-span-8 bg-gradient-to-b from-[#262626] to-[#1A1A1A] border border-[#262626] p-10 md:p-12 rounded-[16px] relative overflow-hidden group">
              <div className="relative z-10">
                <span className="text-[#BFF367] font-black text-xs tracking-widest uppercase mb-4 block">Command Center</span>
                <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">Total Control Over Your Facility</h2>
                <p className="text-white/70 text-lg max-w-md mb-12 leading-relaxed">
                  Monitor every court, every trainer, and every booking from a single, unified interface designed for high-performance management.
                </p>
                
                <div className="space-y-4 max-w-sm">
                  <div className="flex justify-between text-xs font-black text-white/70 tracking-widest">
                    <span>PEAK CAPACITY</span>
                    <span>94%</span>
                  </div>
                  <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden flex">
                     <div className="h-full bg-[#BFF367] w-[94%]" style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 4px, #121414 4px, #121414 6px)" }}></div>
                  </div>
                </div>
              </div>
              
              {/* decorative bg */}
              <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-20 pointer-events-none grayscale group-hover:grayscale-0 transition-all duration-700">
                 <img src="https://images.unsplash.com/photo-1518605368461-1e122b1029c7?w=800&q=80" alt="Stadium" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Small Data Card */}
            <div className="md:col-span-4 bg-gradient-to-b from-[#262626] to-[#1A1A1A] border border-[#BFF367]/20 p-8 md:p-10 rounded-[16px] flex flex-col justify-between group">
               <div>
                  <Zap size={40} className="text-[#BFF367] fill-[#BFF367] mb-8 drop-shadow-[0_0_15px_rgba(191,243,103,0.5)] group-hover:scale-110 transition-transform" />
                  <h3 className="text-white text-2xl font-black mb-4 uppercase tracking-tight">Lightning Fast Onboarding</h3>
                  <p className="text-white/70 text-sm leading-relaxed">
                    Get your venue listed and start receiving automated bookings in under 15 minutes. Our system integrates with your existing workflow seamlessly.
                  </p>
               </div>
               <div className="mt-8 pt-8 border-t border-white/5">
                  <div className="flex items-center gap-4">
                     <div className="flex -space-x-3">
                        <img src="https://i.pravatar.cc/100?img=12" className="w-10 h-10 rounded-full border-2 border-[#1A1A1A] object-cover" alt="User" />
                        <img src="https://i.pravatar.cc/100?img=33" className="w-10 h-10 rounded-full border-2 border-[#1A1A1A] object-cover" alt="User" />
                        <img src="https://i.pravatar.cc/100?img=47" className="w-10 h-10 rounded-full border-2 border-[#1A1A1A] object-cover" alt="User" />
                     </div>
                     <span className="text-xs font-black text-white/70 tracking-wide">+2k Venue Owners</span>
                  </div>
               </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── CTA Final Section ── */}
      <section className="py-32 relative overflow-hidden bg-black">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-[56px] font-black text-white mb-8 tracking-tight leading-tight">Ready to Scale Your Sports Business?</h2>
          <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto mb-12">
            Join the fastest-growing network of sports venues and turn your operation into a well-oiled machine.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6">
             <Link to="/business/register?role=venu_owners" className="bg-[#BFF367] text-black px-12 py-5 font-black text-lg rounded-[8px] hover:scale-105 transition-transform shadow-[0_0_20px_rgba(191,243,103,0.2)]">
               Register Your Venue
             </Link>
             <button className="border border-white/20 text-white px-12 py-5 font-black text-lg rounded-[8px] hover:bg-white/5 transition-colors">
               Contact Sales
             </button>
          </div>
        </div>
        
        {/* Grid Pattern Background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, #BFF367 1px, transparent 1px)", backgroundSize: "40px 40px" }}></div>
      </section>
    </div>
  );
}
