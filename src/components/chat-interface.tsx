"use client";

import { useState, useRef, useEffect, type FormEvent, ChangeEvent } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, PlusCircle, Send, LoaderCircle, Paperclip, XCircle, File as FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAIResponse } from "@/app/actions";
import { StreamingText } from "./streaming-text";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface Message {
  role: "user" | "ai";
  content: string;
  file?: {
    name: string;
    type: string;
    data: string;
  }
}

interface UploadedFile {
  name: string;
  type: string;
  data: string; // data URI
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
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


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
    setUploadedFile(null);
  };
  
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setUploadedFile({
          name: file.name,
          type: file.type,
          data: dataUrl,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    if(fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const userInput = input.trim();
    if ((!userInput && !uploadedFile) || isLoading) return;

    const oldMessages = messages;
    const newUserMessage: Message = { role: "user", content: userInput, file: uploadedFile || undefined };
    
    setMessages((prev) => [...prev, newUserMessage]);
    setInput("");
    setUploadedFile(null);
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
        file: uploadedFile ? { data: uploadedFile.data, name: uploadedFile.name } : undefined,
      });
      setMessages((prev) => [...prev, { role: "ai", content: response.response }]);
    } catch (error) {
      console.error("Error fetching AI response:", error);
      setMessages((prev) => [...prev, { role: "ai", content: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setIsLoading(false);
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
                {message.file && (
                   <div className="mb-2">
                   {message.file.type.startsWith("image/") ? (
                     <Image src={message.file.data} alt={message.file.name} width={200} height={150} className="rounded-lg object-cover"/>
                   ) : (
                     <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
                       <FileIcon className="h-6 w-6" />
                       <span className="text-sm truncate">{message.file.name}</span>
                     </div>
                   )}
                 </div>
                )}
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
        <div className="mx-auto w-full max-w-3xl">
          {uploadedFile && (
            <div className="mb-2 flex items-center justify-between rounded-lg border p-2 bg-secondary">
              <div className="flex items-center gap-2">
                {uploadedFile.type.startsWith("image/") ? (
                  <Image src={uploadedFile.data} alt={uploadedFile.name} width={40} height={40} className="rounded object-cover"/>
                ) : (
                  <FileIcon className="h-6 w-6" />
                )}
                <span className="text-sm text-secondary-foreground truncate">{uploadedFile.name}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={removeFile} className="h-6 w-6">
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          )}
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="flex items-start gap-3"
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isLoading || !!uploadedFile} className="h-11 w-11 flex-shrink-0">
                    <Paperclip className="h-5 w-5" />
                    <span className="sr-only">Attach file</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Attach Image or PDF</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,application/pdf"
              disabled={!!uploadedFile}
            />

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
            <Button type="submit" size="icon" disabled={isLoading || (!input && !uploadedFile)} className="h-11 w-11 rounded-full flex-shrink-0" aria-label="Send message">
              {isLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
