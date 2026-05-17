import { prisma } from "../../config/prisma.js";
import { uploadToCloudinary } from "../../utils/cloudinary.js";
import { getIO } from "../../config/socket.js";

import logger from "../../utils/logger.js";
import { SOCKET } from "@kridaz/shared-constants/socketEvents";


// Helper: resolve the correct user IDs and model for the current request
function resolveCurrentUser(req) {
  const isOwner = req.user?.role?.includes("venu_owners") || req.user?.role === "owner" || req.owner?.role?.includes("venu_owners") || req.owner?.role === "owner";

  const currentUserId = isOwner
    ? (req.user?.ownerId || req.owner?.ownerId || req.user?.id || req.owner?.id)
    : (req.user?.id || req.user?.userId);

  const currentUserModel = isOwner ? "Owner" : "User";
  
  // For Prisma, we need to know if the ID refers to userId or ownerId
  const participantData = isOwner 
    ? { ownerId: currentUserId, userId: null, onModel: "Owner" }
    : { userId: currentUserId, ownerId: null, onModel: "User" };

  return { currentUserId, currentUserModel, participantData };
}

// Helper: check if a user is an admin in a chat
async function checkIsAdmin(chatId, participantData) {
  const participant = await prisma.chatParticipant.findFirst({
    where: {
      chatId,
      userId: participantData.userId,
      ownerId: participantData.ownerId,
      isAdmin: true
    }
  });
  return !!participant;
}

/**
 * Access or create a one-on-one chat
 */
export const accessChat = async (req, res) => {
  const { userId, onModel = "User" } = req.body;
  const { participantData: currentParticipant } = resolveCurrentUser(req);

  if (!userId) return res.sendStatus(400);

  const targetParticipant = onModel === "Owner"
    ? { ownerId: userId, userId: null, onModel: "Owner" }
    : { userId: userId, ownerId: null, onModel: "User" };

  try {
    // Find existing 1-on-1 chat
    const existingChats = await prisma.chat.findMany({
      where: {
        isGroupChat: false,
        participants: {
          some: {
            OR: [
              { userId: currentParticipant.userId, ownerId: currentParticipant.ownerId },
              { userId: targetParticipant.userId, ownerId: targetParticipant.ownerId }
            ]
          }
        }
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, profilePicture: true, email: true } },
            owner: { select: { id: true, businessName: true, user: { select: { profilePicture: true, name: true } } } }
          }
        },
        latestMessage: {
          include: {
            senderUser: { select: { name: true, profilePicture: true } },
            senderOwner: { select: { businessName: true } }
          }
        }
      }
    });

    // Filter for exact match (only these two participants)
    const chat = existingChats.find(c => 
      c.participants.length === 2 &&
      c.participants.some(p => (p.userId === currentParticipant.userId && p.ownerId === currentParticipant.ownerId)) &&
      c.participants.some(p => (p.userId === targetParticipant.userId && p.ownerId === targetParticipant.ownerId))
    );

    if (chat) {
      return res.status(200).json(chat);
    }

    // Create new 1-on-1 chat
    const newChat = await prisma.chat.create({
      data: {
        isGroupChat: false,
        participants: {
          create: [
            { 
              userId: currentParticipant.userId, 
              ownerId: currentParticipant.ownerId, 
              onModel: currentParticipant.onModel 
            },
            { 
              userId: targetParticipant.userId, 
              ownerId: targetParticipant.ownerId, 
              onModel: targetParticipant.onModel 
            }
          ]
        }
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, profilePicture: true, email: true } },
            owner: { select: { id: true, businessName: true, user: { select: { profilePicture: true, name: true } } } }
          }
        }
      }
    });

    return res.status(200).json(newChat);
  } catch (error) {
    logger.error("Error in accessChat:", error);
    return res.status(400).json({ message: error.message });
  }
};

/**
 * Fetch all chats for the current user
 */
export const fetchChats = async (req, res) => {
  const { participantData } = resolveCurrentUser(req);

  try {
    // Fetch all chats where the user is a participant (active or pending)
    const chats = await prisma.chat.findMany({
      where: {
        participants: {
          some: {
            userId: participantData.userId,
            ownerId: participantData.ownerId
          }
        }
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, profilePicture: true, email: true } },
            owner: { 
              include: { user: { select: { name: true, profilePicture: true } } }
            }
          }
        },
        latestMessage: {
          include: {
            senderUser: { select: { name: true, profilePicture: true } },
            senderOwner: { 
              include: { user: { select: { name: true, profilePicture: true } } }
            }
          }
        },
        parentCommunity: true
      },
      orderBy: { updatedAt: "desc" }
    });

    // Separate active chats and invitations based on isPending
    const invitations = chats.filter(chat => {
      const self = chat.participants.find(p => 
        p.userId === participantData.userId && p.ownerId === participantData.ownerId
      );
      return self && self.isPending;
    });

    const activeChats = chats.filter(chat => {
      const self = chat.participants.find(p => 
        p.userId === participantData.userId && p.ownerId === participantData.ownerId
      );
      return self && !self.isPending;
    });

    // For communities, we might also want to show sub-groups even if not joined yet
    // This part of legacy logic was complex, keeping it similar but optimized
    const communityIds = activeChats
      .filter(c => c.isCommunity)
      .map(c => c.id);
    
    if (communityIds.length > 0) {
      const subGroups = await prisma.chat.findMany({
        where: {
          parentCommunityId: { in: communityIds },
          id: { notIn: activeChats.map(c => c.id) }
        },
        include: {
          participants: {
            include: {
              user: { select: { id: true, name: true, profilePicture: true, email: true } },
              owner: { include: { user: { select: { name: true, profilePicture: true } } } }
            }
          },
          latestMessage: {
            include: {
              senderUser: { select: { name: true, profilePicture: true } },
              senderOwner: { include: { user: { select: { name: true, profilePicture: true } } } }
            }
          }
        }
      });
      activeChats.push(...subGroups);
    }

    return res.status(200).json({
      chats: activeChats,
      invitations: invitations,
    });
  } catch (error) {
    logger.error("Error in fetchChats:", error);
    res.status(400).json({ message: error.message });
  }
};

/**
 * Create a new Group Chat or Community
 */
export const createGroupChat = async (req, res) => {
  const { name, users, isCommunity, description, groupImage } = req.body;
  const { participantData: self } = resolveCurrentUser(req);

  if (!name || !users) {
    return res.status(400).send({ message: "Please fill all the fields" });
  }

  let usersList;
  try {
    usersList = typeof users === "string" ? JSON.parse(users) : users;
  } catch (e) {
    usersList = users;
  }

  try {
    const newChat = await prisma.chat.create({
      data: {
        chatName: name,
        isGroupChat: true,
        isCommunity: !!isCommunity,
        description: description || "",
        groupImage: groupImage || "",
        createdByUserId: self.userId,
        createdByOwnerId: self.ownerId,
        createdByModel: self.onModel,
        participants: {
          create: [
            // Add creator as active admin
            { 
              userId: self.userId, 
              ownerId: self.ownerId, 
              onModel: self.onModel, 
              isAdmin: true, 
              isPending: false 
            },
            // Add other users as pending
            ...usersList.map(u => {
              const uid = u.user?.id || u.user || u;
              const model = u.onModel || "User";
              return {
                userId: model === "User" ? uid : null,
                ownerId: model === "Owner" ? uid : null,
                onModel: model,
                isPending: true
              };
            })
          ]
        }
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, profilePicture: true, email: true } },
            owner: { include: { user: { select: { name: true, profilePicture: true } } } }
          }
        }
      }
    });

    if (isCommunity) {
      // Create a default announcement group for the community
      await prisma.chat.create({
        data: {
          chatName: "Announcements",
          isGroupChat: true,
          parentCommunityId: newChat.id,
          isAnnouncementGroup: true,
          adminOnlyMessages: true,
          createdByUserId: self.userId,
          createdByOwnerId: self.ownerId,
          createdByModel: self.onModel,
          participants: {
            create: [
              { 
                userId: self.userId, 
                ownerId: self.ownerId, 
                onModel: self.onModel, 
                isAdmin: true, 
                isPending: false 
              }
            ]
          }
        }
      });
    }

    res.status(200).json(newChat);
  } catch (error) {
    logger.error("Error in createGroupChat:", error);
    res.status(400).json({ message: error.message });
  }
};

/**
 * Join a group directly (e.g. from community dashboard)
 */
export const joinChat = async (req, res) => {
  const { chatId } = req.body;
  const { participantData: self } = resolveCurrentUser(req);

  try {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { participants: true }
    });
    
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    // Join logic: either update existing pending participant or create new one
    const participant = await prisma.chatParticipant.upsert({
      where: {
        chatId_userId_ownerId: {
          chatId,
          userId: self.userId,
          ownerId: self.ownerId
        }
      },
      update: { isPending: false },
      create: {
        chatId,
        userId: self.userId,
        ownerId: self.ownerId,
        onModel: self.onModel,
        isPending: false
      },
      include: {
        user: { select: { id: true, name: true, profilePicture: true, email: true } },
        owner: { include: { user: { select: { name: true, profilePicture: true } } } }
      }
    });

    res.status(200).json({ ...chat, participants: [...chat.participants, participant] });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Respond to group invite
 */
export const respondToInvite = async (req, res) => {
  const { chatId, status } = req.body; // status: 'accepted' or 'rejected'
  const { participantData: self } = resolveCurrentUser(req);

  try {
    if (status === "accepted") {
      const updatedParticipant = await prisma.chatParticipant.update({
        where: {
          chatId_userId_ownerId: {
            chatId,
            userId: self.userId,
            ownerId: self.ownerId
          }
        },
        data: { isPending: false },
        include: {
          chat: {
            include: {
              participants: {
                include: {
                  user: { select: { id: true, name: true, profilePicture: true, email: true } },
                  owner: { include: { user: { select: { name: true, profilePicture: true } } } }
                }
              }
            }
          }
        }
      });
      res.status(200).json(updatedParticipant.chat);
    } else {
      // Rejected: Just remove the participant record
      await prisma.chatParticipant.delete({
        where: {
          chatId_userId_ownerId: {
            chatId,
            userId: self.userId,
            ownerId: self.ownerId
          }
        }
      });
      res.status(200).json({ message: "Invite rejected" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};



/**
 * Update group info (name, description, etc)
 */
export const updateGroup = async (req, res) => {
  const { chatId, chatName, description } = req.body;
  const { participantData: self } = resolveCurrentUser(req);

  try {
    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    // Verify admin
    if (!(await checkIsAdmin(chatId, self))) {
      return res.status(403).json({ message: "Only admins can update group info" });
    }

    const updateData = {};
    if (chatName) updateData.chatName = chatName;
    if (description !== undefined) updateData.description = description;

    // Handle Image Upload
    if (req.file) {
      try {
        const imageUrl = await uploadToCloudinary(req.file.buffer, "groups");
        updateData.groupImage = imageUrl;
      } catch (err) {
        logger.error("Cloudinary upload failed:", err);
      }
    } else if (req.body.groupImage) {
      updateData.groupImage = req.body.groupImage;
    }

    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: updateData,
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, profilePicture: true, email: true } },
            owner: { include: { user: { select: { name: true, profilePicture: true } } } }
          }
        }
      }
    });

    // Real-time update for all participants
    const io = getIO();
    if (io) {
      updatedChat.participants.forEach(p => {
        const uid = (p.userId || p.ownerId);
        io.to(uid).emit(SOCKET.CHAT_UPDATED, updatedChat);
      });
    }

    res.status(200).json(updatedChat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Add user to group
 */
export const addToGroup = async (req, res) => {
  const { chatId, userId, onModel = "User" } = req.body;

  try {
    const addedParticipant = await prisma.chatParticipant.upsert({
      where: {
        chatId_userId_ownerId: {
          chatId,
          userId: onModel === "User" ? userId : null,
          ownerId: onModel === "Owner" ? userId : null
        }
      },
      update: { isPending: true }, // Keep or reset to pending
      create: {
        chatId,
        userId: onModel === "User" ? userId : null,
        ownerId: onModel === "Owner" ? userId : null,
        onModel,
        isPending: true
      },
      include: {
        chat: {
          include: {
            participants: {
              include: {
                user: { select: { id: true, name: true, profilePicture: true, email: true } },
                owner: { include: { user: { select: { name: true, profilePicture: true } } } }
              }
            }
          }
        }
      }
    });

    res.json(addedParticipant.chat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Remove user from group / Leave group
 */
export const removeFromGroup = async (req, res) => {
  const { chatId, userId, onModel = "User" } = req.body;

  try {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { participants: true }
    });

    if (!chat) return res.status(404).json({ message: "Chat not found" });

    await prisma.chatParticipant.delete({
      where: {
        chatId_userId_ownerId: {
          chatId,
          userId: onModel === "User" ? userId : null,
          ownerId: onModel === "Owner" ? userId : null
        }
      }
    });

    // Cascading Exit for Communities
    if (chat.isCommunity) {
      await prisma.chatParticipant.deleteMany({
        where: {
          chat: { parentCommunityId: chatId },
          userId: onModel === "User" ? userId : null,
          ownerId: onModel === "Owner" ? userId : null
        }
      });
    }

    // Real-time update for all participants
    const io = getIO();
    if (io) {
      chat.participants.forEach(p => {
        const uid = (p.userId || p.ownerId);
        io.to(uid).emit(SOCKET.CHAT_UPDATED, { ...chat, participants: chat.participants.filter(pt => (pt.userId || pt.ownerId) !== userId) });
      });
      io.to(userId).emit(SOCKET.CHAT_DELETED, chatId);
    }

    res.json({ message: "Removed successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Delete Chat / Community
 */
export const deleteChat = async (req, res) => {
  const { chatId } = req.params;
  const { participantData: self } = resolveCurrentUser(req);

  try {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { participants: true }
    });
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const isAdmin = await checkIsAdmin(chatId, self);
    const isCreator = (chat.createdByUserId === self.userId && chat.createdByOwnerId === self.ownerId);

    // Restrict deletion
    if (chat.isGroupChat) {
      if (chat.isCommunity && !isCreator) {
        return res.status(403).json({ message: "Only the creator can delete this community" });
      }
      if (!isAdmin) {
        return res.status(403).json({ message: "Only admins can delete this group" });
      }
    } else {
      // 1-on-1 chat
      const isParticipant = chat.participants.some(p => (p.userId === self.userId && p.ownerId === self.ownerId));
      if (!isParticipant) {
        return res.status(403).json({ message: "You are not a participant of this chat" });
      }
    }

    const participantIds = chat.participants.map(p => (p.userId || p.ownerId));
    const io = getIO();

    // Cascading Delete for Communities
    if (chat.isCommunity) {
      const childGroups = await prisma.chat.findMany({ 
        where: { parentCommunityId: chatId },
        include: { participants: true }
      });
      
      for (const child of childGroups) {
        await prisma.message.deleteMany({ where: { chatId: child.id } });
        if (io) {
          child.participants.forEach(p => {
            io.to(p.userId || p.ownerId).emit(SOCKET.CHAT_DELETED, child.id);
          });
        }
      }
      await prisma.chat.deleteMany({ where: { parentCommunityId: chatId } });
    }

    // Delete messages associated with this chat
    await prisma.message.deleteMany({ where: { chatId } });
    await prisma.chat.delete({ where: { id: chatId } });

    if (io) {
      participantIds.forEach(uid => {
        io.to(uid).emit(SOCKET.CHAT_DELETED, chatId);
      });
    }

    res.status(200).json({ message: "Chat deleted successfully" });
  } catch (error) {
    logger.error("Error deleting chat:", error);
    res.status(400).json({ message: error.message });
  }
};

/**
 * Add existing groups to a community
 */
export const addGroupsToCommunity = async (req, res) => {
  const { communityId, groupIds } = req.body;
  const { participantData: self } = resolveCurrentUser(req);

  try {
    const community = await prisma.chat.findUnique({ where: { id: communityId } });
    if (!community || !community.isCommunity) {
      return res.status(404).json({ message: "Community not found" });
    }

    if (!(await checkIsAdmin(communityId, self))) {
      return res.status(403).json({ message: "Only admins can add groups to this community" });
    }

    // Update all selected groups to have this parentCommunity
    await prisma.chat.updateMany({
      where: { id: { in: groupIds } },
      data: { parentCommunityId: communityId }
    });

    res.status(200).json({ message: "Groups added successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Make a user group admin
 */
export const makeGroupAdmin = async (req, res) => {
  const { chatId, userId, onModel = "User" } = req.body;
  const { participantData: self } = resolveCurrentUser(req);

  try {
    if (!(await checkIsAdmin(chatId, self))) {
      return res.status(403).json({ message: "Only admins can promote others to admin" });
    }

    const updatedParticipant = await prisma.chatParticipant.update({
      where: {
        chatId_userId_ownerId: {
          chatId,
          userId: onModel === "User" ? userId : null,
          ownerId: onModel === "Owner" ? userId : null
        }
      },
      data: { isAdmin: true },
      include: {
        chat: {
          include: {
            participants: {
              include: {
                user: { select: { id: true, name: true, profilePicture: true, email: true } },
                owner: { include: { user: { select: { name: true, profilePicture: true } } } }
              }
            }
          }
        }
      }
    });

    res.status(200).json(updatedParticipant.chat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Dismiss a user from group admin
 */
export const dismissGroupAdmin = async (req, res) => {
  const { chatId, userId, onModel = "User" } = req.body;
  const { participantData: self } = resolveCurrentUser(req);

  try {
    if (!(await checkIsAdmin(chatId, self))) {
      return res.status(403).json({ message: "Only admins can dismiss others from admin" });
    }

    const updatedParticipant = await prisma.chatParticipant.update({
      where: {
        chatId_userId_ownerId: {
          chatId,
          userId: onModel === "User" ? userId : null,
          ownerId: onModel === "Owner" ? userId : null
        }
      },
      data: { isAdmin: false },
      include: {
        chat: {
          include: {
            participants: {
              include: {
                user: { select: { id: true, name: true, profilePicture: true, email: true } },
                owner: { include: { user: { select: { name: true, profilePicture: true } } } }
              }
            }
          }
        }
      }
    });

    res.status(200).json(updatedParticipant.chat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Toggle Pin Chat (This logic might need a separate Join Table or JSON field if per-user)
 * For now, using the Chat model's pinnedBy array if we kept it, 
 * but Prisma handles scalar arrays differently.
 * In schema.prisma, I didn't see pinnedBy. I should probably use a field in ChatParticipant.
 */
export const togglePinChat = async (req, res) => {
  const { chatId } = req.body;
  const { participantData: self } = resolveCurrentUser(req);

  try {
    const participant = await prisma.chatParticipant.findUnique({
      where: {
        chatId_userId_ownerId: {
          chatId,
          userId: self.userId,
          ownerId: self.ownerId
        }
      }
    });

    if (!participant) return res.status(404).json({ message: "Participant not found" });

    const updatedParticipant = await prisma.chatParticipant.update({
      where: { id: participant.id },
      data: { isPinned: !participant.isPinned },
      include: {
        chat: {
          include: {
            participants: {
              include: {
                user: { select: { id: true, name: true, profilePicture: true, email: true } },
                owner: { include: { user: { select: { name: true, profilePicture: true } } } }
              }
            }
          }
        }
      }
    });

    res.status(200).json(updatedParticipant.chat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
