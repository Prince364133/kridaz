import CountUp from "react-countup";

const StatCard = ({ title, value, icon: Icon, className, prefix = "" }) => (
  <div className={`relative overflow-hidden group p-6 notched-corner transition-all duration-500 hover:scale-[1.02] border border-white/5 bg-[#0A0A0A] ${className}`}>
    {/* Subtle Background Glow */}
    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[80px] group-hover:bg-primary/10 transition-all duration-700" />
    
    <div className="relative z-10 flex justify-between items-start mb-4">
      <div className="space-y-1">
        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.3em] group-hover:text-primary transition-colors">{title}</p>
        <div className="flex items-baseline gap-1">
          {prefix && <span className="text-xl font-display text-primary">{prefix}</span>}
          <div className="text-4xl font-display font-black italic tracking-tighter text-white">
            <CountUp end={value || 0} duration={2.5} separator="," />
          </div>
        </div>
      </div>
      
      {Icon && (
        <div className="w-12 h-12 flex items-center justify-center bg-black/50 notched-corner border border-white/5 group-hover:border-primary/30 transition-all">
          <Icon className="text-primary group-hover:scale-110 transition-transform" size={20} />
        </div>
      )}
    </div>

    {/* Progress Indicator Accent */}
    <div className="relative h-1 w-full bg-white/5 rounded-full overflow-hidden">
      <div className="absolute top-0 left-0 h-full bg-primary w-1/3 group-hover:w-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(132,204,22,0.5)]" />
    </div>
  </div>
);

export default StatCard;
