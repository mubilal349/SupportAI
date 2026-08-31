import axios from "axios";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

// =========================================================
// GENERIC OLLAMA REQUEST
// =========================================================

const askOllama = async (prompt) => {
  try {
    console.log("🤖 Sending request to Ollama...");
    console.log("Model:", OLLAMA_MODEL);

    const response = await axios.post(
      `${OLLAMA_URL}/api/generate`,
      {
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        options: {
          temperature: 0.2,
        },
      },
      {
        timeout: 120000,
      },
    );

    if (!response.data?.response) {
      throw new Error("Ollama returned an empty response.");
    }

    console.log("✅ Ollama response received.");

    return response.data.response.trim();
  } catch (error) {
    console.error("OLLAMA ERROR:", error?.response?.data || error.message);

    if (error.code === "ECONNREFUSED") {
      throw new Error("Ollama is not running. Start Ollama first.");
    }

    if (error.code === "ETIMEDOUT") {
      throw new Error("Ollama took too long to generate a response.");
    }

    throw new Error(
      error?.response?.data?.error ||
        error.message ||
        "Failed to communicate with Ollama.",
    );
  }
};

// =========================================================
// AI TICKET SUMMARY
// =========================================================

export const generateTicketSummaryWithOllama = async (prompt) => {
  return await askOllama(prompt);
};

// =========================================================
// AI TICKET SUGGESTION
// =========================================================

export const generateTicketSuggestion = async (prompt) => {
  return await askOllama(prompt);
};
