export const UserSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    email: { type: "string", format: "email" },
    username: { type: "string" },
    name: { type: "string" },
    role: { type: "string", enum: ["USER", "OWNER", "ADMIN", "UMPIRE", "COACH", "SCORER"] },
    profilePicture: { type: "string", nullable: true },
    phone: { type: "string", nullable: true },
    city: { type: "string", nullable: true },
    state: { type: "string", nullable: true },
    walletBalance: { type: "number" },
    status: { type: "string", enum: ["active", "blocked"] },
    createdAt: { type: "string", format: "date-time" },
  },
};

export const OwnerSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    businessName: { type: "string" },
    verified: { type: "boolean" },
    walletBalance: { type: "number" },
    rating: { type: "number" },
    numReviews: { type: "integer" },
  },
};

export const TurfSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    ownerId: { type: "string", format: "uuid" },
    name: { type: "string" },
    description: { type: "string", nullable: true },
    location: { type: "string" },
    city: { type: "string" },
    state: { type: "string" },
    image: { type: "string" },
    images: { type: "array", items: { type: "string" } },
    sportTypes: { type: "array", items: { type: "string" } },
    pricePerHour: { type: "number" },
    openTime: { type: "string" },
    closeTime: { type: "string" },
    isActive: { type: "boolean" },
    status: { type: "string", enum: ["pending", "approved", "rejected"] },
  },
};

export const BookingSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    turfId: { type: "string", format: "uuid" },
    timeSlotId: { type: "string", format: "uuid", nullable: true },
    totalPrice: { type: "number" },
    paidAmount: { type: "number" },
    status: { type: "string", enum: ["PENDING", "CONFIRMED", "PLAYING", "COMPLETED", "CANCELLED", "DISPUTED"] },
    paymentStatus: { type: "string", nullable: true },
    paymentMethod: { type: "string", nullable: true },
    playStartTime: { type: "string", format: "date-time", nullable: true },
    playEndTime: { type: "string", format: "date-time", nullable: true },
    createdAt: { type: "string", format: "date-time" },
  },
};

export const ReelSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    title: { type: "string", nullable: true },
    videoUrl: { type: "string" },
    hlsUrl: { type: "string", nullable: true },
    thumbnailUrl: { type: "string", nullable: true },
    duration: { type: "number" },
    likeCount: { type: "integer" },
    commentCount: { type: "integer" },
    viewCount: { type: "integer" },
    status: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
  },
};

export const MessageSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    chatId: { type: "string", format: "uuid" },
    senderId: { type: "string", format: "uuid" },
    content: { type: "string" },
    type: { type: "string", enum: ["TEXT", "IMAGE", "VIDEO", "FILE"] },
    createdAt: { type: "string", format: "date-time" },
  },
};

export const ChatSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    type: { type: "string", enum: ["DIRECT", "GROUP"] },
    name: { type: "string", nullable: true },
    lastMessageId: { type: "string", format: "uuid", nullable: true },
    createdAt: { type: "string", format: "date-time" },
  },
};

export const WalletTransactionSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    amount: { type: "number" },
    type: { type: "string", enum: ["TOPUP", "DEBIT", "REFUND", "OFFER"] },
    status: { type: "string", enum: ["PENDING", "SUCCESS", "FAILED", "RESERVED"] },
    description: { type: "string", nullable: true },
    razorpayOrderId: { type: "string", nullable: true },
    createdAt: { type: "string", format: "date-time" },
  },
};

export const CommunityPostSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    content: { type: "string", nullable: true },
    imageUrl: { type: "string", nullable: true },
    videoUrl: { type: "string", nullable: true },
    likeCount: { type: "integer" },
    commentCount: { type: "integer" },
    createdAt: { type: "string", format: "date-time" },
  },
};

export const CommunityCommentSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    postId: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    content: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
  },
};

export const StorySchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    mediaUrl: { type: "string" },
    mediaType: { type: "string", enum: ["image", "video"] },
    expiresAt: { type: "string", format: "date-time" },
    createdAt: { type: "string", format: "date-time" },
  },
};

export const TeamSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    name: { type: "string" },
    logo: { type: "string", nullable: true },
    creatorId: { type: "string", format: "uuid" },
    memberCount: { type: "integer" },
    sportType: { type: "string" },
  },
};

export const HostedGameSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    hostId: { type: "string", format: "uuid" },
    turfId: { type: "string", format: "uuid" },
    sportType: { type: "string" },
    date: { type: "string", format: "date" },
    time: { type: "string" },
    totalPlayers: { type: "integer" },
    joinedPlayers: { type: "integer" },
    pricePerPlayer: { type: "number" },
    status: { type: "string", enum: ["open", "full", "cancelled", "completed"] },
  },
};

export const ProfessionalSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    type: { type: "string", enum: ["COACH", "REFEREE", "SCORER", "STREAMER"] },
    bio: { type: "string" },
    experience: { type: "integer" },
    rating: { type: "number" },
    verified: { type: "boolean" },
  },
};

export const DisputeSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    bookingId: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    reason: { type: "string" },
    description: { type: "string" },
    status: { type: "string", enum: ["PENDING", "RESOLVED", "REJECTED"] },
    createdAt: { type: "string", format: "date-time" },
  },
};

export const ErrorResponseSchema = {
  type: "object",
  properties: {
    success: { type: "boolean", example: false },
    message: { type: "string" },
    error: { type: "string", nullable: true },
  },
};

export const PaginatedResponseSchema = {
  type: "object",
  properties: {
    success: { type: "boolean", example: true },
    data: { type: "array", items: { type: "object" } },
    pagination: {
      type: "object",
      properties: {
        total: { type: "integer" },
        page: { type: "integer" },
        limit: { type: "integer" },
        pages: { type: "integer" },
      },
    },
  },
};
