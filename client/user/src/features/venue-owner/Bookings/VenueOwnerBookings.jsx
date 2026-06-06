import { Link } from "react-router-dom";
import useVenueOwnerBookings from "@hooks/venue-owner/useVenueOwnerBookings";
import BookingsSkeleton from "./BookingsSkeleton";
import { format } from "date-fns";
import { ArrowUpDown, Calendar, Clock, Filter, Download, Ticket, FileText } from "lucide-react";

const VenueOwnerBookings = () => {
  const {
    bookings,
    loading,
    error,
    filterDays,
    setFilterDays,
    sortConfig,
    requestSort,
    setSortConfig,
  } = useVenueOwnerBookings();

  if (loading) return <BookingsSkeleton />;
  if (error) return <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-[8px] uppercase text-[12px] font-medium tracking-widest">{error}</div>;

  const getSortDirection = (name) => {
    if (!sortConfig) {
      return;
    }
    return sortConfig.key === name ? sortConfig.direction : undefined;
  };

  const formatTime = (dateString) => {
    if (!dateString) return "Î“Ã‡Ã¶";
    return format(new Date(dateString), "h:mm aa");
  };

  return (
    <div className="h-full custom-scrollbar bg-[#000000] w-full max-w-full overflow-x-hidden">
      <div className="px-1 lg:px-3 lg:pt-2 lg:pb-3 space-y-4 md:space-y-8 animate-fade-in pt-0 pb-4 h-full relative w-full max-w-full overflow-x-hidden">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 relative z-10 w-full max-w-full">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-[20px] sm:text-[24px] lg:text-[32px] mt-2 sm:mt-0 font-bold font-['Open_Sans'] text-white tracking-tight leading-none uppercase whitespace-nowrap">
                Bookings <span className="text-[#BFF367]">Overview</span>
              </h2>
            </div>
            <p className="text-[#878C9F] font-inter text-[14px] md:text-[20px] mt-2 md:ml-4 leading-tight">
              Venue Management Console | Operational Feed
            </p>
          </div>
          <div className="flex flex-row items-center gap-2 md:gap-4 w-full md:w-auto mt-2 md:mt-0">
            <div className="flex-1 md:flex-none bg-[#121212] border border-white/5 rounded-[8px] md:rounded-[8px] py-1.5 px-3 md:p-4 flex items-center justify-center md:justify-start gap-4 shadow-[var(--shadow-2)]">
              <div className="text-center md:text-left flex flex-col gap-1 pr-4 border-r border-white/10">
                <p className="text-[8px] md:text-[10px] font-medium text-[#999999] uppercase tracking-widest">Total Bookings:</p>
                <p className="text-[14px] md:text-[24px] font-semibold text-white leading-none md:mt-1">{bookings.length}</p>
              </div>
              <div className="text-center md:text-left flex flex-col gap-1">
                <p className="text-[8px] md:text-[10px] font-medium text-[#999999] uppercase tracking-widest">Active Bookings:</p>
                <p className="text-[14px] md:text-[24px] font-semibold text-[#BFF367] leading-none md:mt-1">{bookings.filter(b => b.status !== 'cancelled' && b.status !== 'completed').length || bookings.length}</p>
              </div>
            </div>
            <button className="shrink-0 p-1.5 md:p-3 bg-[#2D2D2D] hover:bg-[#BFF367] hover:text-[#000] rounded-[6px] transition-all text-[#999999] group shadow-[var(--shadow-2)] h-fit">
              <Download className="w-3.5 h-3.5 md:w-[18px] md:h-[18px] group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </header>

        {/* Toolbar Section */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-[#000000] p-4 rounded-[8px] border border-white/5 shadow-[var(--shadow-1)] w-full max-w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full xl:w-auto">
            {/* Timeframe Filter */}
            <div className="flex items-center justify-between w-full sm:w-auto sm:justify-start gap-2.5">
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] sm:text-[12px] font-medium text-[#999999] uppercase tracking-widest">Timeframe:</span>
              </div>
              <select
                className="bg-[#2D2D2D] border border-[#404040] text-white text-[11px] sm:text-[13px] font-normal rounded-[6px] px-2 py-1 sm:px-4 sm:py-1.5 focus:outline-none focus:border-[#BFF367] transition-all font-inter uppercase tracking-wider"
                value={filterDays}
                onChange={(e) => setFilterDays(Number(e.target.value))}
              >
                <option value={7}>Last 7 Days</option>
                <option value={15}>Last 15 Days</option>
                <option value={30}>Last 30 Days</option>
              </select>
              
              <select
                className="bg-[#2D2D2D] border border-[#404040] text-white text-[11px] sm:text-[13px] font-normal rounded-[6px] px-2 py-1 sm:px-4 sm:py-1.5 focus:outline-none focus:border-[#BFF367] transition-all font-inter uppercase tracking-wider ml-2"
                onChange={(e) => setSortConfig({ key: 'bookingDate', direction: e.target.value })}
                defaultValue="descending"
              >
                <option value="descending">Latest</option>
                <option value="ascending">Oldest</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="w-full bg-[#121212] border border-white/5 rounded-[8px] overflow-hidden shadow-[var(--shadow-2)]">
          <div className="w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-[#1A1A1A]/50">
                  <th className="px-1 md:px-4 py-2 md:py-3 text-[#878C9F] text-[7px] md:text-[10px] uppercase tracking-widest font-semibold">Booking ID / Venue</th>
                  <th className="px-1 md:px-4 py-2 md:py-3 text-[#878C9F] text-[7px] md:text-[10px] uppercase tracking-widest font-semibold">Customer</th>
                  <th className="px-1 md:px-4 py-2 md:py-3 text-[#878C9F] text-[7px] md:text-[10px] uppercase tracking-widest font-semibold">Date & Time</th>
                  <th className="px-1 md:px-4 py-2 md:py-3 text-[#878C9F] text-[7px] md:text-[10px] uppercase tracking-widest font-semibold">Price</th>
                  <th className="px-1 md:px-4 py-2 md:py-3 text-[#878C9F] text-[7px] md:text-[10px] uppercase tracking-widest font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-[#BFF367]/5 transition-colors group">
                    {/* Ground Name & ID */}
                    <td className="px-1 md:px-4 py-2 md:py-3">
                      <div className="flex flex-col overflow-hidden w-[65px] sm:w-auto max-w-[200px]">
                         <p className="text-[10px] md:text-[13px] font-semibold text-white uppercase tracking-tight group-hover:text-[#BFF367] transition-colors truncate">{booking.turfName}</p>
                         <p className="text-[8px] md:text-[10px] font-normal text-[#878C9F] uppercase tracking-widest mt-0.5 truncate">ID: {booking.id.slice(-6)}</p>
                      </div>
                    </td>
                    
                    {/* User */}
                    <td className="px-1 md:px-4 py-2 md:py-3">
                      <div className="flex items-center gap-1 md:gap-2 overflow-hidden w-[65px] sm:w-auto max-w-[200px]">
                         <div className="hidden sm:flex w-6 h-6 md:w-8 md:h-8 rounded-[4px] md:rounded-[6px] bg-[#2D2D2D] items-center justify-center text-[10px] md:text-[12px] font-semibold text-white uppercase border border-[#404040] shrink-0">
                           {booking.userName[0]}
                         </div>
                         <div className="flex flex-col items-start overflow-hidden w-full">
                            <div className="flex flex-col w-full">
                               <p className="text-[10px] md:text-[12px] font-semibold text-white uppercase tracking-tight truncate">{booking.userName}</p>
                               {booking.bookingSource === "PARTNER_MANUAL" && (
                                 <span className="inline-block mt-0.5 md:mt-1 px-1 py-0.5 bg-[#BFF367]/10 border border-[#BFF367]/20 text-[#BFF367] text-[5px] md:text-[7px] font-bold uppercase tracking-widest rounded-[2px] w-max">
                                   <span className="sm:hidden">M</span><span className="hidden sm:inline">Manual</span>
                                 </span>
                               )}
                            </div>
                         </div>
                      </div>
                    </td>

                    {/* Timing & Dur */}
                    <td className="px-1 md:px-4 py-2 md:py-3">
                      <div className="flex flex-col gap-0.5 md:gap-1 overflow-hidden whitespace-nowrap">
                         <div className="flex items-center gap-1 md:gap-2 text-[8px] md:text-[11px] font-medium text-white tracking-tight">
                           <Calendar size={10} className="text-[#BFF367] hidden sm:block shrink-0" />
                           <span>{format(new Date(booking.bookingDate), "dd MMM yy")}</span>
                         </div>
                         <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 text-[8px] md:text-[11px] font-medium text-[#878C9F] tracking-tight">
                           <div className="flex items-center gap-1 md:gap-2">
                             <Clock size={10} className="text-[#BFF367]/50 hidden sm:block shrink-0" />
                             <span>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
                           </div>
                           <span className="opacity-70 text-[7px] md:text-[11px] hidden sm:inline">({booking.duration.toFixed(1)}H)</span>
                         </div>
                      </div>
                    </td>
                    
                    {/* Price */}
                    <td className="px-1 md:px-4 py-2 md:py-3">
                      <span className="text-[10px] md:text-[14px] font-bold text-[#BFF367] tracking-tight whitespace-nowrap">
                        Rs {booking.totalPrice.toLocaleString()}
                      </span>
                    </td>
                    
                    {/* Actions */}
                    <td className="px-1 md:px-4 py-2 md:py-3 text-right">
                      <div className="flex items-center justify-end gap-1 md:gap-2">
                          <Link
                            to={`/booking-pass/${booking.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 md:p-2 bg-[#1A1A1A] border border-white/5 hover:border-[#BFF367] hover:bg-[#BFF367]/10 hover:text-[#BFF367] rounded-[4px] md:rounded-[6px] transition-all text-[#999999]"
                            title="Open Ticket"
                          >
                            <Ticket className="w-3 h-3 md:w-[14px] md:h-[14px]" />
                          </Link>
                          <Link
                            to={`/booking-invoice/${booking.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 md:p-2 bg-[#BFF367] hover:bg-white text-black rounded-[4px] md:rounded-[6px] transition-all shadow-[0_5px_15px_rgba(204,255,0,0.15)]"
                            title="See Invoice"
                          >
                            <FileText className="w-3 h-3 md:w-[14px] md:h-[14px]" />
                          </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {bookings.length === 0 && (
              <div className="p-8 text-center text-[#878C9F] text-[12px] uppercase tracking-widest font-medium">
                No bookings found for the selected timeframe.
              </div>
            )}
          </div>
        </div>

        {/* Footer Metrics */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row gap-4 justify-between items-center opacity-40 text-center sm:text-left">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#999999]">
            Displaying {bookings.length} operational records | End of Feed
          </p>
          <div className="flex gap-4">
            <span className="text-[10px] font-medium uppercase tracking-widest">Kridaz Engine v1.4</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueOwnerBookings;

