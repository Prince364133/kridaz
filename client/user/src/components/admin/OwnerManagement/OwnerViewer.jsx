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
      <div className="p-4 lg:px-10 lg:pt-8 lg:pb-12 space-y-8 lg:space-y-10 animate-fade-in pt-0 pb-24 relative">
        {/* Background Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#CCFF00]/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#CCFF00]/5 blur-[120px] pointer-events-none" />

        <div className="space-y-8 lg:space-y-10 relative z-10">
          
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

          {/* Search & Control Center */}
          <div className="bg-[#000000] p-6 rounded-[8px] border border-[#2D2D2D] shadow-[var(--shadow-2)]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="p-1.5 bg-[#CCFF00]/10 text-[#CCFF00] rounded-[4px] border border-[#CCFF00]/20">
                    <Building size={16} />
                  </div>
                  <h2 className="text-xl font-semibold text-white uppercase tracking-tight">
                    Partner Directory
                  </h2>
                </div>
                <p className="text-[10px] font-normal text-[#999999] uppercase tracking-widest">
                  Managing Verified Venue Proprietors
                </p>
              </div>

              <div className="flex items-center gap-4">
                <SearchBar searchTerm={searchTerm} handleSearch={handleSearch} />
              </div>
            </div>
          </div>

          {/* Main List */}
          <OwnerList owners={owners} />

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
  <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-5 flex flex-col relative overflow-hidden group hover:border-[#CCFF00]/30 transition-all duration-500 min-h-[140px] shadow-[var(--shadow-2)]">
    <Icon className="absolute -right-4 -bottom-4 w-20 h-20 text-white/[0.02] group-hover:text-white/[0.04] transition-colors rotate-12" />
    <div className="flex items-center justify-between mb-5">
      <div className="w-10 h-10 bg-[#CCFF00]/10 rounded-[6px] text-[#CCFF00] flex items-center justify-center transition-all shadow-sm">
        <Icon size={20} />
      </div>
      <div className="px-2 py-0.5 rounded-full bg-[#CCFF00]/10 text-[#CCFF00] text-[10px] font-medium uppercase tracking-wider">
        {trend}
      </div>
    </div>
    <div className="space-y-1 relative z-10">
      <h3 className="text-[12px] font-normal text-[#878C9F] uppercase tracking-[0.5px]">{title}</h3>
      <div className="text-2xl font-semibold text-white tracking-tight flex items-baseline gap-1">
        {prefix && <span className="text-lg text-white/40 font-normal">{prefix}</span>}
        <CountUp end={value} duration={2} separator="," decimals={value % 1 === 0 ? 0 : 1} />
        {suffix && <span className="text-lg text-white/40 font-normal">{suffix}</span>}
      </div>
    </div>
  </div>
);

export default OwnerViewer;
