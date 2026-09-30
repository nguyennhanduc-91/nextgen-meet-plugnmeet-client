export interface IQAMessage {
  id: string; // Unique ID for the question
  userId: string;
  name: string;
  question: string;
  timestamp: number;
  upvotes: number;
  upvotedBy: string[]; // List of user IDs who upvoted
  isAnswered: boolean;
  answer?: string; // Optional typed answer
}

export interface IQAState {
  questions: IQAMessage[];
  activeLiveAnswerId: string | null; // ID of the question currently being answered live on screen
}
