
import "dotenv/config";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  timeout: 60000,
  maxRetries: 0,
});

try {
  console.log("Testing Groq connection...");

  const response = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    messages: [
      { role: "user", content: 'Reply with only "Groq works".' },
    ],
    temperature: 0,
    max_tokens: 30,
  });

  console.log("SUCCESS:", response.choices[0].message.content);
} catch (error) {
  console.error("FAILED:", error.name);
  console.error("Message:", error.message);
  console.error("Status:", error.status);
}
