"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressBar = void 0;
class ProgressBar {
    constructor(videoId, barLen = 20) {
        this.videoId = videoId;
        this.barLen = barLen;
    }
    update(progress) {
        const percentage = Math.round(progress * 100);
        const bar = '='.repeat(Math.round(progress * this.barLen)) + ' '.repeat(this.barLen - Math.round(progress * this.barLen));
        process.stdout.write(`\r [${bar}] ${percentage}% of comments retrieved for video ${this.videoId}`);
    }
    finish() {
        process.stdout.write(`\r [${'='.repeat(this.barLen)}] 100% of comments retrieved for video ${this.videoId}`);
        process.stdout.write('\n');
        console.log('Done !');
    }
    erase() {
        process.stdout.write('\r');
        process.stdout.write('\n');
    }
}
exports.ProgressBar = ProgressBar;
//# sourceMappingURL=ProgressBar.js.map