declare module 'mammoth/mammoth.browser' {
  interface MammothRawResult {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }
  interface MammothOptions {
    arrayBuffer?: ArrayBuffer;
  }
  interface Mammoth {
    extractRawText(options: MammothOptions): Promise<MammothRawResult>;
  }
  const mammoth: Mammoth;
  export = mammoth;
}
