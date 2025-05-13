import { runtimeParamError } from "../user_msgs.js";
import { ModelInfo, OllamaRegistry } from "../interfaces.js";
import { displayModel, displayRegistries, displayTemplate } from "./display.js";
import { detectConfPath, detectRegistries, readModelInfo, readRegistries } from "./utils.js";
import { exfiltrate } from "./exfiltrate.js";


let registriesData: Record<string, OllamaRegistry> = {};
let ollamaModelsDir = "";

function _searchModel(query: Array<string>): { found: boolean, info: ModelInfo } {
    if (query.length == 1) {
        const ms = query[0].split(":");
        if (ms.length < 2) {
            runtimeParamError("Use this one of these formats to search for a model: \n olm -m qwen3:0.6b\n olm -m qwen3 0.6b")
        }
        const f = ms[0].split("/").pop()!;
        query = new Array<string>(f, ms[1]);
    }
    return readModelInfo(ollamaModelsDir, Object.values(registriesData), query);
}

async function gguf(options: Record<string, any>) {
    ollamaModelsDir = options?.registry ? options.registry : detectConfPath();
    const registriesPaths = detectRegistries(ollamaModelsDir);
    //console.log("REG", registriesPaths);
    registriesData = readRegistries(registriesPaths);
    //console.dir(registriesData, { depth: 5 });
    if (options.model) {
        const { found, info } = _searchModel(options.model)
        if (!found) {
            console.warn("Model not found for", options.model);
            return
        }
        displayModel(info);
        return
    } else if (options.template) {
        const { found, info } = _searchModel(options.template)
        if (!found) {
            console.warn("Model not found for", options.template);
            return
        }
        displayTemplate(info);
        return
    } else if (options.exfiltrate || options.copy) {
        const isCopy = "copy" in options;
        const opt = options?.exfiltrate ? options.exfiltrate : options.copy;
        const xf = opt as Array<string>;
        if (xf.length < 2) {
            runtimeParamError("Provide a model name and a destination path: ex: olm -x qwen3:32b /path/to/destination");
            return
        }
        const destination = xf.pop()!;
        const { found, info } = _searchModel(xf)
        if (!found) {
            console.warn("Model not found for", options.template);
            return
        }
        exfiltrate(info, destination, isCopy);
        return
    }
    // default command
    console.log("Reading registries from", ollamaModelsDir);
    displayRegistries(Object.values(registriesData));
}

export {
    gguf,
}