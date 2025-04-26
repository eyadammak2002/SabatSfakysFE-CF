declare interface VideoFrame {
    // Interface minimale pour satisfaire TypeScript
    readonly format: string;
    readonly width: number;
    readonly height: number;
    close(): void;
  }