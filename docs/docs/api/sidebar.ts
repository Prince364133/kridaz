import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebar: SidebarsConfig = {
  apisidebar: [
    {
      type: "doc",
      id: "api/kridaz-api-documentation",
    },
    {
      type: "category",
      label: "Auth",
      link: {
        type: "doc",
        id: "api/auth",
      },
      items: [
        {
          type: "doc",
          id: "api/send-otp-to-email",
          label: "Send OTP to email",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/register-a-new-user",
          label: "Register a new user",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/login-step-1-password-verification",
          label: "Login Step 1 - Password verification",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/login-step-2-complete-login",
          label: "Login Step 2 - Complete login",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/google-o-auth-login-register",
          label: "Google OAuth Login/Register",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/get-current-user-profile",
          label: "Get current user profile",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/logout-user",
          label: "Logout user",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/refresh-access-token",
          label: "Refresh access token",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/update-user-profile",
          label: "Update user profile",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "api/check-username-availability",
          label: "Check username availability",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Booking",
      link: {
        type: "doc",
        id: "api/booking",
      },
      items: [
        {
          type: "doc",
          id: "api/create-a-booking-order",
          label: "Create a booking order",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/verify-booking-payment",
          label: "Verify booking payment",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/book-using-wallet-balance",
          label: "Book using wallet balance",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/list-user-bookings",
          label: "List user bookings",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/get-booking-details",
          label: "Get booking details",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Wallet",
      link: {
        type: "doc",
        id: "api/wallet",
      },
      items: [
        {
          type: "doc",
          id: "api/get-wallet-balance-and-transactions",
          label: "Get wallet balance and transactions",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/create-wallet-top-up-order",
          label: "Create wallet top-up order",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/verify-wallet-top-up-payment",
          label: "Verify wallet top-up payment",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "Reels",
      link: {
        type: "doc",
        id: "api/reels",
      },
      items: [
        {
          type: "doc",
          id: "api/get-reels-feed",
          label: "Get reels feed",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/get-recommended-reels",
          label: "Get recommended reels",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/get-pre-signed-upload-url",
          label: "Get pre-signed upload URL",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/confirm-reel-upload",
          label: "Confirm reel upload",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/interact-with-a-reel",
          label: "Interact with a reel",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/add-a-comment-to-a-reel",
          label: "Add a comment to a reel",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/delete-a-reel",
          label: "Delete a reel",
          className: "api-method delete",
        },
      ],
    },
    {
      type: "category",
      label: "Turf",
      link: {
        type: "doc",
        id: "api/turf",
      },
      items: [
        {
          type: "doc",
          id: "api/get-all-turfs",
          label: "Get all turfs",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/get-unique-turf-locations",
          label: "Get unique turf locations",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/get-turf-details",
          label: "Get turf details",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/get-availability-time-slots",
          label: "Get availability time slots",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Owner",
      link: {
        type: "doc",
        id: "api/owner",
      },
      items: [
        {
          type: "doc",
          id: "api/register-as-a-turf-owner",
          label: "Register as a turf owner",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/send-otp-for-owner",
          label: "Send OTP for owner",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/owner-login",
          label: "Owner login",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/submit-owner-partnership-request",
          label: "Submit owner partnership request",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/get-current-owner-profile",
          label: "Get current owner profile",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Admin",
      link: {
        type: "doc",
        id: "api/admin",
      },
      items: [
        {
          type: "doc",
          id: "api/get-all-turfs-admin",
          label: "Get all turfs (Admin)",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/approve-a-turf",
          label: "Approve a turf",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "api/reject-a-turf",
          label: "Reject a turf",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "api/decommission-a-turf",
          label: "Decommission a turf",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "api/soft-delete-a-turf",
          label: "Soft delete a turf",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "api/hard-delete-a-turf",
          label: "Hard delete a turf",
          className: "api-method delete",
        },
      ],
    },
    {
      type: "category",
      label: "Player",
      link: {
        type: "doc",
        id: "api/player",
      },
      items: [
        {
          type: "doc",
          id: "api/search-for-players",
          label: "Search for players",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/get-nearby-players",
          label: "Get nearby players",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/update-user-location",
          label: "Update user location",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/get-current-users-network",
          label: "Get current user's network",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/get-player-profile",
          label: "Get player profile",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/follow-a-player",
          label: "Follow a player",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/unfollow-a-player",
          label: "Unfollow a player",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/get-players-network-by-id",
          label: "Get player's network by ID",
          className: "api-method get",
        },
      ],
    },
  ],
};

export default sidebar.apisidebar;
