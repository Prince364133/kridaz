import React from "react";
import { Star, MessageSquare, Award, ThumbsUp } from "lucide-react";
import useUmpireDashboard from "@hooks/owner/useUmpireDashboard";
import DashboardSkeleton from "../owner/Dashboard/DashboardSkeleton";

export default function UmpireFeedback() {
 const { dashboardData, loading } = useUmpireDashboard();

 if (loading) return <DashboardSkeleton />;

 const rating = dashboardData?.officialRating || 0;

 return (
 <div className="space-y-8 animate-fade-in">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-white/5">
 <div className="space-y-1">
 <h1 className="text-5xl font-black uppercase tracking-tight text-white">
 Performance <span className="text-primary">Ratings</span>
 </h1>
 <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Stakeholder feedback and evaluations</p>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="md:col-span-1 bg-[#0D0D0D] border border-white/5 rounded-[32px] p-8 text-center space-y-6">
 <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20">
 <Star size={40} className="text-primary fill-primary" />
 </div>
 <div>
 <h2 className="text-6xl font-black text-white mb-2">{rating}</h2>
 <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Lifetime Official Rating</p>
 </div>
 <div className="flex justify-center gap-1">
 {[1, 2, 3, 4, 5].map((s) => (
 <Star key={s} size={20} className={s <= Math.floor(rating) ? "text-primary fill-primary" : "text-white/10"} />
 ))}
 </div>
 </div>

 <div className="md:col-span-2 space-y-6">
 <div className="bg-[#0D0D0D] border border-white/5 rounded-[32px] p-8">
 <div className="flex items-center gap-4 mb-8">
 <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
 <Award size={24} className="text-primary" />
 </div>
 <div>
 <h3 className="text-xl font-bold text-white">Elite Official Status</h3>
 <p className="text-gray-500 text-xs uppercase tracking-wider">Ranked in top 5% of regional umpires</p>
 </div>
 </div>

 <div className="space-y-4">
 {[
 { label: "Fairness & Neutrality", value: 98 },
 { label: "Decision Accuracy", value: 95 },
 { label: "Communication", value: 92 }
 ].map((metric) => (
 <div key={metric.label} className="space-y-2">
 <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold">
 <span className="text-gray-400">{metric.label}</span>
 <span className="text-primary">{metric.value}%</span>
 </div>
 <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
 <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${metric.value}%` }} />
 </div>
 </div>
 ))}
 </div>
 </div>

 <div className="bg-[#0D0D0D] border border-white/5 rounded-[32px] p-8">
 <div className="flex flex-col items-center justify-center py-4 text-center">
 <ThumbsUp size={32} className="text-white/10 mb-4" />
 <h4 className="text-white font-bold uppercase tracking-tight mb-2">Verified Feedback</h4>
 <p className="text-gray-500 text-sm max-w-sm">Detailed testimonials from team captains and tournament organizers will be available shortly.</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
