import Ticket from "../models/Ticket.js";
import { generateTicketSuggestion } from "../services/ollamaService.js";
import { generateTicketSummaryWithOllama } from "../services/ollamaService.js";

// ============================================================
// AI TICKET SUGGESTION
// ============================================================
// POST /api/ai-tickets/suggest
//
// Body:
// {
//   "message": "I can't log into my account and password reset email isn't arriving"
// }
//
// Returns:
// {
//   subject,
//   category,
//   priority,
//   summary,
//   suggestedResolution
// }

export const suggestTicket = async (req, res) => {
  try {
    const { message } = req.body;

    // --------------------------------------------------------
    // Validate input
    // --------------------------------------------------------

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        message: "Please describe your issue.",
      });
    }

    const cleanedMessage = message.trim();

    if (!cleanedMessage) {
      return res.status(400).json({
        success: false,
        message: "Please describe your issue.",
      });
    }

    if (cleanedMessage.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Please provide a little more detail about your issue.",
      });
    }

    if (cleanedMessage.length > 5000) {
      return res.status(400).json({
        success: false,
        message: "Issue description cannot exceed 5000 characters.",
      });
    }

    // --------------------------------------------------------
    // Generate AI suggestion
    // --------------------------------------------------------

    const suggestion = await generateTicketSuggestion(cleanedMessage);

    return res.status(200).json({
      success: true,
      message: "AI ticket suggestion generated successfully.",
      suggestion,
    });
  } catch (error) {
    console.error("AI TICKET SUGGESTION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to generate an AI ticket suggestion.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const generateTicketSummary = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findById(id)
      .populate("customer", "name email")
      .populate("assignedAgent", "name email");

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
      });
    }

    // Customer can only access their own ticket
    if (
      req.user.role === "customer" &&
      ticket.customer?._id?.toString() !== req.user.id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to access this ticket.",
      });
    }

    const prompt = `
You are an AI customer support assistant.

Analyze the following support ticket and generate a concise professional summary.

Ticket ID: ${ticket.ticketNumber || ticket._id}

Subject:
${ticket.subject}

Category:
${ticket.category}

Priority:
${ticket.priority}

Status:
${ticket.status}

Customer:
${ticket.customer?.name || "Unknown"}

Description:
${ticket.description}

Return the response in this format:

Summary:
A concise 2-4 sentence summary of the customer's issue.

Customer Impact:
Explain how this issue affects the customer.

Key Points:
- Important point 1
- Important point 2
- Important point 3

Suggested Resolution:
Provide practical troubleshooting or resolution steps.

Next Action:
Explain what support should do next.
`;

    const aiSummary = await generateTicketSummaryWithOllama(prompt);

    return res.status(200).json({
      success: true,
      message: "AI summary generated successfully.",
      summary: aiSummary,
      ticket: {
        id: ticket._id,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
      },
    });
  } catch (error) {
    console.error("GENERATE AI SUMMARY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate AI summary.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
