import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const {
      messages,
      apiKeys,
      model,
      temperature = 0.7,
      maxTokens = 4096,
      systemPrompt = "",
      contextContent = "",
    } = await req.json();

    const [provider, modelName] = model.split(":");

    if (!apiKeys || !apiKeys[provider]) {
      return new Response(
        JSON.stringify({
          error: `Missing API key for ${provider}. Please configure it in settings.`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    let selectedModel;

    if (provider === "google") {
      const google = createGoogleGenerativeAI({
        apiKey: apiKeys.google,
      });
      selectedModel = google(modelName);
    } else if (provider === "anthropic") {
      const anthropic = createAnthropic({
        apiKey: apiKeys.anthropic,
      });
      selectedModel = anthropic(modelName);
    } else if (provider === "openai") {
      const openai = createOpenAI({
        apiKey: apiKeys.openai,
      });
      selectedModel = openai(modelName);
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid AI Provider selected." }),
        { status: 400 }
      );
    }

    // Build the system prompt
    const defaultPrompt = `You are the Sales Bot MVP. 
Your ultimate goal is to flawlessly answer queries based exclusively on the context or data provided by the user.
Cleanly compile the outputs into properly arranged text formats.
Be professional, accurate, and concise.`;

    const finalSystemPrompt = [
      systemPrompt || defaultPrompt,
      contextContent
        ? `\n\n--- USER CONTEXT DATA ---\n${contextContent}\n--- END CONTEXT DATA ---\n\nUse the above context data to answer the user's questions accurately.`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const result = await streamText({
      model: selectedModel,
      system: finalSystemPrompt,
      messages,
      temperature: Math.min(Math.max(temperature, 0), 2),
      maxOutputTokens: maxTokens > 0 ? maxTokens : undefined,
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return new Response(
      JSON.stringify({
        error:
          error.message ||
          "An error occurred while communicating with the AI model. Please verify your API key and try again.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
