import React, { useState } from "react";
import { Search, Filter, Download, Plus, Phone, Mail, ExternalLink, User } from "lucide-react";

// Mock Data
const customers = [
  {
    id: 1,
    name: "Aditya Verma",
    joined: "Joined Oct 2025",
    status: "ELITE",
    sessions: "24 sessions",
    revenue: "₹36,000",
    lastActive: "Today",
    avatarColor: "bg-orange-500",
  },
  {
    id: 2,
    name: "Sarah D'Souza",
    joined: "Joined Oct 2025",
    status: "GOLD",
    sessions: "18 sessions",
    revenue: "₹22,400",
    lastActive: "2 days ago",
    avatarColor: "bg-emerald-500",
  },
  {
    id: 3,
    name: "Rohan Mehta",
    joined: "Joined Oct 2025",
    status: "SILVER",
    sessions: "12 sessions",
    revenue: "₹18,500",
    lastActive: "1 week ago",
    avatarColor: "bg-blue-400",
  },
  {
    id: 4,
    name: "Priya Singh",
    joined: "Joined Oct 2025",
    status: "PLATINUM",
    sessions: "42 sessions",
    revenue: "₹64,200",
    lastActive: "Today",
    avatarColor: "bg-rose-500",
  },
];

const getStatusColor = (status) => {
  switch (status) {
    case "ELITE":
      return "bg-[#CCFF00]/10 text-[#CCFF00] border-[#CCFF00]/20";
    case "GOLD":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    case "SILVER":
      return "bg-gray-400/10 text-gray-400 border-gray-400/20";
    case "PLATINUM":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    default:
      return "bg-gray-500/10 text-gray-500 border-gray-500/20";
  }
};

export default function CustomerDirectory() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="h-full custom-scrollbar bg-[#000000] text-white">
      <div className="p-4 lg:px-10 lg:pt-8 lg:pb-12 space-y-8 animate-fade-in pt-0 pb-24 h-full relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10 border-b border-[#2D2D2D] pb-6">
          <div>
            <div className="flex items-center gap-3">
              <User className="text-[#CCFF00]" size={32} />
              <h1 className="text-[28px] lg:text-[32px] font-bold font-['Open_Sans'] tracking-tight uppercase leading-none">Customer Directory</h1>
            </div>
            <p className="text-[#878C9F] font-inter text-[20px] mt-2 ml-11">Monitor player engagement and lifetime value.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#000000] hover:bg-[#111111] border border-[#2D2D2D] rounded-[8px] text-[13px] font-bold uppercase tracking-widest transition-all shadow-[var(--shadow-2)] w-full md:w-auto font-inter">
              <Download size={16} />
              Export CSV
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#CCFF00] hover:bg-[#b3ff00] text-black rounded-[8px] text-[13px] font-bold uppercase tracking-widest transition-all w-full md:w-auto shadow-[0_0_15px_rgba(204,255,0,0.15)] font-inter">
              <Plus size={18} />
              Add Customer
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {/* Total Players */}
          <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-5 flex flex-col relative overflow-hidden shadow-[var(--shadow-2)] hover:border-[#CCFF00]/30 transition-all duration-500">
            <p className="text-[12px] font-normal text-[#878C9F] uppercase tracking-[0.5px] mb-3">Total Players</p>
            <div className="flex items-end justify-between">
              <h3 className="text-2xl font-semibold text-white tracking-tight">1,482</h3>
              <span className="px-2 py-0.5 bg-[#CCFF00]/10 text-[#CCFF00] text-[10px] font-medium uppercase tracking-wider rounded-full">
                +12.5%
              </span>
            </div>
          </div>
          {/* Active Users */}
          <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-5 flex flex-col relative overflow-hidden shadow-[var(--shadow-2)] hover:border-[#CCFF00]/30 transition-all duration-500">
            <p className="text-[12px] font-normal text-[#878C9F] uppercase tracking-[0.5px] mb-3">Active Users</p>
            <div className="flex items-end justify-between">
              <h3 className="text-2xl font-semibold text-white tracking-tight">842</h3>
              <span className="px-2 py-0.5 bg-[#CCFF00]/10 text-[#CCFF00] text-[10px] font-medium uppercase tracking-wider rounded-full">
                +4.2%
              </span>
            </div>
          </div>
          {/* Avg. LTV */}
          <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-5 flex flex-col relative overflow-hidden shadow-[var(--shadow-2)] hover:border-[#CCFF00]/30 transition-all duration-500">
            <p className="text-[12px] font-normal text-[#878C9F] uppercase tracking-[0.5px] mb-3">Avg. LTV</p>
            <div className="flex items-end justify-between">
              <h3 className="text-2xl font-semibold text-white tracking-tight">₹4,280</h3>
              <span className="px-2 py-0.5 bg-[#CCFF00]/10 text-[#CCFF00] text-[10px] font-medium uppercase tracking-wider rounded-full">
                +18.1%
              </span>
            </div>
          </div>
          {/* Retention */}
          <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-5 flex flex-col relative overflow-hidden shadow-[var(--shadow-2)] hover:border-red-500/30 transition-all duration-500">
            <p className="text-[12px] font-normal text-[#878C9F] uppercase tracking-[0.5px] mb-3">Retention</p>
            <div className="flex items-end justify-between">
              <h3 className="text-2xl font-semibold text-white tracking-tight">64%</h3>
              <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[10px] font-medium uppercase tracking-wider rounded-full">
                -2.1%
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] overflow-hidden shadow-[var(--shadow-2)]">
          {/* Search & Filter */}
          <div className="p-4 border-b border-[#2D2D2D] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#878C9F]" size={16} />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#2D2D2D] border border-[#404040] text-white pl-10 pr-4 py-2 rounded-[6px] text-[14px] focus:outline-none focus:border-[#CCFF00] transition-colors"
              />
            </div>
            <button className="p-2 bg-[#2D2D2D] border border-[#404040] text-[#878C9F] rounded-[6px] hover:text-white transition-colors">
              <Filter size={18} />
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#2D2D2D] bg-[#151617]/50">
                  <th className="px-6 py-5 text-[12px] font-medium text-[#999999] uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-5 text-[12px] font-medium text-[#999999] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-5 text-[12px] font-medium text-[#999999] uppercase tracking-wider">Bookings</th>
                  <th className="px-6 py-5 text-[12px] font-medium text-[#999999] uppercase tracking-wider">Revenue Contribution</th>
                  <th className="px-6 py-5 text-[12px] font-medium text-[#999999] uppercase tracking-wider">Last Active</th>
                  <th className="px-6 py-5 text-[12px] font-medium text-[#999999] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2D2D2D]/30">
                {customers.map((customer) => (
                  <tr key={customer.id} className="group hover:bg-[#2D2D2D]/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-[4px] flex items-center justify-center shrink-0 ${customer.avatarColor}`}>
                          <User size={16} className="text-white/80" />
                        </div>
                        <div>
                          <p className="text-[14px] font-semibold text-white tracking-tight group-hover:text-[#CCFF00] transition-colors">{customer.name}</p>
                          <p className="text-[11px] font-normal text-[#878C9F] uppercase tracking-widest mt-0.5">{customer.joined}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest rounded-[4px] border ${getStatusColor(customer.status)}`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[13px] font-medium text-[#999999] uppercase tracking-widest">{customer.sessions}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[16px] font-semibold text-white tracking-tight">{customer.revenue}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[13px] font-medium text-[#999999] uppercase tracking-widest">{customer.lastActive}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-3 text-[#878C9F]">
                        <button className="p-1.5 hover:text-white hover:bg-[#2D2D2D] rounded-[4px] transition-colors" title="Call">
                          <Phone size={16} />
                        </button>
                        <button className="p-1.5 hover:text-white hover:bg-[#2D2D2D] rounded-[4px] transition-colors" title="Email">
                          <Mail size={16} />
                        </button>
                        <button className="p-1.5 hover:text-white hover:bg-[#2D2D2D] rounded-[4px] transition-colors" title="View Profile">
                          <ExternalLink size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
