import useOwnerBookings from "@hooks/owner/useOwnerBookings";
import BookingsSkeleton from "./BookingsSkeleton";
import { format, subHours, subMinutes } from "date-fns";
import { ArrowUpDown, Calendar, Clock, User, IndianRupee, Filter, Download } from "lucide-react";
import Avatar from "react-avatar";

const OwnerBookings = () => {
  const {
    bookings,
    loading,
    error,
    filterDays,
    setFilterDays,
    sortConfig,
    requestSort,
  } = useOwnerBookings();

  if (loading) return <BookingsSkeleton />;
  if (error) return <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-[8px] uppercase text-[12px] font-medium tracking-widest">{error}</div>;

  const getSortDirection = (name) => {
    if (!sortConfig) {
      return;
    }
    return sortConfig.key === name ? sortConfig.direction : undefined;
  };

  const formatTime = (dateString) => {
    const adjustedDate = subMinutes(subHours(new Date(dateString), 5), 30);
    return format(adjustedDate, "h:mm aa");
  };

  return (
    <div className="h-full custom-scrollbar bg-[#000000]">
      <div className="p-4 lg:px-10 lg:pt-8 lg:pb-12 space-y-8 animate-fade-in pt-0 pb-24 h-full relative">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-[#CCFF00] rounded-full" />
              <h1 className="text-[28px] lg:text-[32px] font-semibold text-white tracking-tight leading-none uppercase">
                Bookings <span className="text-[#CCFF00]">Overview</span>
              </h1>
            </div>
            <p className="text-[12px] font-normal text-[#999999] uppercase tracking-[0.2em] ml-4">
              Venue Management Console | Operational Feed
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-4 flex items-center gap-4 shadow-[var(--shadow-2)]">
              <div>
                <p className="text-[10px] font-medium text-[#999999] uppercase tracking-widest">Total Active</p>
                <p className="text-[24px] font-semibold text-[#CCFF00] leading-none mt-1">{bookings.length}</p>
              </div>
              <div className="h-10 w-[1px] bg-[#2D2D2D]" />
              <div className="text-right">
                <p className="text-[10px] font-medium text-[#999999] uppercase tracking-widest">System Status</p>
                <div className="flex items-center justify-end gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 bg-[#CCFF00] rounded-full animate-pulse" />
                  <p className="text-[12px] font-semibold text-white uppercase tracking-tighter">Live</p>
                </div>
              </div>
            </div>
            <button className="p-3 bg-[#2D2D2D] hover:bg-[#CCFF00] hover:text-[#000] rounded-[6px] transition-all text-[#999999] group shadow-[var(--shadow-2)]">
              <Download size={18} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </header>

        {/* Toolbar Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#000000] p-4 rounded-[8px] border border-[#2D2D2D] shadow-[var(--shadow-1)]">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#CCFF00]/10 text-[#CCFF00] rounded-[6px]">
                <Filter size={14} />
              </div>
              <span className="text-[12px] font-medium text-[#999999] uppercase tracking-widest">Timeframe:</span>
              <select
                className="bg-[#2D2D2D] border border-[#404040] text-white text-[13px] font-normal rounded-[6px] px-4 py-1.5 focus:outline-none focus:border-[#CCFF00] transition-all font-[Arial] uppercase tracking-wider"
                value={filterDays}
                onChange={(e) => setFilterDays(Number(e.target.value))}
              >
                <option value={7}>Last 7 Days</option>
                <option value={15}>Last 15 Days</option>
                <option value={30}>Last 30 Days</option>
              </select>
            </div>
          </div>

          <div className="text-[11px] font-normal text-[#878C9F] uppercase tracking-widest flex items-center gap-2">
            <Clock size={12} className="text-[#CCFF00]" />
            Last Synced: Just Now
          </div>
        </div>

        {/* Data Grid Section */}
        <div className="bg-[#000000] rounded-[8px] border border-[#2D2D2D] shadow-[var(--shadow-2)] overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#2D2D2D] bg-[#151617]/50">
                  <th className="px-6 py-5 text-[12px] font-medium text-[#999999] uppercase tracking-wider">Ground / Arena</th>
                  <th className="px-6 py-5 text-[12px] font-medium text-[#999999] uppercase tracking-wider">Athlete</th>
                  <th
                    onClick={() => requestSort("startTime")}
                    className="px-6 py-5 cursor-pointer text-[12px] font-medium text-[#999999] uppercase tracking-wider hover:text-[#CCFF00] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Start <ArrowUpDown size={12} className={getSortDirection("startTime") ? "text-[#CCFF00]" : "opacity-30"} />
                    </div>
                  </th>
                  <th
                    onClick={() => requestSort("endTime")}
                    className="px-6 py-5 cursor-pointer text-[12px] font-medium text-[#999999] uppercase tracking-wider hover:text-[#CCFF00] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      End <ArrowUpDown size={12} className={getSortDirection("endTime") ? "text-[#CCFF00]" : "opacity-30"} />
                    </div>
                  </th>
                  <th
                    onClick={() => requestSort("bookingDate")}
                    className="px-6 py-5 cursor-pointer text-[12px] font-medium text-[#999999] uppercase tracking-wider hover:text-[#CCFF00] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Date <ArrowUpDown size={12} className={getSortDirection("bookingDate") ? "text-[#CCFF00]" : "opacity-30"} />
                    </div>
                  </th>
                  <th className="px-6 py-5 text-[12px] font-medium text-[#999999] uppercase tracking-wider">Dur.</th>
                  <th
                    onClick={() => requestSort("totalPrice")}
                    className="px-6 py-5 cursor-pointer text-[12px] font-medium text-[#999999] uppercase tracking-wider hover:text-[#CCFF00] transition-colors text-right"
                  >
                    <div className="flex items-center justify-end gap-2">
                      Price <ArrowUpDown size={12} className={getSortDirection("totalPrice") ? "text-[#CCFF00]" : "opacity-30"} />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2D2D2D]/30">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="group hover:bg-[#2D2D2D]/20 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-[14px] font-semibold text-white uppercase tracking-tight group-hover:text-[#CCFF00] transition-colors">{booking.turfName}</p>
                        <p className="text-[11px] font-normal text-[#878C9F] uppercase tracking-widest mt-0.5">Ground ID: {booking.id.slice(-6)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-[4px] bg-[#2D2D2D] flex items-center justify-center text-[12px] font-semibold text-white uppercase border border-[#404040]">
                          {booking.userName[0]}
                        </div>
                        <p className="text-[14px] font-semibold text-white uppercase tracking-tight">{booking.userName}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-[14px] font-medium text-white tracking-tight">
                        <Clock size={14} className="text-[#CCFF00]" />
                        {formatTime(booking.startTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-[14px] font-medium text-white tracking-tight">
                        <Clock size={14} className="text-[#CCFF00]/50" />
                        {formatTime(booking.endTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-[14px] font-medium text-white tracking-tight">
                        <Calendar size={14} className="text-[#CCFF00]" />
                        {format(new Date(booking.bookingDate), "dd MMM yyyy")}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[13px] font-medium text-[#999999] uppercase tracking-widest">
                      {booking.duration.toFixed(1)}H
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[16px] font-semibold text-white tracking-tight">
                        ₹{booking.totalPrice.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Metrics */}
        <div className="pt-8 border-t border-[#2D2D2D] flex justify-between items-center opacity-40">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#999999]">
            Displaying {bookings.length} operational records | End of Feed
          </p>
          <div className="flex gap-4">
            <span className="text-[10px] font-medium uppercase tracking-widest">BookMySportz Engine v1.4</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerBookings;
