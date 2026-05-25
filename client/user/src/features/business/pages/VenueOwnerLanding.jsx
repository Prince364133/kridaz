import { ArrowRight, CheckCircle, BarChart3, CalendarDays, Play } from "lucide-react";
import { Link } from "react-router-dom";
import ScrollToTop from "@components/common/ScrollToTop";

const PRI = "#BFF367"; // New primary accent matching the gradient's vibrant stop

export default function VenueOwnerLanding() {
  return (
    <div className="relative min-h-screen text-white overflow-hidden bg-black flex flex-col justify-center">
      <ScrollToTop />
      
      {/* ── Google Fonts Import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Inter:wght@100..900&display=swap');
      `}</style>
      
      {/* ── Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-right md:bg-center bg-no-repeat pointer-events-none"
        style={{ 
          backgroundImage: `url(/venue-partner-bg.png)`,
        }}
      />
      
      {/* ── Gradient Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(to right, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.85) 35%, rgba(0, 0, 0, 0.4) 70%, rgba(0, 0, 0, 0.2) 100%)"
        }}
      />
      <div 
        className="absolute inset-0 bg-black/30 pointer-events-none"
      />

      <div className="max-w-[1440px] mx-auto px-6 md:pl-12 lg:pl-16 md:pr-8 w-full relative z-10 pt-16 pb-16 flex flex-col justify-between min-h-[75vh]">
        {/* Main Content Area */}
        <div className="flex flex-col justify-center flex-grow max-w-4xl">
          {/* Badge Tagline */}
          <div className="mb-4">
            <span
              className="inline-block px-4 py-1.5 rounded-full border text-[10px] md:text-xs font-black uppercase tracking-widest"
              style={{ 
                background: "rgba(191, 243, 103, 0.06)", 
                borderColor: "rgba(191, 243, 103, 0.3)", 
                color: PRI 
              }}
            >
              For Venue Owners & Partners
            </span>
          </div>

          {/* Headline */}
          <h1 
            className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight uppercase mb-4"
            style={{ fontFamily: "'Open Sans', sans-serif" }}
          >
            Grow Your Venue. <br />
            <span className="bg-gradient-to-r from-[#55DEE8] to-[#BFF367] bg-clip-text text-transparent">
              Maximize Every Slot.
            </span>
          </h1>

          {/* Paragraph (Subheading) */}
          <p 
            className="text-gray-300 leading-relaxed mb-8 max-w-2xl"
            style={{ fontFamily: "'Inter', sans-serif", fontSize: "20px" }}
          >
            Kridaz helps you automate bookings, manage operations, and connect with thousands of players looking for venues like yours.
          </p>

          {/* Features Horizontal Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 mb-8 border-t border-white/5 pt-6">
            {/* Feature 1 */}
            <div className="flex gap-4 md:pr-4">
              <div
                className="w-12 h-12 flex items-center justify-center shrink-0 border"
                style={{ 
                  borderColor: "rgba(191,243,103,0.2)", 
                  backgroundColor: "rgba(191,243,103,0.08)",
                  borderRadius: "15px"
                }}
              >
                <CalendarDays size={22} style={{ color: PRI }} />
              </div>
              <div>
                <h3 
                  className="text-sm md:text-base font-bold uppercase tracking-wider text-white mb-1.5"
                  style={{ fontFamily: "'Open Sans', sans-serif" }}
                >
                  Automated Bookings
                </h3>
                <p className="text-gray-400 text-xs leading-relaxed">No more phone calls. Let players book your turf 24/7.</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex gap-4 md:px-4 md:border-l md:border-r border-white/10">
              <div
                className="w-12 h-12 flex items-center justify-center shrink-0 border"
                style={{ 
                  borderColor: "rgba(191,243,103,0.2)", 
                  backgroundColor: "rgba(191,243,103,0.08)",
                  borderRadius: "15px"
                }}
              >
                <BarChart3 size={22} style={{ color: PRI }} />
              </div>
              <div>
                <h3 
                  className="text-sm md:text-base font-bold uppercase tracking-wider text-white mb-1.5"
                  style={{ fontFamily: "'Open Sans', sans-serif" }}
                >
                  Revenue Tracking
                </h3>
                <p className="text-gray-400 text-xs leading-relaxed">Real-time insights into your earnings, peak hours, and customer retention.</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex gap-4 md:pl-4">
              <div
                className="w-12 h-12 flex items-center justify-center shrink-0 border"
                style={{ 
                  borderColor: "rgba(191,243,103,0.2)", 
                  backgroundColor: "rgba(191,243,103,0.08)",
                  borderRadius: "15px"
                }}
              >
                <CheckCircle size={22} style={{ color: PRI }} />
              </div>
              <div>
                <h3 
                  className="text-sm md:text-base font-bold uppercase tracking-wider text-white mb-1.5"
                  style={{ fontFamily: "'Open Sans', sans-serif" }}
                >
                  Seamless Management
                </h3>
                <p className="text-gray-400 text-xs leading-relaxed">Block maintenance hours, set dynamic pricing, and manage your team with ease.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 sm:gap-8">
            <Link
              to="/business/register?role=venu_owners"
              className="inline-flex items-center justify-center gap-3 font-black text-black rounded-[6px] px-10 py-5 hover:brightness-110 hover:shadow-[0_0_20px_rgba(85,222,232,0.4)] transition-all bg-gradient-to-r from-[#55DEE8] to-[#BFF367] uppercase tracking-widest text-xs md:text-sm"
            >
              Register Your Venue <ArrowRight size={18} />
            </Link>

            <button
              onClick={() => alert("Demo video coming soon!")}
              className="inline-flex items-center gap-4 text-left group"
            >
              <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center shrink-0 group-hover:border-white/50 group-hover:scale-105 transition-all">
                <Play size={16} fill="white" className="ml-0.5 text-white" />
              </div>
              <div>
                <div className="text-white text-xs md:text-sm font-black uppercase tracking-wider">Watch Demo</div>
                <div className="text-gray-400 text-[10px] md:text-xs">See how it works</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
