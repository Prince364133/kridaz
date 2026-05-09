import SupportTicket from "../../models/supportTicket.model.js";
import { notifyAdmins } from "../../utils/notificationHelper.js";

export const createTicket = async (req, res) => {
  const ownerId = req.owner.id;
  const { subject, message, category, images } = req.body;
  try {
    if (message.length > 10000) {
      return res.status(400).json({ message: "Message exceeds 10,000 characters limit" });
    }

    if (images && images.length > 5) {
      return res.status(400).json({ message: "Maximum 5 images allowed" });
    }

    const ticket = await SupportTicket.create({
      owner: ownerId,
      subject,
      message,
      category,
      images,
      status: "OPEN"
    });

    // Notify Admin
    await notifyAdmins({
      title: "New Support Ticket",
      message: `New ${category} ticket from partner: "${subject}"`,
      type: "SUPPORT",
      link: "/admin/support"
    });

    res.status(201).json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyTickets = async (req, res) => {
  const ownerId = req.owner.id;
  try {
    const tickets = await SupportTicket.find({ owner: ownerId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, tickets });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addReply = async (req, res) => {
  const ownerId = req.owner.id;
  const { ticketId } = req.params;
  const { message } = req.body;
  try {
    const ticket = await SupportTicket.findOne({ _id: ticketId, owner: ownerId });
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    ticket.replies.push({
      sender: "OWNER",
      message,
      createdAt: new Date()
    });
    ticket.lastRepliedAt = new Date();
    await ticket.save();

    // Notify Admin
    await notifyAdmins({
      title: "Partner Replied to Ticket",
      message: `Partner replied to ticket: "${ticket.subject}"`,
      type: "SUPPORT",
      link: "/admin/support"
    });

    res.status(200).json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
