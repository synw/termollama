import * as readline from 'readline';
// @ts-ignore
import humanizeDuration from "humanize-duration";
import { filesize } from "filesize";
import { KeyPress } from '../interfaces.js';

function formatFileSize(bytes: number, decimals: number = 1): string {
    return filesize(bytes, { round: decimals, standard: "iec" });
}

function getTimeHumanizedUntil(futureDateString: string): string {
    const futureDate = new Date(futureDateString);
    const now = new Date();
    const diffInMilliseconds = futureDate.getTime() - now.getTime();
    if (diffInMilliseconds < 0) {
        return "0"
    }
    if (diffInMilliseconds <= 60000) {
        return humanizeDuration(diffInMilliseconds, { units: ["d", "h", "m", "s"], round: true });
    }
    const res = humanizeDuration(diffInMilliseconds, { units: ["d", "h", "m"], round: true });
    return res
}

async function keyPressDetection(onKeyPress: (key: KeyPress) => Promise<void>, onTimeout: () => void, timeout: number) {
    // Enable keypress events
    readline.emitKeypressEvents(process.stdin);

    // Make stdin raw mode
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
    }

    // Handle keypress events
    const keypressHandler = (chunk: string, key: KeyPress) => {
        cleanup(0, false);
        onKeyPress(key);
        process.stdout.cursorTo(0);
        process.stdout.clearLine(1);
        //process.exit(0);
    };

    process.stdin.on('keypress', keypressHandler);

    // Handle errors
    process.stdin.on('error', (error: Error) => {
        console.error('stdin error:', error);
        cleanup(1);
    });

    // Set timeout to stop listening for key presses
    const timer = setTimeout(() => {
        onTimeout();
        cleanup(0);
    }, timeout);

    // Cleanup function to reset stdin and exit process
    function cleanup(exitCode: number = 0, exit = true) {
        clearTimeout(timer);
        process.stdin.removeListener('keypress', keypressHandler);
        process.stdin.setRawMode(false);
        process.stdin.resume();
        if (exit) {
            process.exit(exitCode);
        }
    }
}

export {
    formatFileSize,
    getTimeHumanizedUntil,
    keyPressDetection,
}