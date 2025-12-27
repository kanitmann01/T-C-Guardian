import { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, Bot, User as UserIcon } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { cn } from "../lib/utils";
import { chatWithContract } from "../services/api";
import type { ChatMessage } from "../services/api";
import { BackButton } from "../components/common/BackButton";

interface ChatProps {
    onBack: () => void;
    contextText?: string; // The full contract text
}

export default function Chat({ onBack, contextText }: ChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: "model", parts: ["Hello! I am the Paranoid Lawyer. Ask me anything about this contract."] }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !contextText) return;

        const userMsg: ChatMessage = { role: "user", parts: [input] };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            // Filter history to exclude initial welcome or format strictly
            const historyToSend = messages.filter(m => m.role === "user" || m.role === "model");
            const res = await chatWithContract(historyToSend, input, contextText);

            const botMsg: ChatMessage = { role: "model", parts: [res.answer] };
            setMessages(prev => [...prev, botMsg]);
        } catch (e) {
            const errorMsg: ChatMessage = { role: "model", parts: ["Sorry, I encountered an error checking the contract."] };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!contextText) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center text-white p-4 md:p-8 text-center">
                <h2 className="text-xl mb-4">No Contract Loaded</h2>
                <p className="text-slate-400 mb-4">Please go back and upload a document first.</p>
                <Button onClick={onBack} className="relative z-20">Back to Dashboard</Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 text-white font-sans flex flex-col">
            <header className="mb-4 md:mb-6">
                <BackButton onClick={onBack} label="Back to Dashboard" />
                <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 md:h-6 md:w-6 text-blue-400" />
                    <h1 className="text-xl md:text-2xl font-bold">Ask the Contract</h1>
                </div>
            </header>

            <Card className="flex-1 max-w-4xl mx-auto w-full flex flex-col overflow-hidden bg-slate-900/50 border-white/10">

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                    {messages.map((msg, idx) => (
                        <div key={idx} className={cn(
                            "flex gap-3 max-w-[80%]",
                            msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                        )}>
                            <div className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                                msg.role === "user" ? "bg-blue-600" : "bg-purple-600"
                            )}>
                                {msg.role === "user" ? <UserIcon className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                            </div>
                            <div className={cn(
                                "p-3 rounded-2xl text-sm leading-relaxed",
                                msg.role === "user" ? "bg-blue-600/20 text-blue-50 border border-blue-500/20 rounded-tr-none" : "bg-white/5 text-slate-200 border border-white/10 rounded-tl-none"
                            )}>
                                {msg.parts[0]}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3 mr-auto max-w-[80%]">
                            <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
                                <Bot className="h-5 w-5 animate-pulse" />
                            </div>
                            <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/10">
                                <div className="flex gap-1 h-full items-center">
                                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-black/20 border-t border-white/10 flex gap-2">
                    <input
                        className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white placeholder-slate-500"
                        placeholder="Ask about data rights, fees, cancellation..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        disabled={isLoading}
                    />
                    <Button
                        size="icon"
                        className="rounded-full bg-blue-600 hover:bg-blue-500 relative z-20"
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>

            </Card>
        </div>
    );
}
