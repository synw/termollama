import { Ollama } from 'ollama';
import { GPUInfo, MemInfo } from './interfaces.js';
import { getGPUMemoryInfo } from './lib/gpu.js';

let ollama: Ollama;
const displayThresholds = {
    temp: {
        low: 30,
        mid: 50,
        high: 70,
    },
    power: 20,
}
const memInfo: MemInfo = {
    hasGpu: false,
    gpu: {} as GPUInfo,
    gpusToUse: undefined,
}

function initMemoryState(cpuOnly?: boolean, gpusToUse?: Array<number>) {
    if (cpuOnly) {
        memInfo.hasGpu = false;
        return
    }
    memInfo.gpusToUse = gpusToUse;
    //console.log("GPTU", memInfo.gpusToUse)
    const res = getGPUMemoryInfo();
    if (!res.success) {
        throw new Error(`can not get gpu info: ${res}`)
    }
    memInfo.hasGpu = res.hasGPU;
    memInfo.gpu = res.info;
    //console.log("MEM STATE", memInfo);
}

function initOllamaInstanceState(addr: string = "localhost:11434", https = false) {
    const h = `${https ? 'https' : 'http'}://${addr}`;
    //console.log("Setting host to", h);
    ollama = new Ollama({ host: h })
}

function initEnvVars() {
    if (process.env["TERMOLLAMA_TEMPS"]) {
        const t = process.env["TERMOLLAMA_TEMPS"].split(",");
        if (t.length < 3) {
            throw new Error(`invalid value ${process.env["TERMOLLAMA_TEMPS"]} for TERMOLLAMA_TEMPS env var. Provide 3 numbers: '30,55,75'`)
        }
        displayThresholds.temp.low = parseInt(t[0]);
        displayThresholds.temp.mid = parseInt(t[1]);
        displayThresholds.temp.high = parseInt(t[2]);
    }
    if (process.env["TERMOLLAMA_POWER"]) {
        const p = parseInt(process.env["TERMOLLAMA_POWER"])
        if (isNaN(p)) {
            throw new Error(`invalid value for TERMOLLAMA_POWER: provide a number`)
        }
        displayThresholds.power = p;
    }
}

export {
    initOllamaInstanceState,
    initEnvVars,
    initMemoryState,
    memInfo,
    ollama,
    displayThresholds,
}