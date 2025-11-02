import React, { useState, useRef, useEffect } from 'react';
import type { Chat } from '@google/genai';
import { sendMessageToBot, startChat } from '../services/geminiService';
import type { ChatMessage } from '../types';

interface ChatbotProps {
  language: 'en' | 'bn';
  uiStrings: {
    title: string;
    placeholder: string;
    send: string;
    initialMessage: string;
    errorMessage: string;
  };
}

const ChatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const Chatbot: React.FC<ChatbotProps> = ({ language, uiStrings }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fontClass = language === 'bn' ? 'font-hind' : 'font-lora';

    useEffect(() => {
        if (isOpen) {
            chatRef.current = startChat(language);
            setMessages([{ role: 'model', text: uiStrings.initialMessage }]);
        }
    }, [isOpen, language, uiStrings.initialMessage]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !chatRef.current) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const botResponse = await sendMessageToBot(chatRef.current, input);
            const modelMessage: ChatMessage = { role: 'model', text: botResponse };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error('Chatbot error:', error);
            const errorMessage: ChatMessage = { role: 'model', text: uiStrings.errorMessage };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-lg transition-transform transform hover:scale-110 z-50"
                aria-label="Toggle Chatbot"
            >
                {isOpen ? <CloseIcon /> : <ChatIcon />}
            </button>
            
            {isOpen && (
                <div className={`fixed bottom-24 right-6 w-full max-w-md h-auto max-h-[70vh] bg-gray-800 border border-gray-700 rounded-lg shadow-2xl flex flex-col z-40 ${fontClass}`}>
                    <div className="p-4 border-b border-gray-700 text-lg font-semibold">{uiStrings.title}</div>
                    <div className="flex-1 p-4 overflow-y-auto space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`px-4 py-2 rounded-lg max-w-[80%] ${msg.role === 'user' ? 'bg-purple-600' : 'bg-gray-600'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="px-4 py-2 rounded-lg bg-gray-600">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
                                        <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse delay-75"></div>
                                        <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse delay-150"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700 flex">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={uiStrings.placeholder}
                            className="flex-1 bg-gray-700 border border-gray-600 rounded-l-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            disabled={isLoading}
                        />
                        <button type="submit" className="bg-purple-600 text-white px-4 rounded-r-md hover:bg-purple-700 disabled:bg-gray-500" disabled={isLoading}>
                            {uiStrings.send}
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};