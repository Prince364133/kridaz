import React from "react";
import useUsers from "@hooks/admin/useUsers";
import UserSkeleton from "./UserSkeleton";
import UserCard from "./UserCard";
import SearchInput from "./SearchInput";
import { Activity } from "lucide-react";

const UserPage = () => {
  const { users, loading, searchTerm, handleSearch } = useUsers();

  if (loading) return <UserSkeleton />;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 lg:p-10">
      <div className="space-y-12 lg:space-y-16 animate-fade-in relative">
        {/* Background Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#CCFF00]/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#CCFF00]/5 blur-[120px] pointer-events-none" />

        <div className="relative z-10 space-y-12">
          {/* Header Section */}
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-10 border-b border-[#2D2D2D] pb-10">
            <div className="relative">
              <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-14 bg-[#CCFF00] rounded-full shadow-[0_0_25px_rgba(204,255,0,0.5)]"></div>
              <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-4">
                Platform <span className="text-[#CCFF00]">Users</span>
              </h1>
              <p className="admin-subheading text-[#999999]">
                Global Identity Directory • User Telemetry
              </p>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-full md:w-80">
                <SearchInput searchTerm={searchTerm} handleSearch={handleSearch} />
              </div>
              <div className="px-5 py-2.5 bg-[#CCFF00]/10 border border-[#CCFF00]/20 rounded-full">
                <span className="text-[10px] font-black text-[#CCFF00] uppercase tracking-widest">
                  Total: {users.length} Active
                </span>
              </div>
            </div>
          </div>

          {/* User List Table */}
          <div className="space-y-6">
            {/* Table Header */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-4 bg-[#0d0d0d] border border-[#2D2D2D] rounded-[12px] text-[10px] font-black text-[#878C9F] uppercase tracking-[0.2em] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
              <div className="col-span-4">User Profile</div>
              <div className="col-span-3">Contact Email</div>
              <div className="col-span-2">Registration Date</div>
              <div className="col-span-2">Account Status</div>
              <div className="col-span-1 text-right">Action</div>
            </div>

            {users.length === 0 ? (
              <div className="relative p-20 rounded-[16px] border border-[#2D2D2D] bg-[#000000] text-center overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[#CCFF00]/5 blur-[100px]"></div>
                <div className="relative space-y-4">
                  <p className="text-2xl font-black text-white uppercase tracking-tighter">No Users Found</p>
                  <p className="admin-subheading text-[#999999]">The identity database is currently empty.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPage;
