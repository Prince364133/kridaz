import express from "express";
import verifyAuth from "../../middleware/jwt/auth.middleware.js";
import {
  accessChat,
  fetchChats,
  createGroupChat,
  updateGroup,
  respondToInvite,
  addToGroup,
  removeFromGroup,
  deleteChat,
  addGroupsToCommunity,
  makeGroupAdmin,
  dismissGroupAdmin,
  togglePinChat
} from "./chat.controller.js";
import { allMessages, sendMessage, markMessagesRead, deleteMessages, clearChat, getChatMedia, forwardMessage, broadcastMessage } from "./message.controller.js";

const router = express.Router();

import upload from "../../middleware/uploads/upload.middleware.js";

// Chat routes
router.route("/").post(verifyAuth, accessChat);
router.route("/").get(verifyAuth, fetchChats);
router.route("/group").post(verifyAuth, createGroupChat);
router.route("/group/update").put(verifyAuth, upload.single('groupImage'), updateGroup);
router.route("/respond-invite").post(verifyAuth, respondToInvite);
router.route("/groupadd").put(verifyAuth, addToGroup);
router.route("/groupremove").put(verifyAuth, removeFromGroup);
router.route("/community/add-groups").put(verifyAuth, addGroupsToCommunity);
router.route("/groupadmin").put(verifyAuth, makeGroupAdmin);
router.route("/dismissadmin").put(verifyAuth, dismissGroupAdmin);
router.route("/pin").put(verifyAuth, togglePinChat);
router.route("/:chatId").delete(verifyAuth, deleteChat);

// Message routes
router.route("/message/:chatId").get(verifyAuth, allMessages);
router.route("/message").post(verifyAuth, sendMessage);
router.route("/message/forward").post(verifyAuth, forwardMessage);
router.route("/message/broadcast").post(verifyAuth, broadcastMessage);
router.route("/message/:chatId/read").put(verifyAuth, markMessagesRead);
router.route("/message/delete").post(verifyAuth, deleteMessages);
router.route("/message/clear").post(verifyAuth, clearChat);
router.route("/message/:chatId/media").get(verifyAuth, getChatMedia);

export default router;
