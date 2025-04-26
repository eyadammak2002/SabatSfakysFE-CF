export interface OpenAIResponse {
    id: string;
    object: string;
    choices: {
      index: number;
      message: {
        role: string;
        content: string;
      }
    }[];
  }