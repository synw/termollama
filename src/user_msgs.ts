import { exit } from "process";
import chalk from 'chalk';

function runtimeError(...msg: string[]) {
    console.warn("💥", chalk.dim("Runtime error:"), ...msg);
    exit(1)
}

function runtimeWarning(...msg: string[]) {
    console.warn("⚠️", chalk.dim("Runtime warning:"), ...msg);
    //exit(1)
}

function runtimeDataError(...msg: string[]) {
    console.warn("❌", chalk.dim("Runtime data error:"), ...msg);
    exit(1)
}

function runtimeParamError(...msg: string[]) {
    console.warn("🛠️ ", chalk.dim("Param error:"), ...msg);
    exit(1)
}

function runtimeInfo(...msg: string[]) {
    //console.log("ℹ️ ", chalk.dim("Info:"), ...msg);
    console.log("📫", chalk.dim("Info:"), ...msg);
}

export {
    runtimeError,
    runtimeWarning,
    runtimeDataError,
    runtimeInfo,
    runtimeParamError,
}