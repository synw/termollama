import { Ollama } from 'ollama';

let ollama: Ollama;
const displayThresholds = {
    temp: {
        low: 30,
        mid: 50,
        high: 70,
    },
    power: 20,
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
    ollama,
    displayThresholds,
}