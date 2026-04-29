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
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Telemetry Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-primary font-mono text-[10px] uppercase tracking-[0.4em]">
             <Activity size={14} className="animate-pulse" />
             <span>System Layer: User Intelligence</span>
          </div>
          <div className="relative">
            <h1 className="text-6xl md:text-8xl font-display font-black italic tracking-tighter leading-none uppercase text-white">
              Elite <span className="text-primary">Players</span>
            </h1>
            <p className="font-mono text-gray-500 text-sm tracking-[0.4em] uppercase mt-4">Global Player Database & Verification</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
           <div className="w-full max-w-xl">
            <SearchInput
              searchTerm={searchTerm}
              handleSearch={handleSearch}
            />
          </div>
          <div className="font-mono text-[10px] text-gray-600 uppercase tracking-widest hidden md:block">
            ACTIVE_PLAYER_COUNT: {users.length}
          </div>
        </div>

        {users.length === 0 ? (
          <div className="relative p-12 notched-corner border border-white/5 bg-[#111111] text-center overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-primary/5 blur-[100px]"></div>
            <div className="relative space-y-4">
               <p className="font-display font-black italic text-2xl uppercase tracking-wider text-gray-400">No Players Detected</p>
               <p className="font-mono text-xs text-gray-600 uppercase tracking-widest">No matching user records found in the supreme database.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPage;
