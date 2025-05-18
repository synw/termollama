import color from "ansi-colors"
import { Options } from "cli-progress";
import { ExtendedModelData } from "../../interfaces.js";

const barTag = ` {percentage}% [\u001b[33;1m{bar}\u001b[0m]`;
const tagFormat = [barTag, "{output}"].join(" ")

const modelBarOptions: Options = {
    format: tagFormat,
    barCompleteChar: "|",
    barIncompleteChar: "|",
    autopadding: true,
    hideCursor: true,
    barGlue: '\u001b[38;5;237m',
};

function formatModelData(modelData: ExtendedModelData): string {
    const buf = new Array<string>();
    buf.push(color.bold(" " + modelData.name));
    buf.push(modelData.size);
    buf.push(color.dim(modelData.expire));
    return buf.join(" ")
}

export {
    modelBarOptions,
    formatModelData,
}