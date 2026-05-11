import express from "express";
import verifyAuth from "../../middleware/jwt/auth.middleware.js";
import {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  respondToInvite,
  addToGroup,
  removeFromGroup,
  deleteChat,
  addGroupsToCommunity
} from "./chat.controller.js";
import { allMessages, sendMessage, markMessagesRead, deleteMessages } from "./message.controller.js";

const router = express.Router();

// Chat routes
router.route("/").post(verifyAuth, accessChat);
router.route("/").get(verifyAuth, fetchChats);
router.route("/group").post(verifyAuth, createGroupChat);
router.route("/rename").put(verifyAuth, renameGroup);
router.route("/respond-invite").post(verifyAuth, respondToInvite);
router.route("/groupadd").put(verifyAuth, addToGroup);
router.route("/groupremove").put(verifyAuth, removeFromGroup);
router.route("/community/add-groups").put(verifyAuth, addGroupsToCommunity);
router.route("/:chatId").delete(verifyAuth, deleteChat);

// Message routes
router.route("/message/:chatId").get(verifyAuth, allMessages);
router.route("/message").post(verifyAuth, sendMessage);
router.route("/message/:chatId/read").put(verifyAuth, markMessagesRead);
router.route("/message/delete").post(verifyAuth, deleteMessages);

export default router;
