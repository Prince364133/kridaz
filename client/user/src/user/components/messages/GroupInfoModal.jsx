import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useUpdateGroupMutation, useRemoveFromGroupMutation, useAddToGroupMutation, useGetFollowersFollowingQuery, useMakeGroupAdminMutation, useDismissGroupAdminMutation, useDeleteChatMutation } from '../../../redux/api/chatApi';
import { Camera } from 'lucide-react';
import ConfirmModal from '../modals/ConfirmModal';

const GroupInfoModal = ({ isOpen, onClose, chat }) => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [groupName, setGroupName] = useState(chat?.chatName || "");
  const [isEditingName, setIsEditingName] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [groupDescription, setGroupDescription] = useState(chat?.description || "");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const searchInputRef = useRef(null);
  const addMembersRef = useRef(null);
  const groupImageInputRef = useRef(null);
  const [localGroupImage, setLocalGroupImage] = useState(chat?.groupImage || null);
  
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const openConfirmModal = (title, message, onConfirm) => {
    setConfirmModalConfig({
      isOpen: true,
      title,
      message,
      onConfirm,
    });
  };

  // Sync state with chat prop changes (triggered by RTK Query cache invalidation)
  useEffect(() => {
    if (chat) {
      setGroupName(chat.chatName || "");
      setGroupDescription(chat.description || "");
      setLocalGroupImage(chat.groupImage || null);
    }
  }, [chat?._id, chat?.chatName, chat?.description, chat?.groupImage]);
  
  const [updateGroup] = useUpdateGroupMutation();
  const [removeFromGroup] = useRemoveFromGroupMutation();
  const [addToGroup] = useAddToGroupMutation();
  const [makeGroupAdmin] = useMakeGroupAdminMutation();
  const [dismissGroupAdmin] = useDismissGroupAdminMutation();
  const [deleteChatMutation] = useDeleteChatMutation();
  const { data: networkData } = useGetFollowersFollowingQuery();
  const [activeMenu, setActiveMenu] = useState(null); // Track which user's menu is open
  const menuRef = useRef(null);

  // Close menu on click outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen || !chat) return null;

  const myIds = [user?._id, user?.id, user?.userId, user?.ownerId].filter(Boolean);
  const groupAdmins = chat.groupAdmins || [];
  
  // Robust Admin Check: Check IDs and also check if current user is 'You' in participants list with admin status
  const isAdmin = useMemo(() => {
    // 1. Direct admin check
    const isDirectAdmin = groupAdmins.some(admin => {
      const adminUserId = (admin.user?._id || admin.user)?.toString();
      return myIds.some(myId => myId?.toString() === adminUserId);
    });
    if (isDirectAdmin) return true;

    // 2. Chat users check (if data is partially hydrated)
    const isUserAdmin = chat.users?.some(u => {
      const uid = (u.user?._id || u.user)?.toString();
      const isMe = myIds.some(myId => myId?.toString() === uid);
      const isMemberAdmin = groupAdmins.some(admin => (admin.user?._id || admin.user)?.toString() === uid);
      return isMe && isMemberAdmin;
    });
    return isUserAdmin || false;
  }, [chat.groupAdmins, chat.users, myIds]);

  const handleRename = async () => {
    if (!groupName || groupName === chat.chatName) {
      setIsEditingName(false);
      return;
    }
    try {
      await updateGroup({ chatId: chat._id, chatName: groupName }).unwrap();
      setIsEditingName(false);
    } catch (err) {
      console.error("Failed to rename group", err);
    }
  };

  const handleUpdateDescription = async () => {
    try {
      await updateGroup({ chatId: chat._id, description: groupDescription }).unwrap();
      setIsEditingDesc(false);
    } catch (err) {
      console.error("Failed to update description", err);
    }
  };

  const handleGroupImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const imageUrl = URL.createObjectURL(file);
      setLocalGroupImage(imageUrl); // Optimistic update

      const formData = new FormData();
      formData.append("chatId", chat._id);
      formData.append("groupImage", file);
      
      await updateGroup(formData).unwrap();
    } catch (err) {
      console.error("Failed to update group image", err);
      setLocalGroupImage(chat?.groupImage || null); // Rollback on error
    }
  };

  const handleRemove = async (userId) => {
    openConfirmModal(
        "Remove Member",
        "Are you sure you want to remove this user from the group?",
        async () => {
          try {
            await removeFromGroup({ chatId: chat._id, userId }).unwrap();
          } catch (err) {
            console.error("Failed to remove user", err);
          }
        }
      );
  };

  const handleLeaveGroup = async () => {
    openConfirmModal(
      "Exit and Delete Group",
      "Are you sure you want to exit and permanently delete this group?",
      async () => {
        try {
          await deleteChatMutation(chat._id).unwrap();
          onClose();
          window.location.reload();
        } catch (err) {
          console.error("Failed to leave/delete group", err);
        }
      }
    );
  };

  const handleAddUser = async (userId) => {
    try {
      await addToGroup({ chatId: chat._id, userId }).unwrap();
    } catch (err) {
      console.error("Failed to add user", err);
    }
  };
  
  const handleMakeAdmin = async (userId) => {
    openConfirmModal(
        "Make Admin",
        "Make this participant a group admin?",
        async () => {
          try {
            await makeGroupAdmin({ chatId: chat._id, userId }).unwrap();
          } catch (err) {
            console.error("Failed to make admin", err);
          }
        }
      );
  };

  const handleDismissAdmin = async (userId) => {
    openConfirmModal(
        "Dismiss Admin",
        "Dismiss this participant as group admin?",
        async () => {
          try {
            await dismissGroupAdmin({ chatId: chat._id, userId }).unwrap();
          } catch (err) {
            console.error("Failed to dismiss admin", err);
          }
        }
      );
  };

  const connections = [
    ...(networkData?.followers || []),
    ...(networkData?.following || [])
  ].filter((v, i, a) => a.findIndex(t => t._id === v._id) === i);

  // Users not currently in the group
  const [globalUsers, setGlobalUsers] = useState([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);

  const availableUsers = connections.filter(c => {
    const connectionId = c._id?.toString();
    const isInGroup = chat.users?.some(u => (u.user?._id || u.user)?.toString() === connectionId);
    const isPending = chat.pendingMembers?.some(p => (p.user?._id || p.user)?.toString() === connectionId);
    return !isInGroup && !isPending;
  });

  // Global search for users
  useEffect(() => {
    if (searchQuery.length > 2 && isAdmin) {
      const delayDebounceFn = setTimeout(async () => {
        setIsSearchingGlobal(true);
        try {
          const response = await fetch(`/api/user/search?q=${searchQuery}`);
          const data = await response.json();
          // Filter out users already in group
          const filtered = (data.users || []).filter(u => {
            const uid = u._id?.toString();
            const isInGroup = chat.users?.some(gu => (gu.user?._id || gu.user)?.toString() === uid);
            const isPending = chat.pendingMembers?.some(gp => (gp.user?._id || gp.user)?.toString() === uid);
            return !isInGroup && !isPending;
          });
          setGlobalUsers(filtered);
        } catch (err) {
          console.error("Global search failed", err);
        } finally {
          setIsSearchingGlobal(false);
        }
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    } else {
      setGlobalUsers([]);
    }
  }, [searchQuery, isAdmin, chat.users, chat.pendingMembers]);

  return (
    <>
      {/* Overlay to catch clicks outside the drawer on smaller screens if needed */}
      {isOpen && (
        <div 
          className="absolute inset-0 bg-black/20 z-40"
          onClick={onClose}
        />
      )}

      {/* Sliding Drawer */}
      <div 
        className={`absolute top-0 right-0 h-full w-full sm:w-[380px] bg-[#0a0a0a] border-l border-white/10 z-50 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header - WhatsApp Style */}
        <div className="bg-[#111111] border-b border-white/10 px-5 py-4 flex items-center gap-4 shrink-0 shadow-sm">
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-base font-bold text-white tracking-wide">Group info</h2>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          
          {/* Main Info Section (Avatar + Name) */}
          <div className="bg-[#111111] py-8 px-6 flex flex-col items-center mb-2 shadow-sm">
            <div 
              className={`w-40 h-40 rounded-full border border-white/5 bg-[#84CC16]/10 flex items-center justify-center mb-6 overflow-hidden relative group/avatar ${isAdmin ? 'cursor-pointer' : ''}`}
              onClick={() => isAdmin && groupImageInputRef.current?.click()}
            >
              {localGroupImage ? (
                <img src={localGroupImage} className="w-full h-full object-cover" alt="" />
              ) : (
                <svg className="w-20 h-20 text-[#84CC16] opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              )}

              {isAdmin && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all">
                  <Camera size={32} className="text-[#84CC16] mb-2" />
                  <span className="text-[10px] text-[#84CC16] font-black uppercase tracking-[0.2em]">Change Photo</span>
                </div>
              )}
              <input 
                type="file" 
                ref={groupImageInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleGroupImageUpload}
              />
            </div>
            
            {isEditingName ? (
              <div className="flex flex-col gap-2 w-full">
                <div className="flex items-center gap-2 border-b-2 border-[#84CC16] pb-1">
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="flex-1 bg-transparent text-white text-lg font-medium outline-none"
                    autoFocus
                  />
                  <span className="text-white/30 text-sm">{25 - groupName.length}</span>
                </div>
                <div className="flex justify-end gap-3 mt-2">
                  <button onClick={() => setIsEditingName(false)} className="text-white/40 hover:text-white/80 text-sm font-medium">Cancel</button>
                  <button onClick={handleRename} className="bg-[#84CC16] text-black px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">Save</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center group/edit">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-medium text-white">{chat.chatName}</h3>
                  {isAdmin && (
                    <button onClick={() => setIsEditingName(true)} className="text-white/20 group-hover/edit:text-white/60 hover:!text-[#84CC16] transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="text-white/40 text-sm mt-1">{chat.users?.length} participants</p>
              </div>
            )}
          </div>

          {/* Group Description Section */}
          <div className="bg-[#111111] py-4 px-6 mb-2 shadow-sm group/desc">
             <div className="flex justify-between items-center mb-1">
               <span className="text-[13px] font-medium text-[#84CC16]">Description</span>
               {isAdmin && !isEditingDesc && (
                 <button 
                   onClick={() => setIsEditingDesc(true)}
                   className="text-white/20 group-hover/desc:text-white/60 hover:!text-[#84CC16] transition-colors"
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                 </button>
               )}
             </div>
             
             {isEditingDesc ? (
               <div className="mt-2">
                 <textarea
                   value={groupDescription}
                   onChange={(e) => setGroupDescription(e.target.value)}
                   className="w-full bg-white/[0.03] border border-[#84CC16]/30 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#84CC16] transition-all min-h-[100px] resize-none"
                   placeholder="Write something about this group..."
                   autoFocus
                 />
                 <div className="flex justify-end gap-3 mt-2">
                   <button 
                     onClick={() => {
                       setIsEditingDesc(false);
                       setGroupDescription(chat.description || "");
                     }} 
                     className="text-white/40 hover:text-white/80 text-xs font-medium"
                   >
                     Cancel
                   </button>
                   <button 
                     onClick={handleUpdateDescription}
                     className="bg-[#84CC16] text-black px-4 py-1.5 rounded-full text-xs font-bold"
                   >
                     Save
                   </button>
                 </div>
               </div>
             ) : (
               <p className="text-white/80 text-[15px] leading-relaxed whitespace-pre-wrap">
                 {chat.description || "No description provided. Click to add one."}
               </p>
             )}
          </div>

          {/* WhatsApp Style Action Buttons */}
          <div className="flex gap-4 px-6 mb-6">
            {isAdmin && (
              <button 
                className="flex-1 flex flex-col items-center gap-2 py-3 bg-white/[0.03] hover:bg-white/[0.06] rounded-2xl border border-white/5 transition-all"
                onClick={() => {
                  if (addMembersRef.current) {
                    addMembersRef.current.scrollIntoView({ behavior: 'smooth' });
                    setTimeout(() => searchInputRef.current?.focus(), 500);
                  }
                }}
              >
                <div className="w-10 h-10 rounded-full bg-[#84CC16]/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#84CC16]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <span className="text-[13px] font-medium text-white/80">Add</span>
              </button>
            )}
            <button 
              className="flex-1 flex flex-col items-center gap-2 py-3 bg-white/[0.03] hover:bg-white/[0.06] rounded-2xl border border-white/5 transition-all"
              onClick={() => {
                onClose();
                // Custom event to trigger search in ChatWindow
                window.dispatchEvent(new CustomEvent('focus-chat-search'));
              }}
            >
              <div className="w-10 h-10 rounded-full bg-[#84CC16]/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#84CC16]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <span className="text-[13px] font-medium text-white/80">Search</span>
            </button>
          </div>

          {/* Add Members Section (Admin only) */}
          {isAdmin && (
            <div ref={addMembersRef} className="bg-[#111111] py-4 px-6 mb-2 shadow-sm space-y-4">
              <h4 className="text-[13px] font-medium text-[#84CC16]">Add Members</h4>
              <div className="relative">
                <input
                  type="text"
                  ref={searchInputRef}
                  placeholder="Search your network or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#1A1A1A] border-none rounded-lg pl-10 pr-4 py-2.5 text-white outline-none text-sm placeholder:text-white/30"
                />
                <svg className="w-4 h-4 text-white/30 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                {isSearchingGlobal && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#84CC16]"></div>
                  </div>
                )}
              </div>
              
              <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar -mx-2 px-2">
                {/* Network Results */}
                {availableUsers
                  .filter(u => u.name?.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(user => (
                    <div key={`net-${user._id}`} className="flex justify-between items-center hover:bg-white/[0.03] p-2 rounded-lg cursor-pointer transition-colors group">
                      <div className="flex items-center gap-3">
                        <img src={user.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} className="w-9 h-9 rounded-full object-cover" alt="" />
                        <div>
                          <p className="text-white text-[14px] font-medium leading-tight">{user.name}</p>
                          <p className="text-white/40 text-[11px] mt-0.5">@{user.username}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleAddUser(user._id)}
                        className="text-[#84CC16] p-1.5 rounded-full hover:bg-[#84CC16]/10 transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                      </button>
                    </div>
                ))}

                {/* Global Results (if network search is empty or query is long) */}
                {globalUsers.length > 0 && (
                  <>
                    <div className="text-[10px] uppercase tracking-widest text-white/30 font-bold mt-4 mb-2 px-2">Global Search</div>
                    {globalUsers.map(user => (
                      <div key={`glob-${user._id}`} className="flex justify-between items-center hover:bg-white/[0.03] p-2 rounded-lg cursor-pointer transition-colors group">
                        <div className="flex items-center gap-3">
                          <img src={user.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} className="w-9 h-9 rounded-full object-cover" alt="" />
                          <div>
                            <p className="text-white text-[14px] font-medium leading-tight">{user.name}</p>
                            <p className="text-white/40 text-[11px] mt-0.5">@{user.username}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleAddUser(user._id)}
                          className="text-[#84CC16] p-1.5 rounded-full hover:bg-[#84CC16]/10 transition-all"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                        </button>
                      </div>
                    ))}
                  </>
                )}

                {searchQuery.length > 0 && availableUsers.length === 0 && globalUsers.length === 0 && !isSearchingGlobal && (
                  <p className="text-center py-4 text-white/30 text-xs italic">No users found</p>
                )}
              </div>
            </div>
          )}

          {/* Additional Menu Items */}
          <div className="bg-[#111111] mb-2 shadow-sm">
            <button 
              onClick={() => alert("Starred messages feature coming soon!")}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors border-b border-white/5"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976 2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                <span className="text-[15px] font-medium text-white/90">Starred messages</span>
              </div>
              <svg className="w-4 h-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          {/* Participants List */}
          <div className="bg-[#111111] py-4 shadow-sm mb-2">
            <h4 className="text-[13px] font-medium text-white/50 px-6 mb-3">{chat.users?.length || 0} participants</h4>
            
            <div className="flex flex-col">
              {/* Active Members */}
              {chat.users?.map((u, i) => {
                const uid = (u.user?._id || u.user)?.toString();
                const isMe = myIds.some(myId => myId?.toString() === uid);

                return (
                  <div 
                    key={`active-${uid}-${i}`} 
                    className="flex justify-between items-center hover:bg-white/[0.03] px-6 py-3 cursor-pointer transition-colors group/member"
                    onClick={() => uid && navigate(`/profile/${uid}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center overflow-hidden shrink-0">
                        {u.user?.profilePicture ? (
                          <img src={u.user.profilePicture} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <svg className="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        )}
                      </div>
                      <div className="flex flex-col justify-center">
                        <div className="flex items-center gap-2">
                          <p className="text-white text-[15px] leading-tight">
                            {isMe ? "You" : (u.user?.name || "Unknown")}
                          </p>
                          {groupAdmins.some(admin => (admin.user?._id || admin.user)?.toString() === uid?.toString()) && (
                            <span className="text-[9px] font-black text-[#84CC16]/60 border border-[#84CC16]/20 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                              Group Admin
                            </span>
                          )}
                        </div>
                        <p className="text-white/40 text-[13px] leading-tight mt-0.5">
                          {u.user?.bio || u.user?.username || "Available"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="relative">
                      {isAdmin && !isMe && (
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setActiveMenu(activeMenu === uid ? null : uid); 
                          }}
                          className={`p-2 rounded-full transition-all ${activeMenu === uid ? 'bg-white/10 text-[#84CC16]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z" />
                          </svg>
                        </button>
                      )}

                      {/* Dropdown Menu */}
                      {activeMenu === uid && (
                        <div 
                          ref={menuRef}
                          className="absolute right-0 top-0 w-48 bg-[#232323] border border-white/10 rounded-xl shadow-2xl py-2 z-[100] animate-scale-up"
                          style={{ transform: 'translateY(-50%)' }} // Better positioning
                        >
                          {groupAdmins.some(admin => (admin.user?._id || admin.user)?.toString() === uid?.toString()) ? (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDismissAdmin(uid); setActiveMenu(null); }}
                              className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                            >
                              Dismiss as admin
                            </button>
                          ) : (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleMakeAdmin(uid); setActiveMenu(null); }}
                              className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                            >
                              Make group admin
                            </button>
                          )}
                          
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleRemove(uid); setActiveMenu(null); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/5 transition-colors"
                          >
                            Remove {u.user?.name || "member"}
                          </button>
                          
                          <button 
                            onClick={(e) => { e.stopPropagation(); setActiveMenu(null); }}
                            className="w-full text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-bold text-white/20 hover:text-white/40 transition-colors border-t border-white/5 mt-1 pt-2 text-center"
                          >
                            Close
                          </button>
                        </div>
                      )}

                      {/* Static Admin Badge (Always visible) */}
                      {!activeMenu && groupAdmins.some(admin => (admin.user?._id || admin.user)?.toString() === uid?.toString()) && (
                        <span className="bg-[#84CC16]/10 text-[#84CC16] text-[10px] font-black px-1.5 py-0.5 rounded-[4px] uppercase tracking-tight shrink-0 mr-1 border border-[#84CC16]/20">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Pending Members */}
              {chat.pendingMembers?.length > 0 && (
                <>
                  <div className="w-full h-px bg-white/5 my-2"></div>
                  <h4 className="text-[13px] font-medium text-yellow-500/80 px-6 my-2">{chat.pendingMembers.length} pending invites</h4>
                  {chat.pendingMembers.map((u, i) => {
                    const uid = (u.user?._id || u.user)?.toString();
                    return (
                      <div key={`pending-${uid}-${i}`} className="flex justify-between items-center hover:bg-white/[0.03] px-6 py-3 transition-colors opacity-70 group/pending">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full border border-dashed border-white/20 bg-transparent flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          </div>
                          <div className="flex flex-col justify-center">
                            <p className="text-white/80 text-[15px] italic leading-tight">{u.user?.name || "Pending User"}</p>
                            <p className="text-yellow-500/60 text-[11px] leading-tight mt-0.5">Invite sent</p>
                          </div>
                        </div>
                        {isAdmin && (
                          <button 
                            onClick={() => handleRemove(uid)}
                            className="text-red-400 opacity-0 group-hover/pending:opacity-100 hover:bg-red-500/10 p-1.5 rounded-full transition-all"
                            title="Cancel Invite"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* Action Footer (Leave Group) */}
          <div className="bg-[#111111] py-2 shadow-sm mb-10">
            <button 
              onClick={handleLeaveGroup}
              className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/[0.03] text-[#EF4444] transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-[15px] font-medium tracking-wide">Exit and delete group</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        onClose={() => setConfirmModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModalConfig.onConfirm}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
      />
    </>
  );
};

export default GroupInfoModal;
