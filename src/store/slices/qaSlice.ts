import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IQAMessage, IQAState } from './interfaces/qa';

const initialState: IQAState = {
  questions: [],
  activeLiveAnswerId: null,
};

const qaSlice = createSlice({
  name: 'qa',
  initialState,
  reducers: {
    addQuestion(state, action: PayloadAction<IQAMessage>) {
      // Avoid duplicates
      if (!state.questions.find((q) => q.id === action.payload.id)) {
        state.questions.push(action.payload);
      }
    },
    upvoteQuestion(state, action: PayloadAction<{ id: string; userId: string }>) {
      const question = state.questions.find((q) => q.id === action.payload.id);
      if (question && !question.upvotedBy.includes(action.payload.userId)) {
        question.upvotes += 1;
        question.upvotedBy.push(action.payload.userId);
      }
    },
    markAsAnswered(state, action: PayloadAction<{ id: string; answer?: string }>) {
      const question = state.questions.find((q) => q.id === action.payload.id);
      if (question) {
        question.isAnswered = true;
        if (action.payload.answer) {
          question.answer = action.payload.answer;
        }
      }
    },
    setActiveLiveAnswer(state, action: PayloadAction<string | null>) {
      state.activeLiveAnswerId = action.payload;
    },
    deleteQuestion(state, action: PayloadAction<string>) {
      state.questions = state.questions.filter((q) => q.id !== action.payload);
      if (state.activeLiveAnswerId === action.payload) {
        state.activeLiveAnswerId = null;
      }
    },
  },
});

export const {
  addQuestion,
  upvoteQuestion,
  markAsAnswered,
  setActiveLiveAnswer,
  deleteQuestion,
} = qaSlice.actions;

export default qaSlice.reducer;
