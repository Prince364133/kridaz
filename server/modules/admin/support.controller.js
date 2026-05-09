import SupportTicket from "../../models/supportTicket.model.js";
import Dispute from "../../models/dispute.model.js";
import Booking from "../../models/booking.model.js";
import { logAdminAction } from "../../utils/auditLogger.js";
import generateEmail from "../../utils/generateEmail.js";
import { createNotification } from "../../utils/notificationHelper.js";

// --- Support Ticket Controllers ---

export const getAllTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find()
      .populate("user", "name email")
      .populate("owner", "name email")
      .sort({ updatedAt: -1 });
    res.status(200).json({ success: true, tickets });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTicketStatus = async (req, res) => {
  const { ticketId } = req.params;
  const { status } = req.body;
  try {
    const ticket = await SupportTicket.findById(ticketId).populate("owner user");
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    ticket.status = status;
    await ticket.save();

    // Send Notification
    const recipient = ticket.owner || ticket.user;
    const recipientModel = ticket.owner ? 'Owner' : 'User';

    if (recipient && recipient.email) {
      // Email
      await generateEmail(
        recipient.email,
        `Support Ticket Status Updated: ${ticket.subject}`,
        `<p>Hello ${recipient.name},</p><p>Your support ticket status has been updated to: <strong>${status}</strong>.</p><p>View details in your dashboard.</p>`
      );

      // In-app Notification
      await createNotification({
        recipientId: recipient._id,
        recipientModel,
        title: "Ticket Status Updated",
        message: `Your ticket "${ticket.subject}" is now ${status}.`,
        type: "SUPPORT",
        link: "/partner/docs-support" // This will need to be dynamic based on role in frontend
      });
    }

    res.status(200).json({ success: true, message: "Status updated", ticket });

    await logAdminAction(req, "UPDATE_TICKET_STATUS", "RESOLUTION", ticket._id, {
      status
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const replyToTicket = async (req, res) => {
  const { ticketId } = req.params;
  const { message } = req.body;
  try {
    const ticket = await SupportTicket.findById(ticketId).populate("owner user");
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    ticket.replies.push({
      sender: "ADMIN",
      message,
    });
    ticket.lastRepliedAt = new Date();
    if (ticket.status === "OPEN") ticket.status = "IN_PROGRESS";
    
    await ticket.save();

    // Send Notification
    const recipient = ticket.owner || ticket.user;
    const recipientModel = ticket.owner ? 'Owner' : 'User';

    if (recipient && recipient.email) {
      // Email
      await generateEmail(
        recipient.email,
        `New Reply on Support Ticket: ${ticket.subject}`,
        `<p>Hello ${recipient.name},</p><p>An administrator has replied to your support ticket.</p><p><strong>Message:</strong> ${message}</p><p>Please check your dashboard to reply.</p>`
      );

      // In-app Notification
      await createNotification({
        recipientId: recipient._id,
        recipientModel,
        title: "New Support Reply",
        message: `Admin replied to your ticket: "${message.substring(0, 50)}..."`,
        type: "SUPPORT",
        link: "/partner/docs-support"
      });
    }

    res.status(200).json({ success: true, message: "Reply sent", ticket });

    await logAdminAction(req, "REPLY_TO_TICKET", "RESOLUTION", ticket._id);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Dispute Controllers ---

export const getAllDisputes = async (req, res) => {
  try {
    const disputes = await Dispute.find()
      .populate({
        path: "booking",
        populate: [
          { path: "userId", select: "name email" },
          { path: "turfId", select: "name" }
        ]
      })
      .populate("raisedBy", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, disputes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resolveDispute = async (req, res) => {
  const { disputeId } = req.params;
  const { action, message } = req.body;
  try {
    const dispute = await Dispute.findById(disputeId);
    if (!dispute) return res.status(404).json({ message: "Dispute not found" });

    dispute.status = "RESOLVED";
    dispute.resolution = {
      action,
      message,
      resolvedAt: new Date(),
      resolvedBy: req.user.id
    };

    // Logic for actual financial resolution (e.g., refunding booking) would go here
    // For now, we just mark it as resolved.

    await dispute.save();
    res.status(200).json({ success: true, message: `Dispute resolved with action: ${action}` });

    await logAdminAction(req, "RESOLVE_DISPUTE", "RESOLUTION", dispute._id, {
      action,
      message
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
