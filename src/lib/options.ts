import { ParsedOptions } from "../interfaces.js";

const flagOptions: Array<string> = [
    "-fa", "-kv4", "-kv8", "-kv16", "-d", "-cpu"
];

const valueOptions: Array<string> = [
    "-ka", "-mm", "-mq", "-np", "-gpu", "-ctx", "-p", "-h"
];

function parseServeOptions(args: Array<string>): ParsedOptions {
    const parsedFlags: string[] = [];
    const parsedValues: Record<string, string> = {};

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg == "-x") { continue }

        if (flagOptions.includes(arg)) {
            // If the argument is a flag option, add it to the flags array without the hyphen
            parsedFlags.push(arg.slice(1));
        } else if (valueOptions.includes(arg)) {
            // If the argument is a value option, check for the next argument as its value and parse it as a number
            if (i + 1 < args.length && !flagOptions.includes(args[i + 1]) && !valueOptions.includes(args[i + 1])) {
                parsedValues[arg.slice(1)] = args[++i];
            } else {
                throw new Error(`Value expected after ${arg}`);
            }
        } else {
            // Handle unexpected arguments
            console.warn(`Unexpected argument: ${arg}`);
        }
    }

    return { flags: parsedFlags, ...parsedValues };
}

export {
    parseServeOptions,
    valueOptions,
    flagOptions,
}