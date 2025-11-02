
export interface StoryState {
  storySegment: string;
  imagePrompt: string;
  choices: string[];
  inventory: string[];
  quest: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
