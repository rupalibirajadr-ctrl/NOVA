"use client";

import { useState, useRef, useEffect } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: ""
  });
  const [authError, setAuthError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulate sending file message
      if (!isStarted) setIsStarted(true);
      const fileName = file.name;
      const newUserMessage: Message = {
        id: Date.now(),
        text: `📎 Sent file: ${fileName}`,
        sender: "user",
      };
      setMessages((prev) => [...prev, newUserMessage]);
      // Reset input
      if (e.target) e.target.value = "";
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsAuthLoading(true);

    try {
      if (!auth || !db) {
        setAuthError("Firebase is not connected. Please add valid keys to .env.local and restart the server.");
        setIsAuthLoading(false);
        return;
      }

      if (authMode === "signup") {
        if (!formData.name || !formData.email || !formData.phone || !formData.password) {
          setAuthError("Please fill out all fields.");
          setIsAuthLoading(false);
          return;
        }
        
        // 1. Create User
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;

        // 2. Update Profile Name
        await updateProfile(user, { displayName: formData.name });

        // Note: Phone number is stored safely in state. 
        // We temporarily disabled saving to Firestore Database because if 
        // Cloud Firestore isn't created in your console yet, it causes an infinite loading screen.

      } else {
        if (!formData.email || !formData.password) {
          setAuthError("Please enter both email and password.");
          setIsAuthLoading(false);
          return;
        }

        // Login User
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      }
      
      setIsLoggedIn(true);
    } catch (err: any) {
      console.error("Auth Error:", err);
      let errorMsg = "An error occurred during authentication.";
      
      if (err.code === "auth/email-already-in-use") {
        errorMsg = "This email is already registered. Please log in instead.";
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        errorMsg = "Invalid email or password.";
      } else if (err.code === "auth/weak-password") {
        errorMsg = "Password should be at least 6 characters.";
      } else if (err.code === "auth/invalid-email") {
        errorMsg = "Please enter a valid email address.";
      } else if (err.message) {
        errorMsg = err.message.replace("Firebase: ", "").replace(/\(auth.*\)/, "").trim();
      }
      
      setAuthError(errorMsg || "An error occurred during authentication.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (!isLoggedIn) {
    return (
      <main className="auth-container animate-fade-in">
        <div className="auth-card glass">
          <div className="auth-header">
            <h1 className="sparkle-text small-sparkle">NOVA</h1>
            <p className="auth-subtitle">{authMode === "signup" ? "Create your account" : "Welcome back"}</p>
          </div>

          <form onSubmit={handleAuth} className="auth-form">
            {authMode === "signup" && (
              <>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" name="name" placeholder="John Doe" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="tel" name="phone" placeholder="+1 234 567 890" value={formData.phone} onChange={handleInputChange} required />
                </div>
              </>
            )}
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" name="email" placeholder="name@example.com" value={formData.email} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleInputChange} required />
            </div>

            {authError && <div className="auth-error">{authError}</div>}

            <button type="submit" className="btn-primary auth-submit" disabled={isAuthLoading}>
              {isAuthLoading ? "Processing..." : (authMode === "signup" ? "Sign Up" : "Log In")}
            </button>
          </form>

          <p className="auth-footer">
            {authMode === "signup" ? "Already have an account?" : "Don't have an account?"}
            <button onClick={() => setAuthMode(authMode === "signup" ? "login" : "signup")} className="auth-toggle">
              {authMode === "signup" ? "Log In" : "Sign Up"}
            </button>
          </p>
        </div>

        <style jsx>{`
          .auth-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: var(--bg-primary);
            padding: 1.5rem;
          }
          .auth-card {
            width: 100%;
            max-width: 450px;
            padding: 2.5rem;
            border-radius: 24px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 1);
          }
          .auth-header {
            text-align: center;
            margin-bottom: 2rem;
          }
          .small-sparkle {
            font-size: 3rem !important;
            margin-bottom: 0.5rem;
          }
          .auth-subtitle {
            font-size: 0.9rem;
            color: var(--text-secondary);
            letter-spacing: 0.1em;
            text-transform: uppercase;
          }
          .auth-form {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
          }
          .form-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
          .form-row {
            display: grid;
            grid-template-columns: 1fr 1.2fr;
            gap: 1rem;
          }
          label {
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          input {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 0.75rem 1rem;
            color: white;
            font-size: 0.9rem;
            outline: none;
            transition: all 0.2s ease;
          }
          input:focus {
            border-color: white;
            background: rgba(255, 255, 255, 0.08);
          }
          .auth-submit {
            padding: 0.9rem;
            font-weight: 700;
            font-size: 1rem;
            border-radius: 12px;
            margin-top: 1rem;
            display: flex;
            justify-content: center;
          }
          .auth-submit:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          .auth-error {
            color: #ff4d4d;
            font-size: 0.8rem;
            text-align: center;
            background: rgba(255, 77, 77, 0.1);
            padding: 8px;
            border-radius: 8px;
            border: 1px solid rgba(255, 77, 77, 0.2);
            margin-top: 4px;
          }
          .auth-footer {
            text-align: center;
            margin-top: 1.5rem;
            font-size: 0.85rem;
            color: var(--text-muted);
          }
          .auth-toggle {
            background: none;
            border: none;
            color: white;
            font-weight: 700;
            margin-left: 8px;
            cursor: pointer;
            text-decoration: underline;
          }
        `}</style>
      </main>
    );
  }

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
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          <div className="input-wrapper" style={{ position: "relative" }}>
            <button 
              type="button" 
              onClick={handleFileClick}
              className="btn-add btn-primary" 
              style={{ position: "absolute", top: "10px", left: "10px", width: "40px", height: "40px", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" style={{ width: "20px", height: "20px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
            <input
              type="text"
              className="chat-input input-gradient"
              style={{ width: "100%", height: "60px", fontSize: "1.2rem", paddingLeft: "50px", paddingRight: "60px", borderRadius: "50px" }}
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

        {/* Crafted by signature */}
        <div style={{
          marginTop: "2rem",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          opacity: 0.7,
          animation: "fadeInUp 1.2s ease forwards"
        }}>
          <span style={{ fontSize: "0.7rem", color: "#555", letterSpacing: "0.15em", textTransform: "uppercase" }}>Crafted by</span>
          <span style={{
            fontSize: "0.85rem",
            fontWeight: 700,
            letterSpacing: "0.2em",
            background: "linear-gradient(90deg, #c0c0c0, #ffffff, #a0a0a0, #ffffff, #c0c0c0)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "shimmer 3s linear infinite",
            textTransform: "uppercase"
          }}>RUPALI</span>
        </div>
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
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          <button 
            type="button" 
            onClick={handleFileClick}
            className="btn-add-chat btn-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" style={{ width: "18px", height: "18px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
          <input
            type="text"
            className="chat-input input-gradient"
            placeholder="Ask me anything..."
            style={{ paddingLeft: "45px" }}
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
        <div style={{
          textAlign: "center",
          marginTop: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px"
        }}>
          <span style={{ fontSize: "0.65rem", color: "#444", letterSpacing: "0.12em", textTransform: "uppercase" }}>Crafted by</span>
          <span style={{
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.18em",
            background: "linear-gradient(90deg, #888, #fff, #888, #fff, #888)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "shimmer 3s linear infinite",
            textTransform: "uppercase"
          }}>RUPALI</span>
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

        .btn-add {
          z-index: 3;
        }

        .btn-add-chat {
          position: absolute;
          left: 5px;
          top: 50%;
          transform: translateY(-50%);
          width: 36px;
          height: 36px;
          border-radius: 50% !important;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 5;
          cursor: pointer;
        }

        .btn-add-chat svg {
          width: 18px;
          height: 18px;
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

        @keyframes shimmer {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
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
