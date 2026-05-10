import express from "express";
import verifyAuth from "../../middleware/jwt/auth.middleware.js";
import {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  respondToInvite
} from "./chat.controller.js";
import { allMessages, sendMessage } from "./message.controller.js";

const router = express.Router();

// Chat routes
router.route("/").post(verifyAuth, accessChat);
router.route("/").get(verifyAuth, fetchChats);
router.route("/group").post(verifyAuth, createGroupChat);
router.route("/rename").put(verifyAuth, renameGroup);
router.route("/respond-invite").post(verifyAuth, respondToInvite);

// Message routes
router.route("/message/:chatId").get(verifyAuth, allMessages);
router.route("/message").post(verifyAuth, sendMessage);

export default router;
