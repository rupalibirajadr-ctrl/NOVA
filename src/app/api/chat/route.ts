import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required." },
        { status: 400 }
      );
    }

    // Format messages for OpenRouter (filtering out our internal 'id' and 'sender' keys if necessary)
    // OpenRouter requires: { role: "user" | "assistant" | "system", content: "..." }
    const openRouterMessages = messages.map((msg: any) => ({
      role: msg.sender === "bot" ? "assistant" : "user",
      content: msg.text,
    }));

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        // Optional OpenRouter Headers:
        "HTTP-Referer": "http://localhost:3000", 
        "X-Title": "NOVA AI",
      },
      body: JSON.stringify({
        // Using GPT-4o-mini (GPT 4.1 mini) as requested
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are NOVA, a helpful, professional AI. Keep your answers concise, modern, and friendly."
          },
          ...openRouterMessages,
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenRouter API Error:", errorData);
      return NextResponse.json(
        { error: "OpenRouter replied with an error.", details: errorData },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      text: data.choices[0].message.content,
    });
  } catch (error) {
    console.error("Error in chat route:", error);
    return NextResponse.json(
        { error: "Internal Server Error" }, 
        { status: 500 }
    );
  }
}
