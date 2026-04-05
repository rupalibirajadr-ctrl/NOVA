"use client";

import { useState, useRef, useEffect } from "react";
import "./globals.css";

type Message = {
  id: number;
  text: string;
  sender: "user" | "bot";
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isStarted) scrollToBottom();
  }, [messages, isTyping, isStarted]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    if (!isStarted) setIsStarted(true);

    const newUserMessage: Message = {
      id: Date.now(),
      text: inputValue,
      sender: "user",
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, newUserMessage] }),
      });

      if (!response.ok) throw new Error("Failed to get response");
      const data = await response.json();
      
      const newBotMessage: Message = {
        id: Date.now(),
        text: data.text,
        sender: "bot",
      };
      setMessages((prev) => [...prev, newBotMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg: Message = {
        id: Date.now(),
        text: "Sorry, I had trouble connecting. Is your OPENROUTER_API_KEY set?",
        sender: "bot",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isStarted) {
    return (
      <main className="home-container">
        <div style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", width: "100%", height: "240px", marginBottom: "2rem" }}>
          <img src="/in.jpg" alt="NOVA Logo Background" className="hero-logo-bg animate-float" />
          <h1 className="sparkle-text" style={{ position: "absolute", zIndex: 2, margin: 0, pointerEvents: "none" }}>NOVA</h1>
          {/* Simple Sparkles */}
          <div className="sparkle" style={{ top: "10%", left: "10%", "--duration": "2s" } as any}></div>
          <div className="sparkle" style={{ top: "40%", left: "80%", "--duration": "1.5s" } as any}></div>
          <div className="sparkle" style={{ top: "70%", left: "20%", "--duration": "2.5s" } as any}></div>
          <div className="sparkle" style={{ top: "20%", left: "90%", "--duration": "1.8s" } as any}></div>
        </div>
        
        <form onSubmit={handleSend} style={{ width: "100%", maxWidth: "600px" }}>
          <div className="input-wrapper" style={{ position: "relative" }}>
            <input
              type="text"
              className="chat-input input-gradient"
              style={{ width: "100%", height: "60px", fontSize: "1.2rem", paddingLeft: "1.5rem", paddingRight: "60px", borderRadius: "50px" }}
              placeholder="Ask NOVA anything..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button type="submit" className="btn-send btn-primary" style={{ position: "absolute", top: "10px", right: "10px", width: "40px", height: "40px", border: "none", borderRadius: "50%" }} disabled={!inputValue.trim()}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: "20px" }}>
                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
              </svg>
            </button>
          </div>
        </form>
      </main>
    );
  }

  return (
    <main className="chat-container">
      {/* Header */}
      <header className="chat-header">
        <div className="header-logo">
          <div className="logo-circle animate-float"></div>
          <h1 className="header-title">NOVA</h1>
        </div>
        <p className="status-indicator">
          <span className="status-dot"></span> Online
        </p>
      </header>

      {/* Messages Area */}
      <div className="chat-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message-wrapper animate-fade-in ${
              msg.sender === "user" ? "message-user" : "message-bot"
            }`}
          >
            <div className={`message-bubble ${msg.sender}-bubble`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="message-wrapper message-bot animate-fade-in">
            <div className="message-bubble bot-bubble typing-indicator">
              <span>.</span><span>.</span><span>.</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form className="chat-input-area" onSubmit={handleSend}>
        <div className="input-wrapper">
          <input
            type="text"
            className="chat-input input-gradient"
            placeholder="Ask me anything..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button type="submit" className="btn-send btn-primary" disabled={!inputValue.trim() || isTyping}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="send-icon"
            >
              <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
            </svg>
          </button>
        </div>
        <div className="footer-text">
          NOVA can make mistakes. Consider verifying critical information.
        </div>
      </form>

      <style jsx>{`
        .chat-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
        }

        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          z-index: 10;
        }

        .header-logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .hero-logo-bg {
          width: 240px;
          height: auto;
          opacity: 0.8;
          filter: blur(2px) brightness(0.7);
          pointer-events: none;
          z-index: 1;
        }

        .logo-circle {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary-accent) 0%, var(--secondary-accent) 100%);
          box-shadow: 0 0 10px var(--primary-glow);
        }

        .header-title {
          font-size: 1.25rem;
          font-weight: 700;
          background: linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: 0.05em;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          background-color: var(--primary-accent);
          border-radius: 50%;
          box-shadow: 0 0 10px var(--primary-accent);
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .message-wrapper {
          display: flex;
          width: 100%;
        }

        .message-user {
          justify-content: flex-end;
        }

        .message-bot {
          justify-content: flex-start;
        }

        .message-bubble {
          max-width: 70%;
          padding: 1rem 1.25rem;
          border-radius: 12px;
          line-height: 1.5;
          font-size: 0.95rem;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .user-bubble {
          background: #ffffff;
          color: #000000;
          border-bottom-right-radius: 4px;
          box-shadow: 0 4px 15px rgba(255, 255, 255, 0.2);
          border: none;
        }

        .bot-bubble {
          background: #111111;
          color: #ffffff;
          border-bottom-left-radius: 4px;
          box-shadow: 0 4px 12px rgba(255, 255, 255, 0.05);
          border: 1px solid #222222;
        }

        .chat-input-area {
          padding: 1.5rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .input-wrapper {
          display: flex;
          gap: 1rem;
          position: relative;
        }

        .chat-input {
          flex: 1;
          padding: 1rem 1.5rem;
          padding-right: 50px; /* space for send button */
          border-radius: 50px;
          outline: none;
          font-size: 1rem;
        }

        .btn-send {
          position: absolute;
          right: 5px;
          top: 50%;
          transform: translateY(-50%);
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          padding: 0;
          border: none;
        }
        
        .btn-send:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .send-icon {
          width: 18px;
          height: 18px;
        }

        .typing-indicator span {
          display: inline-block;
          animation: blink 1.4s infinite reverse;
          margin-right: 2px;
        }

        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
          margin-right: 0;
        }

        @keyframes blink {
          0% { opacity: 0.2; }
          20% { opacity: 1; }
          100% { opacity: 0.2; }
        }

        .footer-text {
          text-align: center;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
      `}</style>
    </main>
  );
}
