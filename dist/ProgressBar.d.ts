export declare class ProgressBar {
    private videoId;
    private barLen;
    constructor(videoId: number, barLen?: number);
    update(progress: number): void;
    finish(): void;
    erase(): void;
}
