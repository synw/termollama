import { ServeOptions } from "./interfaces.js";
import { execute } from "./lib/execute.js";

async function serve(options: ServeOptions) {
    if (options?.flashAttention) {
        process.env["OLLAMA_FLASH_ATTENTION"] = "1";
    }
    if (options?.kv4) {
        process.env["OLLAMA_KV_CACHE_TYPE"] = "q4_0";
    } else if (options?.kv8) {
        process.env["OLLAMA_KV_CACHE_TYPE"] = "q8_0";
    }
    if (options?.debug) {
        process.env["OLLAMA_DEBUG"] = "1";
    }
    if (options?.cpu) {
        process.env["CUDA_VISIBLE_DEVICES"] = "-1";
    } else if (options?.gpu) {
        process.env["CUDA_VISIBLE_DEVICES"] = options.gpu.join(",");
    }
    if (options?.keepAlive) {
        process.env["OLLAMA_KEEP_ALIVE"] = options.keepAlive;
    }
    if (options?.ctx) {
        process.env["OLLAMA_CONTEXT_LENGTH"] = options.ctx.toString();
    }
    if (options?.host) {
        process.env["OLLAMA_HOST"] = options.host;
    }
    if (options?.port) {
        process.env["OLLAMA_HOST"] = options?.host ? options.host + ":" + options.port.toString() : "localhost:" + options.port.toString();
    }
    if (options?.maxLoadedModels) {
        process.env["OLLAMA_MAX_LOADED_MODELS"] = options.maxLoadedModels.toString()
    }
    if (options?.maxQueue) {
        process.env["OLLAMA_MAX_QUEUE"] = options.maxQueue.toString()
    }
    if (options?.numParallel) {
        process.env["OLLAMA_NUM_PARALLEL"] = options.numParallel.toString()
    }
    if (options?.registry) {
        process.env["OLLAMA_MODELS"] = options.registry;
    }
    await execute("ollama", ["serve"])
}

export { serve };

