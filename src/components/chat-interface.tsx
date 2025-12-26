"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, PlusCircle, Send, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAIResponse } from "@/app/actions";
import { StreamingText } from "./streaming-text";

interface Message {
  role: "user" | "ai";
  content: string;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content: "Hello! I am Luminous Echo. How can I assist you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleNewChat = () => {
    setMessages([
      {
        role: "ai",
        content: "New chat started. How can I help?",
      },
    ]);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const userInput = input.trim();
    if (!userInput || isLoading) return;

    const oldMessages = messages;
    const newUserMessage: Message = { role: "user", content: userInput };
    
    setMessages((prev) => [...prev, newUserMessage]);
    setInput("");
    setIsLoading(true);

    const historyForAI: { user: string; ai: string }[] = [];
    for (let i = 0; i < oldMessages.length; i++) {
      if (
        oldMessages[i].role === "user" &&
        i + 1 < oldMessages.length &&
        oldMessages[i + 1].role === "ai"
      ) {
        historyForAI.push({
          user: oldMessages[i].content,
          ai: oldMessages[i + 1].content,
        });
        i++;
      }
    }

    try {
      const response = await getAIResponse({
        message: userInput,
        chatHistory: historyForAI,
      });
      setMessages((prev) => [...prev, { role: "ai", content: response.response }]);
    } catch (error) {
      console.error("Error fetching AI response:", error);
      setMessages((prev) => [...prev, { role: "ai", content: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b p-3 sm:p-4">
        <h1 className="text-lg sm:text-xl font-bold font-headline">Luminous Echo</h1>
        <Button variant="ghost" size="icon" onClick={handleNewChat} aria-label="New Chat">
          <PlusCircle className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>
      </header>

      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="space-y-6 p-4 sm:p-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex items-start gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "ai" && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl rounded-xl px-4 py-3 text-sm sm:text-base shadow-md",
                  message.role === "user"
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-primary text-primary-foreground"
                )}
              >
                {message.role === 'ai' ? <StreamingText text={message.content} /> : <p className="whitespace-pre-wrap">{message.content}</p>}
              </div>
              {message.role === "user" && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="border-t bg-background p-4">
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="mx-auto flex w-full max-w-3xl items-start gap-3"
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Luminous Echo..."
            className="flex-1 resize-none overflow-y-auto rounded-xl border-input bg-secondary p-3 text-base min-h-[44px] max-h-48"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                formRef.current?.requestSubmit();
              }
            }}
            rows={1}
            disabled={isLoading}
            aria-label="Chat input"
          />
          <Button type="submit" size="icon" disabled={isLoading} className="h-11 w-11 rounded-full flex-shrink-0" aria-label="Send message">
            {isLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
