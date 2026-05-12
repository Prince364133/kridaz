import React, { useState } from "react";
import { Search, Filter, Download, Plus, Phone, Mail, ExternalLink, User, Loader2 } from "lucide-react";
import useCustomers from "../../../hooks/owner/useCustomers";
import { Link } from "react-router-dom";

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
 const { customers, stats, loading, error } = useCustomers();

 const filteredCustomers = customers.filter(c => 
 c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
 c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
 c.phone.toLowerCase().includes(searchTerm.toLowerCase())
 );

 if (loading) {
 return (
 <div className="h-full flex flex-col items-center justify-center bg-[#000] text-[#CCFF00] gap-4">
 <Loader2 className="animate-spin" size={48} />
 <p className="text-xs font-bold uppercase tracking-[0.3em]">Synchronizing Player Data...</p>
 </div>
 );
 }

 return (
 <div className="h-full custom-scrollbar bg-[#000000] text-white">
 <div className="p-4 lg:px-10 lg:pt-8 lg:pb-12 space-y-8 animate-fade-in pt-0 pb-24 h-full relative">
 {/* Header */}
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10 border-b border-[#2D2D2D] pb-6">
 <div>
 <div className="flex items-center gap-3">
 <User className="text-[#CCFF00]" size={32} />
 <h1 className="text-[28px] lg:text-[32px] font-bold font-open-sans tracking-tight uppercase leading-none">Customer Directory</h1>
 </div>
 <p className="text-[#878C9F] font-inter text-[20px] mt-2 ml-11">Monitor player engagement and lifetime value.</p>
 </div>
 <div className="flex items-center gap-3 w-full md:w-auto">
 <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#000000] hover:bg-[#111111] border border-[#2D2D2D] rounded-[8px] text-[13px] font-bold uppercase tracking-widest transition-all shadow-[var(--shadow-2)] w-full md:w-auto font-inter">
 <Download size={16} />
 Export CSV
 </button>
 </div>
 </div>

 {/* Stats Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
 <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-5 flex flex-col relative overflow-hidden shadow-[var(--shadow-2)] hover:border-[#CCFF00]/30 transition-all duration-500">
 <p className="text-[12px] font-normal text-[#878C9F] uppercase tracking-[0.5px] mb-3">Total Players</p>
 <div className="flex items-end justify-between">
 <h3 className="text-2xl font-semibold text-white tracking-tight">{stats.totalPlayers.toLocaleString()}</h3>
 <span className="px-2 py-0.5 bg-[#CCFF00]/10 text-[#CCFF00] text-[10px] font-medium uppercase tracking-wider rounded-full">Active</span>
 </div>
 </div>
 <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-5 flex flex-col relative overflow-hidden shadow-[var(--shadow-2)] hover:border-[#CCFF00]/30 transition-all duration-500">
 <p className="text-[12px] font-normal text-[#878C9F] uppercase tracking-[0.5px] mb-3">Active Users</p>
 <div className="flex items-end justify-between">
 <h3 className="text-2xl font-semibold text-white tracking-tight">{stats.activeUsers.toLocaleString()}</h3>
 <span className="px-2 py-0.5 bg-[#CCFF00]/10 text-[#CCFF00] text-[10px] font-medium uppercase tracking-wider rounded-full">30D</span>
 </div>
 </div>
 <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-5 flex flex-col relative overflow-hidden shadow-[var(--shadow-2)] hover:border-[#CCFF00]/30 transition-all duration-500">
 <p className="text-[12px] font-normal text-[#878C9F] uppercase tracking-[0.5px] mb-3">Avg. LTV</p>
 <div className="flex items-end justify-between">
 <h3 className="text-2xl font-semibold text-white tracking-tight">Rs {stats.avgLtv.toLocaleString()}</h3>
 <span className="px-2 py-0.5 bg-[#CCFF00]/10 text-[#CCFF00] text-[10px] font-medium uppercase tracking-wider rounded-full">Per Player</span>
 </div>
 </div>
 <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-5 flex flex-col relative overflow-hidden shadow-[var(--shadow-2)] hover:border-[#CCFF00]/30 transition-all duration-500">
 <p className="text-[12px] font-normal text-[#878C9F] uppercase tracking-[0.5px] mb-3">Retention</p>
 <div className="flex items-end justify-between">
 <h3 className="text-2xl font-semibold text-white tracking-tight">{stats.retentionRate}%</h3>
 <span className="px-2 py-0.5 bg-[#CCFF00]/10 text-[#CCFF00] text-[10px] font-medium uppercase tracking-wider rounded-full">Returning</span>
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
 className="w-full bg-[#2D2D2D] border border-[#404040] text-white pl-10 pr-4 py-2 rounded-[6px] text-[14px] focus:outline-none focus:border-[#CCFF00] transition-colors font-inter"
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
 <th className="px-6 py-5 text-[12px] font-medium text-[#999999] uppercase tracking-wider font-open-sans">Customer</th>
 <th className="px-6 py-5 text-[12px] font-medium text-[#999999] uppercase tracking-wider font-open-sans">Status</th>
 <th className="px-6 py-5 text-[12px] font-medium text-[#999999] uppercase tracking-wider font-open-sans">Bookings</th>
 <th className="px-6 py-5 text-[12px] font-medium text-[#999999] uppercase tracking-wider font-open-sans">Revenue Contribution</th>
 <th className="px-6 py-5 text-[12px] font-medium text-[#999999] uppercase tracking-wider font-open-sans">Last Active</th>
 <th className="px-6 py-5 text-[12px] font-medium text-[#999999] uppercase tracking-wider text-right font-open-sans">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#2D2D2D]/30">
 {filteredCustomers.length > 0 ? (
 filteredCustomers.map((customer) => (
 <tr key={customer.id} className="group hover:bg-[#2D2D2D]/20 transition-colors">
 <td className="px-6 py-4">
 <div className="flex items-center gap-3">
 <div className={`w-8 h-8 rounded-[4px] flex items-center justify-center shrink-0 ${customer.isRegistered ? 'bg-[#CCFF00]/20' : 'bg-[#2D2D2D]'}`}>
 <User size={16} className={customer.isRegistered ? "text-[#CCFF00]" : "text-white/40"} />
 </div>
 <div>
 <p className="text-[14px] font-semibold text-white tracking-tight group-hover:text-[#CCFF00] transition-colors font-inter">{customer.name}</p>
 <p className="text-[11px] font-normal text-[#878C9F] uppercase tracking-widest mt-0.5 font-inter">{customer.joinedFormatted}</p>
 </div>
 </div>
 </td>
 <td className="px-6 py-4">
 <span className={`px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest rounded-[4px] border ${getStatusColor(customer.status)} font-inter`}>
 {customer.status}
 </span>
 </td>
 <td className="px-6 py-4">
 <span className="text-[13px] font-medium text-[#999999] uppercase tracking-widest font-inter">{customer.bookingCount} Sessions</span>
 </td>
 <td className="px-6 py-4">
 <span className="text-[16px] font-semibold text-white tracking-tight font-inter">Rs {customer.totalRevenue.toLocaleString()}</span>
 </td>
 <td className="px-6 py-4">
 <span className="text-[13px] font-medium text-[#999999] uppercase tracking-widest font-inter">{customer.lastActiveFormatted}</span>
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center justify-end gap-3 text-[#878C9F]">
 <a 
 href={`tel:${customer.phone}`}
 className="p-1.5 hover:text-white hover:bg-[#2D2D2D] rounded-[4px] transition-colors group/action relative" 
 title={`Call: ${customer.phone}`}
 >
 <Phone size={16} />
 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#111] border border-[#2D2D2D] text-[10px] text-white whitespace-nowrap opacity-0 group-hover/action:opacity-100 transition-opacity pointer-events-none rounded shadow-xl z-50">
 {customer.phone}
 </div>
 </a>
 <a 
 href={`mailto:${customer.email}`}
 className="p-1.5 hover:text-white hover:bg-[#2D2D2D] rounded-[4px] transition-colors group/action relative" 
 title={`Email: ${customer.email}`}
 >
 <Mail size={16} />
 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#111] border border-[#2D2D2D] text-[10px] text-white whitespace-nowrap opacity-0 group-hover/action:opacity-100 transition-opacity pointer-events-none rounded shadow-xl z-50">
 {customer.email}
 </div>
 </a>
 <Link 
 to={customer.isRegistered ? `/profile/${customer.userId}` : "#"}
 className={`p-1.5 hover:text-white hover:bg-[#2D2D2D] rounded-[4px] transition-colors group/action relative ${!customer.isRegistered ? 'opacity-30 cursor-not-allowed' : ''}`} 
 title={customer.isRegistered ? "View Platform Profile" : "Guest Player (No Profile)"}
 >
 <ExternalLink size={16} />
 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#111] border border-[#2D2D2D] text-[10px] text-white whitespace-nowrap opacity-0 group-hover/action:opacity-100 transition-opacity pointer-events-none rounded shadow-xl z-50">
 {customer.isRegistered ? "View Player Details" : "Guest Record"}
 </div>
 </Link>
 </div>
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan="6" className="px-6 py-20 text-center text-[#878C9F] font-inter uppercase tracking-[0.2em] text-xs">
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
