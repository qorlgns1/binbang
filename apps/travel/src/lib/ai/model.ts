import type { LanguageModel } from 'ai';
import { google } from '@ai-sdk/google';

export const geminiFlashLite: LanguageModel = google('gemini-2.5-flash-lite');
