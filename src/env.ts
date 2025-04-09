import color from "ansi-colors";
import { EnvVars } from './interfaces.js';

const envVars: EnvVars = {
    "OLLAMA_FLASH_ATTENTION": null,
    "OLLAMA_KV_CACHE_TYPE": null,
    "OLLAMA_KEEP_ALIVE": null,
    "OLLAMA_MAX_LOADED_MODELS": null,
    "OLLAMA_CONTEXT_LENGTH": null,
    "OLLAMA_MAX_QUEUE": null,
    "OLLAMA_NUM_PARALLEL": null,
    "OLLAMA_HOST": null,
    "OLLAMA_ORIGINS": null,
    "OLLAMA_MODELS": null,
    "CUDA_VISIBLE_DEVICES": null,
};

async function initEnvVars(): Promise<Record<string, any>> {
    const currentEnvVars: Record<string, any> = {};
    for (const v of Object.keys(envVars)) {
        const ev = process.env[v];
        //console.log("EV", ev);
        if (!ev) {
            currentEnvVars[v] = null
        }
        else {
            currentEnvVars[v] = ev
        }
    }
    return currentEnvVars
}

async function confEnv() {
    const ev = await initEnvVars();
    for (const [k, v] of Object.entries(ev)) {
        let _n: string;
        if (!v) {
            // default value
            _n = k + " " + color.dim("(default)");
        } else {
            _n = k + ": " + color.bold(v);
        }
        console.log(_n)
    };
}

export {
    confEnv,
}

