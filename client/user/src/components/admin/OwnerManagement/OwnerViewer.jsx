import React, { useState, useEffect } from "react";
import useOwners from "@hooks/admin/useOwners";
import axiosInstance from "@hooks/useAxiosInstance";
import OwnerList from "./OwnerList";
import SearchBar from "./SearchBar";
import OwnersSkeleton from "./OwnersSkeleton";
import { Users, Building, Activity, ShieldCheck, Search, Filter } from "lucide-react";
import CountUp from "react-countup";

const OwnerViewer = () => {
  const { owners, loading, searchTerm, handleSearch } = useOwners();
  const [stats, setStats] = useState({
    totalOwners: 0,
    activeOwners: 0,
    growthRate: "+12.5%"
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axiosInstance.get("/api/admin/dashboard-data");
        setStats({
          totalOwners: response.data.totalOwners || 0,
          activeOwners: owners.length,
          growthRate: "+12.5%"
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };
    fetchStats();
  }, [owners.length]);

  if (loading) return <OwnersSkeleton />;

  return (
    <div className="bg-[#000000]">
      <div className="p-4 lg:px-10 lg:pt-8 lg:pb-12 space-y-12 lg:space-y-16 animate-fade-in pt-0 pb-24 relative">
        {/* Background Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#CCFF00]/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#CCFF00]/5 blur-[120px] pointer-events-none" />

        <div className="space-y-12 lg:space-y-16 relative z-10">
          
          {/* Header Section */}
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-10 border-b border-[#2D2D2D] pb-10">
            <div className="relative">
              <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-14 bg-[#CCFF00] rounded-full shadow-[0_0_25px_rgba(204,255,0,0.5)]"></div>
              <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-4">
                Partner <span className="text-[#CCFF00]">Directory</span>
              </h1>
              <p className="admin-subheading text-[#999999]">
                Verified Venue Proprietors • Enterprise Roster
              </p>
            </div>

            <div className="flex items-center gap-6">
              <SearchBar searchTerm={searchTerm} handleSearch={handleSearch} />
            </div>
          </div>

          {/* Header Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-5">
            <StatsCard
              title="Verified Owners"
              value={stats.totalOwners}
              icon={Building}
              trend="Platform Assets"
            />
            <StatsCard
              title="Live Sessions"
              value={owners.length}
              icon={Activity}
              trend="Active Index"
            />
            <StatsCard
              title="Partner Growth"
              value={12.5}
              suffix="%"
              icon={Users}
              trend="MoM Growth"
            />
            <StatsCard
              title="System Trust"
              value={99.9}
              suffix="%"
              icon={ShieldCheck}
              trend="Verified"
            />
          </div>

          {/* Proprietor List Table */}
          <div className="space-y-6">
            {/* Table Header */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-4 bg-[#0d0d0d] border border-[#2D2D2D] rounded-[12px] text-[10px] font-black text-[#878C9F] uppercase tracking-[0.2em] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
              <div className="col-span-4">Partner Profile</div>
              <div className="col-span-3">Operational Email</div>
              <div className="col-span-2">Contact Number</div>
              <div className="col-span-2">Account Status</div>
              <div className="col-span-1 text-right">Action</div>
            </div>
            <OwnerList owners={owners} />
          </div>

          {/* Footer Metrics */}
          <div className="pt-8 border-t border-[#2D2D2D] flex flex-col sm:flex-row gap-4 justify-between items-center pb-8 opacity-40">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-medium uppercase tracking-widest text-[#999999]">Status: Secure</span>
              <div className="h-4 w-[1px] bg-[#2D2D2D] hidden sm:block" />
              <span className="text-[10px] font-medium uppercase tracking-widest text-[#999999]">Proprietor Ledger v4.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatsCard = ({ title, value, prefix = "", suffix = "", icon: Icon, trend }) => (
  <div className="bg-[#000000] border border-[#2D2D2D] rounded-[12px] p-6 flex flex-col relative overflow-hidden group hover:border-[#CCFF00]/30 transition-all duration-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
    <Icon className="absolute -right-4 -bottom-4 w-24 h-24 text-white/[0.02] group-hover:text-white/[0.05] transition-all duration-700 rotate-12 pointer-events-none" />
    
    <div className="flex items-center justify-between mb-6 relative z-10">
      <div className="w-12 h-12 bg-[#CCFF00]/10 rounded-[10px] text-[#CCFF00] flex items-center justify-center border border-[#CCFF00]/20 shadow-[0_0_15px_rgba(204,255,0,0.1)] transition-transform group-hover:scale-110">
        <Icon size={22} />
      </div>
      <div className="px-3 py-1 rounded-full bg-white/5 text-white/40 text-[9px] font-black uppercase tracking-widest border border-white/5 group-hover:border-[#CCFF00]/20 group-hover:text-[#CCFF00] transition-all">
        {trend}
      </div>
    </div>

    <div className="space-y-1 relative z-10">
      <h3 className="text-[11px] font-bold text-[#878C9F] uppercase tracking-[2px]">{title}</h3>
      <div className="text-3xl font-black text-white tracking-tighter flex items-baseline gap-1">
        {prefix && <span className="text-xl text-white/40 font-bold">{prefix}</span>}
        <CountUp end={value} duration={2} separator="," decimals={value % 1 === 0 ? 0 : 1} />
        {suffix && <span className="text-xl text-white/40 font-bold">{suffix}</span>}
      </div>
    </div>
  </div>
);

export default OwnerViewer;
