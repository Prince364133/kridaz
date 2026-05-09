import SupportTicket from "../../models/supportTicket.model.js";

export const createTicket = async (req, res) => {
  const ownerId = req.owner.id;
  const { subject, message, category } = req.body;
  try {
    const ticket = await SupportTicket.create({
      owner: ownerId,
      subject,
      message,
      category,
      status: "OPEN"
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
