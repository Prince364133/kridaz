import useOwnerBookings from "@hooks/owner/useOwnerBookings";
import BookingsSkeleton from "./BookingsSkeleton";
import { format, subHours, subMinutes } from "date-fns";
import { ArrowUpDown, Calendar, Clock, User, IndianRupee } from "lucide-react";
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
  if (error) return <div className="alert alert-error shadow-lg">{error}</div>;

  const getSortDirection = (name) => {
    if (!sortConfig) {
      return;
    }
    return sortConfig.key === name ? sortConfig.direction : undefined;
  };

  const formatTime = (dateString) => {
    // Subtract 5 hours and 30 minutes from the time
    const adjustedDate = subMinutes(subHours(new Date(dateString), 5), 30);
    return format(adjustedDate, "h:mm aa");
  };

  return (
    <div className="p-4 md:p-8 bg-[#0a0a0a] min-h-screen text-white">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6 border-l-8 border-primary pl-6">
          <div>
            <h1 className="text-4xl md:text-6xl font-display font-black italic tracking-tighter text-white">
              BOOKINGS <span className="text-primary">OVERVIEW</span>
            </h1>
            <p className="text-gray-500 font-secondary uppercase tracking-widest mt-2">
              Elite Venue Management | BookMySportz
            </p>
          </div>
          
          <div className="stats bg-[#151515] border border-gray-800 shadow-2xl rounded-xl overflow-hidden">
            <div className="stat px-8 py-4">
              <div className="stat-title text-gray-500 font-secondary uppercase text-xs">Total Active Bookings</div>
              <div className="stat-value text-primary font-display italic text-4xl">{bookings.length}</div>
              <div className="stat-desc text-gray-600 font-mono text-[10px]">SYNCED REAL-TIME</div>
            </div>
          </div>
        </header>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-gray-500 uppercase">Filter Range:</span>
            <select
              className="select select-bordered border-gray-800 bg-[#151515] text-primary focus:border-primary w-full md:w-auto font-secondary"
              value={filterDays}
              onChange={(e) => setFilterDays(Number(e.target.value))}
            >
              <option value={7}>LAST 7 DAYS</option>
              <option value={15}>LAST 15 DAYS</option>
              <option value={30}>LAST 30 DAYS</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto bg-[#111] border border-gray-800 shadow-2xl rounded-xl">
          <table className="table w-full">
            <thead>
              <tr className="bg-[#1a1a1a] border-b border-gray-800">
                <th className="font-secondary text-gray-400 uppercase tracking-wider py-5">Arena</th>
                <th className="font-secondary text-gray-400 uppercase tracking-wider py-5">Athlete</th>
                <th
                  onClick={() => requestSort("startTime")}
                  className="cursor-pointer font-secondary text-gray-400 uppercase tracking-wider py-5 hover:text-primary transition-colors"
                >
                  Start Time{" "}
                  {getSortDirection("startTime") && (
                    <ArrowUpDown size={14} className="inline ml-1" />
                  )}
                </th>
                <th
                  onClick={() => requestSort("endTime")}
                  className="cursor-pointer font-secondary text-gray-400 uppercase tracking-wider py-5 hover:text-primary transition-colors"
                >
                  End Time{" "}
                  {getSortDirection("endTime") && (
                    <ArrowUpDown size={14} className="inline ml-1" />
                  )}
                </th>
                <th
                  onClick={() => requestSort("bookingDate")}
                  className="cursor-pointer font-secondary text-gray-400 uppercase tracking-wider py-5 hover:text-primary transition-colors"
                >
                  Date{" "}
                  {getSortDirection("bookingDate") && (
                    <ArrowUpDown className="inline ml-1" size={14} />
                  )}
                </th>
                <th className="font-secondary text-gray-400 uppercase tracking-wider py-5">Duration</th>
                <th
                  onClick={() => requestSort("totalPrice")}
                  className="cursor-pointer font-secondary text-gray-400 uppercase tracking-wider py-5 hover:text-primary transition-colors text-right"
                >
                  Price{" "}
                  {getSortDirection("totalPrice") && (
                    <ArrowUpDown size={14} className="inline ml-1" />
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-[#1a1a1a] transition-colors group">
                  <td className="whitespace-nowrap font-bold text-white group-hover:text-primary transition-colors">
                    {booking.turfName}
                  </td>
                  <td>
                    <div className="flex items-center space-x-3">
                      <Avatar name={booking.userName} size="28" round="true" color="#71B300" fgColor="#000" />
                      <div className="hidden md:block font-secondary text-gray-300 text-sm">
                        {booking.userName}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap text-gray-400 font-mono text-xs">
                    <Clock size={12} className="inline mr-2 text-primary" />
                    {formatTime(booking.startTime)}
                  </td>
                  <td className="whitespace-nowrap text-gray-400 font-mono text-xs">
                    <Clock size={12} className="inline mr-2 text-primary" />
                    {formatTime(booking.endTime)}
                  </td>
                  <td className="whitespace-nowrap text-gray-300 font-secondary">
                    <Calendar size={12} className="inline mr-2 text-primary" />
                    {format(new Date(booking.bookingDate), "dd MMM yyyy")}
                  </td>
                  <td className="font-mono text-xs text-gray-500">{booking.duration.toFixed(1)}H</td>
                  <td className="text-right">
                    <span className="bg-primary text-black font-display italic px-3 py-1 rounded text-lg">
                      ₹{booking.totalPrice}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-8 text-[10px] font-mono text-gray-700 uppercase tracking-[0.2em] text-center">
          End of List | BookMySportz Management Protocol
        </div>
      </div>
    </div>
  );
};

export default OwnerBookings;
