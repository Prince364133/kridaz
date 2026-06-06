import React, { useState } from "react";
import { Search, Filter, Download, MessageSquare, User, Loader2 } from "lucide-react";
import useCustomers from "@hooks/venue-owner/useCustomers";
import { Link } from "react-router-dom";

export default function CustomerDirectory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const filterOptions = ["All", "Manual Customers", "Registered", "Latest", "Last Month"];
  const { customers, stats, loading, error } = useCustomers();

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedFilter === "Manual Customers") return !c.isRegistered;
    if (selectedFilter === "Registered") return c.isRegistered;
    
    return true;
  });

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#000] text-[#BFF367] gap-4">
        <Loader2 className="animate-spin" size={48} />
        <p className="text-xs font-bold uppercase tracking-[0.3em]">Synchronizing Player Data...</p>
      </div>
    );
  }

  return (
    <div className="h-full custom-scrollbar bg-[#000000] text-white">
      <div className="px-1 lg:px-3 lg:pt-2 lg:pb-3 space-y-8 animate-fade-in pt-0 pb-4 h-full relative">
        {/* Header */}
        <div className="flex flex-row justify-between items-start md:items-center gap-4 relative z-10 border-b border-white/5 pb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h2 className="text-[20px] sm:text-[24px] lg:text-[32px] mt-2 sm:mt-0 font-bold font-['Open_Sans'] tracking-tight uppercase leading-none truncate">Customer Directory</h2>
            </div>
            <p className="text-[#878C9F] font-inter font-light text-[12px] md:text-[20px] mt-2 truncate">Monitor player engagement and lifetime value.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0 mt-2 md:mt-0">
            <button className="flex items-center justify-center p-2 sm:p-3 bg-[#121212] hover:bg-[#BFF367] hover:text-black border border-white/5 rounded-[8px] md:rounded-[8px] text-[#878C9F] transition-all shadow-[var(--shadow-2)]">
              <Download className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4 lg:gap-5">
          <div className="bg-[#121212] border border-white/5 rounded-[8px] p-2 md:p-3 flex flex-col relative overflow-hidden shadow-[var(--shadow-2)] hover:border-[#BFF367]/30 transition-all duration-500">
            <p className="text-[9px] md:text-[12px] font-normal text-[#878C9F] uppercase tracking-[0.5px] mb-2 md:mb-3 truncate">Total Players</p>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-1 md:gap-0">
              <h3 className="text-sm md:text-2xl font-semibold text-white tracking-tight font-inter">{stats.totalPlayers.toLocaleString()}</h3>
              <span className="px-1.5 md:px-2 py-0.5 bg-[#BFF367]/10 text-[#BFF367] text-[8px] md:text-[10px] font-medium uppercase tracking-wider rounded-full self-start md:self-auto">Active</span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-[#121212] border border-white/5 rounded-[8px] overflow-hidden shadow-[var(--shadow-2)]">
          {/* Search & Filter */}
          <div className="p-2 md:p-3 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex w-full md:w-auto flex-1 max-w-xl gap-2 relative">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#878C9F]" size={16} />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#2D2D2D] border border-[#404040] text-white pl-10 pr-4 py-2 rounded-[6px] text-[14px] focus:outline-none focus:border-[#BFF367] transition-colors font-inter"
                />
              </div>
              <div className="relative">
                <button 
                  onClick={() => setShowFilter(!showFilter)}
                  className="p-2 h-full flex items-center justify-center bg-[#2D2D2D] border border-[#404040] text-[#878C9F] rounded-[6px] hover:text-white transition-colors relative"
                >
                  <Filter size={18} />
                  {selectedFilter !== "Latest" && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#BFF367] rounded-full"></span>
                  )}
                </button>
                
                {/* Filter Dropdown */}
                {showFilter && (
                  <div className="absolute right-0 top-full mt-2 w-40 bg-[#1A1A1A] border border-white/10 rounded-[8px] shadow-2xl z-50 overflow-hidden">
                     {filterOptions.map(opt => (
                       <button
                         key={opt}
                         onClick={() => { setSelectedFilter(opt); setShowFilter(false); }}
                         className={`w-full text-left px-4 py-2.5 text-[10px] font-inter uppercase tracking-wider hover:bg-[#BFF367]/10 transition-colors ${selectedFilter === opt ? 'text-[#BFF367] bg-[#BFF367]/5' : 'text-[#878C9F] hover:text-white'}`}
                       >
                         {opt}
                       </button>
                     ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          {/* Table */}
          <div className="overflow-x-auto no-scrollbar w-full">
            <table className="w-full text-left table-fixed sm:table-auto">
              <thead>
                <tr className="border-b border-white/5 bg-[#151617]/50">
                  <th className="px-1 sm:px-3 lg:px-6 py-2 lg:py-5 text-[7px] sm:text-[10px] lg:text-[12px] font-medium text-[#999999] uppercase tracking-wider font-open-sans truncate w-[40%] sm:w-auto">Customer</th>
                  <th className="px-1 sm:px-3 lg:px-6 py-2 lg:py-5 text-[7px] sm:text-[10px] lg:text-[12px] font-medium text-[#999999] uppercase tracking-wider font-open-sans truncate w-[20%] sm:w-auto">Bookings</th>
                  <th className="px-1 sm:px-3 lg:px-6 py-2 lg:py-5 text-[7px] sm:text-[10px] lg:text-[12px] font-medium text-[#999999] uppercase tracking-wider font-open-sans truncate w-[20%] sm:w-auto">Revenue</th>
                  <th className="px-1 sm:px-3 lg:px-6 py-2 lg:py-5 text-[7px] sm:text-[10px] lg:text-[12px] font-medium text-[#999999] uppercase tracking-wider text-right font-open-sans truncate w-[20%] sm:w-auto">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2D2D2D]/30">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="group hover:bg-[#2D2D2D]/20 transition-colors">
                      <td className="px-1 sm:px-3 lg:px-6 py-2 lg:py-4 truncate">
                        <div className="flex items-center gap-1.5 lg:gap-3">
                          <div className={`w-5 h-5 lg:w-8 lg:h-8 rounded-[4px] flex items-center justify-center shrink-0 ${customer.isRegistered ? 'bg-[#BFF367]/20' : 'bg-[#2D2D2D]'}`}>
                            <User className={`w-3 h-3 lg:w-4 lg:h-4 ${customer.isRegistered ? "text-[#BFF367]" : "text-white/40"}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] sm:text-[12px] lg:text-[14px] font-semibold text-white tracking-tight group-hover:text-[#BFF367] transition-colors font-inter truncate">{customer.name}</p>
                            <p className="text-[6px] sm:text-[9px] lg:text-[11px] font-normal text-[#878C9F] uppercase tracking-widest mt-0.5 font-inter truncate">{customer.joinedFormatted}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-1 sm:px-3 lg:px-6 py-2 lg:py-4">
                        <span className="text-[8px] lg:text-[13px] font-medium text-[#999999] uppercase tracking-widest font-inter truncate block">{customer.bookingCount} Sess</span>
                      </td>
                      <td className="px-1 sm:px-3 lg:px-6 py-2 lg:py-4">
                        <span className="text-[8px] lg:text-[16px] font-semibold text-white tracking-tight font-inter truncate block">Rs {customer.totalRevenue.toLocaleString()}</span>
                      </td>
                      <td className="px-1 sm:px-3 lg:px-6 py-2 lg:py-4">
                        <div className="flex items-center justify-end gap-1 lg:gap-3 text-[#878C9F]">
                          <Link 
                            to={customer.isRegistered ? `/messages?userId=${customer.userId}` : "#"}
                            className={`p-1.5 lg:p-2 hover:text-[#BFF367] hover:bg-[#BFF367]/10 rounded-[6px] transition-all group/action relative ${!customer.isRegistered ? 'opacity-30 cursor-not-allowed' : ''}`} 
                            title={customer.isRegistered ? `Chat with ${customer.name}` : "Guest Player (No Chat)"}
                          >
                            <MessageSquare className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                            <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-[#111] border border-white/5 text-[10px] text-white whitespace-nowrap opacity-0 group-hover/action:opacity-100 transition-opacity pointer-events-none rounded shadow-xl z-50">
                               {customer.isRegistered ? "Chat" : "Guest (No Chat)"}
                            </div>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-20 text-center text-[#878C9F] font-inter uppercase tracking-[0.2em] text-xs">
                       No players found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
