import { GoogleGenAI, Type, Chat } from "@google/genai";
import type { StoryState } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const storyModel = 'gemini-2.5-flash-lite';
const imageModel = 'imagen-4.0-generate-001';
const chatModel = 'gemini-2.5-flash';

const storyGenerationSchemaEn = {
  type: Type.OBJECT,
  properties: {
    storySegment: { type: Type.STRING, description: "The next paragraph of the story in English. It should be engaging and descriptive." },
    imagePrompt: { type: Type.STRING, description: "A concise, detailed visual description in English of the current scene for an image generation model." },
    choices: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of 3 distinct choices in English for the player." },
    inventory: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An updated list of all items the player is carrying, in English." },
    quest: { type: Type.STRING, description: "A brief, one-sentence description in English of the player's current main objective." },
  },
  required: ["storySegment", "imagePrompt", "choices", "inventory", "quest"],
};

const storyGenerationSchemaBn = {
    type: Type.OBJECT,
    properties: {
      storySegment: { type: Type.STRING, description: "গল্পের পরবর্তী অনুচ্ছেদটি বাংলায় লিখুন। এটি আকর্ষণীয় এবং বর্ণনামূলক হওয়া উচিত।" },
      imagePrompt: { type: Type.STRING, description: "বর্তমান দৃশ্যের একটি সংক্ষিপ্ত, বিস্তারিত চাক্ষুষ বর্ণনা দিন যা একটি ছবি তৈরির মডেলের জন্য ব্যবহার করা হবে।" },
      choices: { type: Type.ARRAY, items: { type: Type.STRING }, description: "খেলোয়াড়ের জন্য বাংলায় ৩টি ভিন্ন পছন্দের একটি তালিকা দিন।" },
      inventory: { type: Type.ARRAY, items: { type: Type.STRING }, description: "খেলোয়াড়ের কাছে থাকা সমস্ত জিনিসের একটি আপডেট করা তালিকা বাংলায় দিন।" },
      quest: { type: Type.STRING, description: "খেলোয়াড়ের বর্তমান প্রধান উদ্দেশ্যের একটি সংক্ষিপ্ত, এক-বাক্যের বর্ণনা বাংলায় দিন।" },
    },
    required: ["storySegment", "imagePrompt", "choices", "inventory", "quest"],
};

export async function generateStorySegment(storyHistory: string, language: 'en' | 'bn'): Promise<StoryState> {
  const isBengali = language === 'bn';
  const systemInstruction = isBengali
    ? `আপনি একজন দক্ষ গল্পকার। আপনি একটি টেক্সট-ভিত্তিক অ্যাডভেঞ্চার গেমের জন্য আকর্ষক, গতিশীল এবং সুসংগত কাহিনী তৈরি করেন। ব্যবহারকারী আপনাকে এ পর্যন্ত গল্পটি দেবে। আপনার কাজ হল একটি নতুন অংশ দিয়ে গল্পটি এগিয়ে নিয়ে যাওয়া, ৩টি পছন্দ দেওয়া, এবং ঘটনাগুলির উপর ভিত্তি করে খেলোয়াড়ের ইনভেন্টরি এবং বর্তমান কোয়েস্ট আপডেট করা। খেলোয়াড়ের পছন্দের উপর ভিত্তি করে গল্পটি বিকশিত হতে হবে। শুধুমাত্র নির্দিষ্ট JSON ফরম্যাটে উত্তর দিন। সমস্ত উত্তর অবশ্যই বাংলায় হতে হবে।`
    : `You are a master storyteller for an infinite text-based choose-your-own-adventure game. You create engaging, dynamic, and coherent narratives. The user will provide the story so far. Your task is to continue the story with a new segment, provide 3 choices, and update the player's inventory and current quest based on the events. The story must evolve based on the player's choices. Respond ONLY in the specified JSON format. All responses must be in English.`;

  const response = await ai.models.generateContent({
    model: storyModel,
    contents: storyHistory,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: isBengali ? storyGenerationSchemaBn : storyGenerationSchemaEn,
    },
  });

  const jsonText = response.text.trim();
  try {
    return JSON.parse(jsonText) as StoryState;
  } catch (e) {
    console.error("Failed to parse story state JSON:", e);
    console.error("Received text:", jsonText);
    return {
      storySegment: isBengali ? "এক অপ্রত্যাশিত ভাগ্য পরিবর্তন ঘটেছে, কিন্তু সামনের পথ পরিষ্কার নয়। পৃথিবী ঝিকমিক করছে, এবং আপনি নিজেকে আবার একটি চৌরাস্তায় খুঁজে পাচ্ছেন।" : "An unexpected twist of fate has occurred, but the path forward is unclear. The world shimmers, and you find yourself at a crossroads once more.",
      imagePrompt: "A mysterious, shimmering portal in a dark forest.",
      choices: isBengali ? ["পোর্টালের মধ্যে প্রবেশ করুন", "অন্য পথের সন্ধান করুন", "কিছু ঘটার জন্য অপেক্ষা করুন"] : ["Step through the portal", "Look for another path", "Wait for something to happen"],
      inventory: [],
      quest: isBengali ? "নতুন বাস্তবতায় আপনার অবস্থান খুঁজুন।" : "Find your bearings in a new reality."
    };
  }
}

const ART_STYLE_PREFIX = "Epic fantasy digital painting, detailed, cinematic lighting, in the style of a high-quality RPG concept art. ";

export async function generateImageUrl(prompt: string): Promise<string> {
    const fullPrompt = ART_STYLE_PREFIX + prompt;
    const response = await ai.models.generateImages({
        model: imageModel,
        prompt: fullPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '16:9',
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    throw new Error("Image generation failed");
}

let chatInstance: Chat | null = null;

export function startChat(language: 'en' | 'bn'): Chat {
  const systemInstruction = language === 'bn' 
    ? 'আপনি একজন সহায়ক এবং বন্ধুত্বপূর্ণ চ্যাটবট। ব্যবহারকারীর প্রশ্নের উত্তর সংক্ষেপে দিন।'
    : 'You are a helpful and friendly chatbot. Answer user questions concisely.';

  chatInstance = ai.chats.create({
    model: chatModel,
    config: { systemInstruction },
  });
  return chatInstance;
}

export async function sendMessageToBot(chat: Chat, message: string): Promise<string> {
    const response = await chat.sendMessage({ message });
    return response.text;
}