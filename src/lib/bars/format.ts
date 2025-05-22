import color from "ansi-colors";
import { CardBarInfo } from "../../interfaces.js";
import { displayThresholds } from "../../state.js";
import { formatFileSize } from "../utils.js";

const tagBar = "GPU {displayIndex} [{bar}\u001b[0m] {percentage}%";
const tagMemFinal = '{displayMem}';
const tagMemFree = '{displayFreeMem}';
const tagMemUsed = '{displayUsedMem} used';
const tagPower = "{displayPowerDraw}";
//const tagPowerPercent = "{powerPercent}%";
const tagTemp = "{displayTemperature}";
const tagFormat = new Array<string>(tagBar, tagMemFinal, tagTemp, tagPower).join(" | ");
const totalBarTagFormat = new Array<string>(tagBar, tagMemFinal, tagPower).join(" | ");

function padCardInfo(data: CardBarInfo): CardBarInfo {
    if (data.formatMaxLength.gpuFinal > data.displayMem.length) {
        data.displayMem = data.displayMem.padEnd(data.formatMaxLength.gpuFinal);
    }
    if (data.formatMaxLength.temp > data.displayTemperature.length) {
        data.displayTemperature = data.displayTemperature.padEnd(data.formatMaxLength.temp);
    }
    /*if (data.formatMaxLength.power > data.displayPowerDraw.toString().length) {
        data.displayPowerDraw = data.displayPowerDraw.toString().padEnd(data.formatMaxLength.power);
    }*/
    return data
}

function calcSectionsLengthAndFormat(
    data: CardBarInfo,
    colorizeMem = false,
    colorizePower = true,
): CardBarInfo {
    const freeMem = data.totalMemory - data.usedMemory;
    const formatedGpuFree = tagMemFree.replace(`{displayFreeMem}`, formatFileSize(freeMem));
    const formatedGpuUsed = tagMemUsed.replace(`{displayUsedMem}`, formatFileSize(data.usedMemory));
    const dt = `${data.temperature}°C`;
    let dtf: string;
    if (data.temperature < displayThresholds.temp.low) {
        dtf = color.green(dt)
    } else if (data.temperature < displayThresholds.temp.mid) {
        dtf = color.greenBright(dt)
    } else if (data.temperature < displayThresholds.temp.high) {
        dtf = color.yellowBright(dt)
    } else {
        dtf = color.redBright(dt)
    }
    const pwd = data.powerDraw.toString() + " W";
    let xwft = pwd;
    if (colorizePower) {
        if (data.powerPercent > displayThresholds.power) {
            xwft = color.yellowBright(pwd)
        } else {
            if (data.powerDraw >= 100) {
                xwft = xwft
            } else {
                xwft = xwft + " "
            }
        }
    }
    const fpp = color.dim(data.powerPercent.toString() + "%");
    const formatedTemp = tagTemp.replace("{displayTemperature}", dtf);
    const formatedPower = tagPower.replace("{displayPowerDraw}", xwft + " " + fpp);
    let formatedMemFinal: string
    if (colorizeMem) {
        formatedMemFinal = color.yellowBright(formatedGpuUsed) + " " + color.greenBright(`${formatedGpuFree} free`);
    } else {
        formatedMemFinal = formatedGpuUsed + color.dim(` ${formatedGpuFree} free`);
    }
    if (formatedMemFinal.length > data.formatMaxLength.gpuFinal) {
        data.formatMaxLength.gpuFinal = formatedMemFinal.length;
    }
    if (formatedTemp.length > data.formatMaxLength.temp) {
        data.formatMaxLength.temp = formatedTemp.length;
    }
    /*if (formatedPower.length > data.formatMaxLength.power) {
        data.formatMaxLength.power = formatedPower.length;
    }*/
    data.displayMem = formatedMemFinal;
    data.displayFreeMem = formatedGpuFree;
    data.displayUsedMem = formatedGpuUsed;
    data.displayTemperature = formatedTemp;
    data.displayPowerDraw = formatedPower;
    return data
}

export {
    calcSectionsLengthAndFormat,
    padCardInfo,
    tagFormat,
    totalBarTagFormat,

}