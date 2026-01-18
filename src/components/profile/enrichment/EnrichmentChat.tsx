import { useRef, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { cn } from "~/lib/utils";

interface Message {
  _id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

interface EnrichmentChatProps {
  messages: Message[];
  input: string;
  onInputChange: (value: string) => void;
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function EnrichmentChat({
  messages,
  input,
  onInputChange,
  onSendMessage,
  isLoading,
  disabled = false,
}: EnrichmentChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && !disabled) {
      onSendMessage(input.trim());
      onInputChange("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-[500px]">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="size-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <MessageSquare className="size-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              Start a conversation
            </h3>
            <p className="text-slate-500 text-sm max-w-sm">
              Tell me about your background and interests in AI safety. I will help
              you articulate your experience and goals for your profile.
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={message._id}
              className={cn(
                "flex animate-in fade-in slide-in-from-bottom-2 duration-300",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-slate-100 text-slate-900 rounded-bl-md"
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))
        )}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex justify-start animate-in fade-in duration-200">
            <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="size-2 bg-slate-400 rounded-full animate-bounce" />
                <span
                  className="size-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <span
                  className="size-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="border-t p-4 flex gap-2 bg-slate-50"
      >
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            messages.length === 0
              ? "Tell me about your background..."
              : "Continue the conversation..."
          }
          disabled={isLoading || disabled}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={!input.trim() || isLoading || disabled}
          size="icon"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
