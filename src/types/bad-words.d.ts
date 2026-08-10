declare module 'bad-words' {
  export class Filter {
    constructor(options?: any);
    isProfane(text: string): boolean;
    clean(text: string): string;
    addWords(...words: string[]): void;
    removeWords(...words: string[]): void;
    list: string[];
  }
}

declare module 'bad-words-es' {
  const badWordsEs: string[];
  export default badWordsEs;
}
