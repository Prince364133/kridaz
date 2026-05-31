import { useState } from "react";
import { useSelector } from "react-redux";
import { Plus } from "lucide-react";
import { useGetStoriesFeedQuery, useDeleteStoryMutation } from "@redux/api/communityApi";
import StoryViewer from "./StoryViewer";
import CreateStoryModal from "./CreateStoryModal";
import toast from "react-hot-toast";

const StoriesSection = ({ user, isLoggedIn, isAdmin, gateInteraction }) => {
  const userLocation = useSelector((state) => state.ui.userLocation);
  const currentUserId = user?._id || user?.id;

  const { data: storiesData } = useGetStoriesFeedQuery(
    userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : undefined,
    { skip: !isLoggedIn }
  );

  const [deleteStory] = useDeleteStoryMutation();

  const [showStoryModal, setShowStoryModal] = useState(false);
  const [selectedStoryGroup, setSelectedStoryGroup] = useState(null);

  const stories = storiesData?.stories || [];
  const myStoryGroup = currentUserId ? stories.find((group) => (group.user?._id || group.user?.id) === currentUserId) : null;
  const otherStories = currentUserId ? stories.filter((group) => (group.user?._id || group.user?.id) !== currentUserId) : stories;

  const handleDeleteStory = async (storyId) => {
    if (!window.confirm("Are you sure you want to delete this story?")) return;
    try {
      await deleteStory(storyId).unwrap();
      toast.success("Story deleted");
      setSelectedStoryGroup(null);
    } catch (error) {
      toast.error(error?.data?.message || error.message || "Failed to delete story");
    }
  };

  const handleNextUser = () => {
    const getUserId = (g) => g?.user?._id || g?.user?.id;
    const isMyStory = myStoryGroup && getUserId(selectedStoryGroup) === getUserId(myStoryGroup);

    if (isMyStory) {
      setSelectedStoryGroup(null);
      return;
    }

    const currentIndex = otherStories.findIndex((g) => getUserId(g) === getUserId(selectedStoryGroup));
    if (currentIndex !== -1 && currentIndex < otherStories.length - 1) {
      setSelectedStoryGroup(otherStories[currentIndex + 1]);
    } else {
      setSelectedStoryGroup(null);
    }
  };

  const handlePrevUser = () => {
    const getUserId = (g) => g?.user?._id || g?.user?.id;
    const isMyStory = myStoryGroup && getUserId(selectedStoryGroup) === getUserId(myStoryGroup);

    if (isMyStory) return;

    const currentIndex = otherStories.findIndex((g) => getUserId(g) === getUserId(selectedStoryGroup));
    if (currentIndex > 0) {
      setSelectedStoryGroup(otherStories[currentIndex - 1]);
    }
  };

  return (
    <div className="py-2 px-1">
      <div className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth items-center pb-2">
        {/* Add/View Your Story */}
        <div className="flex flex-col items-center gap-2.5 shrink-0 group relative">
          <div
            className={`w-[68px] h-[68px] rounded-full relative transition-transform ${
              myStoryGroup ? "p-[2px] bg-gradient-to-r from-[#BFF367] to-[#BFF367]" : "border border-dashed border-white/30 group-hover:border-[#BFF367]/50 p-0.5"
            }`}
          >
            <div
              onClick={() => {
                if (myStoryGroup) {
                  setSelectedStoryGroup(myStoryGroup);
                } else {
                  gateInteraction(() => setShowStoryModal(true));
                }
              }}
              className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden bg-[#111] cursor-pointer ${
                myStoryGroup ? "border-2 border-[#0A0A0A]" : "border border-white/10"
              }`}
            >
              {myStoryGroup && myStoryGroup.stories[0].mediaUrl ? (
                <img
                  src={myStoryGroup.stories[0].thumbnailUrl || myStoryGroup.stories[0].mediaUrl}
                  className={`w-full h-full object-cover ${
                    myStoryGroup.stories.some((s) => s.status === "pending" || s.status === "processing") ? "blur-sm opacity-50" : ""
                  }`}
                  alt="Your story"
                />
              ) : myStoryGroup && myStoryGroup.stories[0].content ? (
                <div className="w-full h-full flex items-center justify-center text-[7px] p-2 text-center text-[#BFF367] font-bold bg-[#111]">
                  {myStoryGroup.stories[0].content?.slice(0, 15)}
                </div>
              ) : (
                <img
                  src={user?.profilePicture || user?.profileImage || "/default-avatar.png"}
                  className="w-full h-full object-cover opacity-60"
                  alt="Profile"
                />
              )}
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation();
                gateInteraction(() => setShowStoryModal(true));
              }}
              className="absolute bottom-0 right-0 w-[22px] h-[22px] bg-gradient-to-r from-[#BFF367] to-[#BFF367] rounded-full flex items-center justify-center border-2 border-[#0A0A0A] cursor-pointer hover:scale-110 transition-transform z-10"
            >
              <Plus size={12} strokeWidth={4} className="text-black" />
            </div>
          </div>
          <span
            onClick={() => {
              if (myStoryGroup) {
                setSelectedStoryGroup(myStoryGroup);
              } else {
                gateInteraction(() => setShowStoryModal(true));
              }
            }}
            className="text-[10px] font-bold text-white/60 group-hover:text-white transition-colors cursor-pointer"
          >
            Your story
          </span>
        </div>

        {/* Render Other Stories */}
        {otherStories.map((group, idx) => (
          <div
            key={group._id}
            onClick={() => setSelectedStoryGroup(group)}
            className="flex flex-col items-center gap-2.5 shrink-0 cursor-pointer group"
          >
            <div className={`w-[68px] h-[68px] rounded-full p-[2px] relative hover:scale-105 transition-transform ${idx === 0 ? "bg-gradient-to-r from-[#BFF367] to-[#BFF367]" : "bg-white/20"}`}>
              <div className="w-full h-full rounded-full bg-[#0A0A0A] p-[2px]">
                <div className="w-full h-full rounded-full overflow-hidden bg-[#111]">
                  {group.stories[0].mediaUrl ? (
                    <img
                      src={group.stories[0].thumbnailUrl || group.stories[0].mediaUrl}
                      alt=""
                      className={`w-full h-full object-cover ${
                        group.stories.some((s) => s.status === "pending" || s.status === "processing") ? "blur-sm opacity-50" : ""
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[7px] p-2 text-center text-[#BFF367] font-bold bg-[#111]">
                      {group.stories[0].content?.slice(0, 15)}
                    </div>
                  )}
                </div>
              </div>
              {idx === 0 && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 px-1.5 py-[2px] bg-red-500 rounded flex items-center text-[7px] font-black uppercase text-white shadow-lg tracking-wider border border-[#0A0A0A]">
                  LIVE
                </div>
              )}
            </div>
            <span className="text-[10px] font-bold text-white/80 group-hover:text-[#BFF367] transition-colors truncate max-w-[68px]">
              {group.user?.name?.split(" ")[0] || "Player"}
            </span>
          </div>
        ))}
      </div>

      <CreateStoryModal
        isOpen={showStoryModal}
        onClose={() => setShowStoryModal(false)}
        user={user}
      />

      {selectedStoryGroup && (
        <StoryViewer
          storyGroup={selectedStoryGroup}
          onClose={() => setSelectedStoryGroup(null)}
          onDelete={handleDeleteStory}
          currentUser={user}
          isAdmin={isAdmin}
          onNextUser={handleNextUser}
          onPrevUser={handlePrevUser}
        />
      )}
    </div>
  );
};

export default StoriesSection;
