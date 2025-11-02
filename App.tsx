import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateStorySegment, generateImageUrl } from './services/geminiService';
import type { StoryState } from './types';
import { Sidebar } from './components/Sidebar';
import { Chatbot } from './components/Chatbot';

const translations = {
    en: {
        title: "Gemini Adventure Engine",
        intro: "Embark on a limitless journey where every choice you make crafts a unique story. Powered by Gemini, this adventure engine generates a dynamic world, real-time images, and evolving quests just for you. No two adventures are ever the same.",
        startButton: "Start Your Adventure",
        loadingMessages: [
            "Weaving the threads of fate...",
            "Consulting the ancient oracles...",
            "Painting the world with words...",
            "Summoning creatures from the ether...",
            "Charting a course through the unknown...",
            "Asking the stars for guidance...",
        ],
        imageLoader: "Painting your next scene...",
        sidebar: {
            quest: "Current Quest",
            inventory: "Inventory",
            emptyInventory: "Your backpack is empty.",
            startQuest: "Your adventure is just beginning...",
        },
        chatbot: {
            title: "Gemini Assistant",
            placeholder: "Ask something...",
            send: "Send",
            initialMessage: "Hello! How can I help you?",
            errorMessage: "Sorry, I encountered an error. Please try again.",
        },
        initialChoice: "Begin the adventure.",
        initialHistory: "You stand at the edge of a forgotten wood, a place whispered about in taverns but never visited. The air is thick with the scent of ancient earth and something else... something magical. Before you lies a choice.",
    },
    bn: {
        title: "জেমিনি অ্যাডভেঞ্চার ইঞ্জিন",
        intro: "এমন এক অসীম যাত্রায় অংশ নিন যেখানে আপনার প্রতিটি পছন্দ একটি অনন্য গল্প তৈরি করে। জেমিনি দ্বারা চালিত, এই অ্যাডভেঞ্চার ইঞ্জিনটি শুধুমাত্র আপনার জন্য একটি গতিশীল বিশ্ব, রিয়েল-টাইম ছবি এবং পরিবর্তনশীল কোয়েস্ট তৈরি করে। কোনো দুটি অ্যাডভেঞ্চার কখনও এক হয় না।",
        startButton: "আপনার অভিযান শুরু করুন",
        loadingMessages: [
            "ভাগ্যের সুতো বুনছি...",
            "প্রাচীন দৈববাণী শুনছি...",
            "শব্দ দিয়ে বিশ্ব আঁকছি...",
            "মহাশূন্য থেকে প্রাণী ডাকছি...",
            "অজানার পথে পা বাড়াচ্ছি...",
            "নক্ষত্রদের কাছে নির্দেশনা চাইছি...",
        ],
        imageLoader: "আপনার পরবর্তী দৃশ্য আঁকা হচ্ছে...",
        sidebar: {
            quest: "বর্তমান কোয়েস্ট",
            inventory: "ইনভেন্টরি",
            emptyInventory: "আপনার ব্যাগ খালি।",
            startQuest: "আপনার অভিযান সবে শুরু হয়েছে...",
        },
        chatbot: {
            title: "জেমিনি অ্যাসিস্ট্যান্ট",
            placeholder: "কিছু জিজ্ঞাসা করুন...",
            send: "পাঠান",
            initialMessage: "নমস্কার! আমি আপনাকে কিভাবে সাহায্য করতে পারি?",
            errorMessage: "দুঃখিত, একটি ত্রুটি ঘটেছে। আবার চেষ্টা করুন।",
        },
        initialChoice: "অভিযান শুরু করুন।",
        initialHistory: "আপনি এক বিস্মৃত বনের ধারে দাঁড়িয়ে আছেন, এমন এক জায়গা যা শুঁড়িখানায় আলোচিত হলেও কেউ কখনও যায়নি। বাতাস প্রাচীন পৃথিবীর ঘ্রাণে এবং আরও কিছুতে... জাদুকরী কিছুতে ভরা। আপনার সামনে একটি পছন্দ রয়েছে।",
    }
};

const Loader: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-black bg-opacity-50 rounded-lg">
        <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-xl font-lora italic">{message}</p>
    </div>
);

const ChoiceIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

const App: React.FC = () => {
    const [gameState, setGameState] = useState<StoryState | null>(null);
    const [imageUrl, setImageUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGameStarted, setIsGameStarted] = useState(false);
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [language, setLanguage] = useState<'en' | 'bn'>('en');
    const [currentLoadingMessage, setCurrentLoadingMessage] = useState(translations.en.loadingMessages[0]);
    const storyHistory = useRef<string[]>([]);
    
    const ui = translations[language];
    const fontClass = language === 'bn' ? 'font-hind' : 'font-lora';

    useEffect(() => {
        if(isLoading) {
            const interval = setInterval(() => {
                const messages = ui.loadingMessages;
                setCurrentLoadingMessage(messages[Math.floor(Math.random() * messages.length)]);
            }, 2000);
            return () => clearInterval(interval);
        }
    }, [isLoading, ui.loadingMessages]);
    
    const fetchNextStep = useCallback(async (choice: string) => {
        setIsLoading(true);
        setIsImageLoading(true);
        
        const newHistory = [...storyHistory.current, `Player chose: "${choice}"`];
        storyHistory.current = newHistory;

        const fullStoryText = newHistory.join('\n');
        
        try {
            const newState = await generateStorySegment(fullStoryText, language);
            setGameState(newState);
            // The image prompt should remain in English for better consistency with the art style prefix.
            // However, the model generates it, so we use it as is.
            storyHistory.current.push(newState.storySegment);
            
            generateImageUrl(newState.imagePrompt)
                .then(url => setImageUrl(url))
                .catch(err => {
                    console.error("Image generation failed:", err);
                    setImageUrl("https://picsum.photos/1280/720?blur=2&grayscale");
                })
                .finally(() => setIsImageLoading(false));

        } catch (error) {
            console.error("Failed to fetch next game step:", error);
        } finally {
            setIsLoading(false);
        }
    }, [language]);

    const startGame = () => {
        setIsGameStarted(true);
        storyHistory.current = [ui.initialHistory];
        fetchNextStep(ui.initialChoice);
    };

    const handleChoice = (choice: string) => {
        fetchNextStep(choice);
    };

    return (
        <div className={`min-h-screen ${fontClass} p-4 md:p-6 flex flex-col`}>
             <header className="text-center mb-6 z-10 flex flex-col items-center">
                <h1 className="text-4xl md:text-6xl font-cinzel font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                    {ui.title}
                </h1>
                {!isGameStarted && (
                    <div className="mt-4 flex space-x-4">
                        <button onClick={() => setLanguage('en')} className={`px-4 py-2 text-sm rounded-md transition-colors ${language === 'en' ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>English</button>
                        <button onClick={() => setLanguage('bn')} className={`px-4 py-2 text-sm rounded-md transition-colors ${language === 'bn' ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>বাংলা</button>
                    </div>
                )}
            </header>

            {!isGameStarted ? (
                <div className="flex flex-1 items-center justify-center">
                    <div className="text-center bg-black/40 backdrop-blur-sm p-8 md:p-12 rounded-xl border border-white/10 max-w-3xl flex flex-col items-center">
                         <p className="text-gray-300 mb-8 text-lg md:text-xl leading-relaxed">
                            {ui.intro}
                        </p>
                        <button
                            onClick={startGame}
                            className="px-8 py-4 bg-purple-600 text-white font-bold font-cinzel text-xl rounded-lg shadow-lg hover:bg-purple-700 transition-all duration-300 transform hover:scale-105 animate-pulse hover:animate-none"
                        >
                            {ui.startButton}
                        </button>
                    </div>
                </div>
            ) : (
                <main className="flex flex-col md:flex-row gap-6 flex-1">
                    <div className="flex-1 bg-gray-900/50 backdrop-blur-sm p-6 rounded-lg border border-gray-700/50 flex flex-col justify-between">
                        <div>
                            <div className="relative w-full aspect-video bg-gray-900 rounded-lg mb-4 overflow-hidden border-2 border-gray-700">
                                {isImageLoading ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                        <Loader message={ui.imageLoader} />
                                    </div>
                                ) : (
                                    <img src={imageUrl} alt="Generated scene" className="w-full h-full object-cover transition-opacity duration-500" />
                                )}
                            </div>
                            
                            {isLoading && !gameState ? (
                                <Loader message={currentLoadingMessage} />
                            ) : (
                                <p className="text-lg leading-loose mb-6 whitespace-pre-wrap">{gameState?.storySegment}</p>
                            )}
                        </div>

                        <div className="mt-auto pt-4">
                            {isLoading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="h-16 bg-gray-700 rounded-lg animate-pulse"></div>
                                    ))}
                                </div>
                            ) : (
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {gameState?.choices.map((choice, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleChoice(choice)}
                                            className="group w-full text-left p-4 bg-gray-700/80 rounded-lg hover:bg-purple-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transform hover:scale-105 hover:shadow-xl flex items-center"
                                        >
                                            <ChoiceIcon />
                                            <span>{choice}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {gameState && <Sidebar 
                        inventory={gameState.inventory} 
                        quest={gameState.quest}
                        questTitle={ui.sidebar.quest}
                        inventoryTitle={ui.sidebar.inventory}
                        emptyInventoryText={ui.sidebar.emptyInventory}
                        startQuestText={ui.sidebar.startQuest}
                        fontClass={fontClass}
                    />}
                </main>
            )}
            <Chatbot language={language} uiStrings={ui.chatbot}/>
        </div>
    );
};

export default App;