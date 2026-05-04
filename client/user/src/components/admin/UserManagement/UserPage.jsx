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
      <div className="space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-[#84CC16] font-bold text-xs uppercase tracking-widest">
             <Activity size={14} className="animate-pulse" />
             <span>User Management</span>
          </div>
          <div className="relative">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight uppercase text-white">
              Platform <span className="text-[#84CC16]">Users</span>
            </h1>
            <p className="text-gray-400 text-sm mt-2">Manage and verify registered users across the platform.</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
           <div className="w-full max-w-xl">
            <SearchInput
              searchTerm={searchTerm}
              handleSearch={handleSearch}
            />
          </div>
          <div className="font-bold text-xs text-gray-500 uppercase tracking-widest hidden md:block">
            ACTIVE USERS: {users.length}
          </div>
        </div>

        {users.length === 0 ? (
          <div className="relative p-12 rounded-2xl border border-white/10 bg-[#111] text-center overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[#84CC16]/5 blur-[100px]"></div>
            <div className="relative space-y-4">
               <p className="font-bold text-2xl text-gray-400">No Users Found</p>
               <p className="text-sm text-gray-500">No matching user records found in the database.</p>
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
