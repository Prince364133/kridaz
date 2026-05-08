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
    <div className="p-4 md:p-8 space-y-8 animate-fade-in text-white font-inter bg-[#050505] min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-outfit tracking-tight">Customer Directory</h1>
          <p className="text-[#878C9F] text-sm mt-1">Monitor player engagement and lifetime value</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#111111] hover:bg-[#1a1a1a] border border-[#2D2D2D] rounded-[8px] text-sm font-medium transition-colors w-full md:w-auto">
            <Download size={16} />
            Export CSV
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#CCFF00] hover:bg-[#b3ff00] text-black rounded-[8px] text-sm font-bold transition-colors w-full md:w-auto shadow-[0_0_15px_rgba(204,255,0,0.15)]">
            <Plus size={18} />
            Add Customer
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Players */}
        <div className="bg-[#111111] border border-[#2D2D2D] rounded-[12px] p-5">
          <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest mb-3">Total Players</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold font-outfit">1,482</h3>
            <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[10px] font-bold rounded">
              +12.5%
            </span>
          </div>
        </div>
        {/* Active Users */}
        <div className="bg-[#111111] border border-[#2D2D2D] rounded-[12px] p-5">
          <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest mb-3">Active Users</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold font-outfit">842</h3>
            <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[10px] font-bold rounded">
              +4.2%
            </span>
          </div>
        </div>
        {/* Avg. LTV */}
        <div className="bg-[#111111] border border-[#2D2D2D] rounded-[12px] p-5">
          <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest mb-3">Avg. LTV</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold font-outfit">₹4,280</h3>
            <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[10px] font-bold rounded">
              +18.1%
            </span>
          </div>
        </div>
        {/* Retention */}
        <div className="bg-[#111111] border border-[#2D2D2D] rounded-[12px] p-5">
          <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest mb-3">Retention</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold font-outfit">64%</h3>
            <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[10px] font-bold rounded">
              -2.1%
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-[#111111] border border-[#2D2D2D] rounded-[12px] overflow-hidden">
        {/* Search & Filter */}
        <div className="p-4 border-b border-[#2D2D2D] flex items-center gap-4">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#878C9F]" size={18} />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2D2D2D] text-white pl-10 pr-4 py-2.5 rounded-[8px] text-sm focus:outline-none focus:border-[#CCFF00]/50 transition-colors"
            />
          </div>
          <button className="p-2.5 bg-[#1a1a1a] border border-[#2D2D2D] text-[#878C9F] rounded-[8px] hover:text-white transition-colors">
            <Filter size={18} />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#2D2D2D]">
                <th className="px-6 py-4 text-[10px] font-bold text-[#878C9F] uppercase tracking-widest">Customer</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#878C9F] uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#878C9F] uppercase tracking-widest">Bookings</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#878C9F] uppercase tracking-widest">Revenue Contribution</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#878C9F] uppercase tracking-widest">Last Active</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#878C9F] uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b border-[#2D2D2D] hover:bg-[#1a1a1a] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${customer.avatarColor}`}>
                        <User size={20} className="text-white/80" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{customer.name}</p>
                        <p className="text-xs text-[#878C9F] mt-0.5">{customer.joined}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded border ${getStatusColor(customer.status)}`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-[#e1e1e1]">{customer.sessions}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-white">{customer.revenue}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-[#878C9F]">{customer.lastActive}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3 text-[#878C9F]">
                      <button className="p-1.5 hover:text-white hover:bg-[#2D2D2D] rounded transition-colors" title="Call">
                        <Phone size={16} />
                      </button>
                      <button className="p-1.5 hover:text-white hover:bg-[#2D2D2D] rounded transition-colors" title="Email">
                        <Mail size={16} />
                      </button>
                      <button className="p-1.5 hover:text-white hover:bg-[#2D2D2D] rounded transition-colors" title="View Profile">
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
  );
}
