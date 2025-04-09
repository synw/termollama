import { execute } from "./lib/execute.js";
import { parseServeOptions } from "./lib/options.js";

async function serve(args: Array<string>) {
    const opts = parseServeOptions(args);
    //console.log("OPTS", opts);
    let isCpu = false;
    opts.flags.forEach((f) => {
        switch (f) {
            case "fa":
                process.env["OLLAMA_FLASH_ATTENTION"] = "1";
                break;
            case "kv4":
                process.env["OLLAMA_KV_CACHE_TYPE"] = "q4_0";
                break
            case "kv8":
                process.env["OLLAMA_KV_CACHE_TYPE"] = "q8_0";
                break
            case "kv16":
                process.env["OLLAMA_KV_CACHE_TYPE"] = "f16";
                break
            case "d":
                process.env["OLLAMA_DEBUG"] = "1";
                break
            case "cpu":
                isCpu = true;
                process.env["CUDA_VISIBLE_DEVICES"] = "-1";
                break;
        }
    });
    const vals = opts as Record<string, any>;
    delete vals.flags;
    for (const [k, v] of Object.entries(vals)) {
        let n: string;
        let _v = v;
        switch (k) {
            case "ka":
                n = "OLLAMA_KEEP_ALIVE"
                break;
            case "mm":
                n = "OLLAMA_MAX_LOADED_MODELS:"
                break;
            case "mq":
                n = "OLLAMA_MAX_QUEUE"
                break;
            case "np":
                n = "OLLAMA_NUM_PARALLEL"
                break;
            case "gpu":
                if (isCpu) {
                    throw new Error("you can not use -cpu and -gpu together")
                }
                n = "CUDA_VISIBLE_DEVICES"
                break;
            case "ctx":
                n = "OLLAMA_CONTEXT_LENGTH"
                break;
            case "p":
                n = "OLLAMA_HOST"
                _v = "0.0.0.0:" + v
                break;
            case "h":
                n = "OLLAMA_HOST"
                break;
            default:
                throw new Error(`unknown argument ${k}`)
        }
        process.env[n] = _v
    }
    await execute("ollama", ["serve"])
}

export { serve };

