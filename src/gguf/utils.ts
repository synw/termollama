import os from 'node:os';
import path from 'node:path';
import * as fs from 'fs';
import { ModelInfo, OllamaRegistry } from '../interfaces.js';
import { runtimeDataError } from '../lib/user_msgs.js';

function findModel(
    registriesData: Array<OllamaRegistry>, query: Array<string>
): { found: boolean, model: { familly: string, name: string, path: string, registry: string } } {
    const modelFamilly = query[0];
    const quant = query[1];
    //console.log("Finding model", modelFamilly, quant);
    let model: { familly: string, name: string, path: string, registry: string };
    for (const r of registriesData) {
        for (const mf of r.modelFamilies) {
            //console.log(mf.name, "/", modelFamilly, r);
            if (mf.name == modelFamilly) {
                //console.log("Found model familly", modelFamilly + ",", "looking for quant", quant);
                for (const q of mf.models) {
                    if (q.name == quant) {
                        //console.log("Found quant", quant);
                        model = { familly: modelFamilly, name: quant, path: path.join(mf.path, quant), registry: r.name };
                        return { found: true, model: model }
                    }
                }
            }
        }
    }
    return { found: false, model: { name: "", path: "", familly: "", registry: "" } }
}

function readModelConfig(confPath: string): Record<string, any> {
    let cf: string;
    try {
        cf = fs.readFileSync(confPath, 'utf-8');
    } catch (e) {
        throw new Error(`can not read model config file ${confPath}, ${e}`)
    }
    return JSON.parse(cf)
}

function readTextFile(filePath: string): string {
    let cf: string;
    try {
        cf = fs.readFileSync(filePath, 'utf-8');
    } catch (e) {
        throw new Error(`can not read conf file ${filePath}`)
    }
    return cf
}

function readModelInfo(
    modelsDirPath: string, registriesData: Array<OllamaRegistry>, query: Array<string>
): { found: boolean, info: ModelInfo } {
    const { found, model } = findModel(registriesData, query);
    //console.log("F", found, model, query);
    if (!found) {
        return { found: false, info: {} as ModelInfo }
    }
    let data: Record<string, any>;
    let fconf: string;
    try {
        fconf = fs.readFileSync(model.path, 'utf8');
    } catch (e) {
        runtimeDataError("model", query.join(" "), "not found at", model.path);
        return { found: false, info: {} as ModelInfo }
    }
    try {
        //console.log("MP", model.path);
        data = JSON.parse(fconf);
    } catch (e) {
        throw new Error(`parsing error ${model.path} ${e}`);
    }
    //console.log("MDATA", data);
    const blobs = path.join(modelsDirPath, "blobs");
    const confFileName = data.config.digest.replace("sha256:", "sha256-");
    const confFilePath = path.join(blobs, confFileName);
    //console.log("CFP", confFilePath);
    const mconf = readModelConfig(confFilePath);
    let templateFileName = "";
    let paramsFileName = "";
    let modelFileName = "";
    let modelSize = 0;
    data.layers.forEach((l: Record<string, any>) => {
        switch (l.mediaType) {
            case "application/vnd.ollama.image.model":
                modelFileName = l.digest.replace("sha256:", "sha256-");
                modelSize = l.size;
                break;
            case "application/vnd.ollama.image.template":
                templateFileName = l.digest.replace("sha256:", "sha256-");
                break
            case "application/vnd.ollama.image.params":
                paramsFileName = l.digest.replace("sha256:", "sha256-");
                break
        }
    });
    //console.log("T", path.join(blobs, templateFileName));
    //console.log("P", path.join(blobs, paramsFileName))
    const template = readTextFile(path.join(blobs, templateFileName));
    let params: string | null = null;
    if (paramsFileName) {
        params = readTextFile(path.join(blobs, paramsFileName));
    }
    const blob = path.join(blobs, modelFileName);
    const quant = mconf.file_type;
    const q = model.registry == "registry.ollama.ai" ? "_" + quant : "";
    const ggufName = model.familly + "_" + model.name + q + ".gguf";
    const modelInfo: ModelInfo = {
        registry: model.registry,
        familly: model.familly,
        confName: model.name,
        name: model.familly + ":" + model.name,
        ggufName: ggufName,
        confPath: model.path,
        blobPath: blob,
        template: template,
        params: params,
        size: modelSize,
        quant: quant,
    }
    return { found: true, info: modelInfo }
}

function _countModelsInRegistry(registryData: OllamaRegistry): number {
    let stats = 0;
    registryData.modelFamilies.forEach(mf => {
        stats += mf.models.length;
    });
    return stats
}

function _readRegistries(registriesPaths: Record<string, string>): Record<string, OllamaRegistry> {
    const data: Record<string, OllamaRegistry> = {};
    for (const [rname, rpath] of Object.entries(registriesPaths)) {
        data[rname] = {
            name: rname,
            path: rpath,
            modelFamilies: []
        }
        //console.log("Reading", rpath);
        fs.readdirSync(rpath).forEach((mf) => {
            let models = new Array<{ name: string, path: string }>();
            //console.log("Reading models", path.join(rpath, mf));
            fs.readdirSync(path.join(rpath, mf)).forEach((ms) => {
                models.push({
                    name: ms,
                    path: path.join(rpath, mf, ms)
                })
            });
            data[rname].modelFamilies.push({
                name: mf,
                path: path.join(rpath, mf),
                models: models
            });
        })
    }
    return data
}

function detectRegistries(ollamaModelsDir: string): Record<string, string> {
    const registries: Record<string, string> = {};
    const dirPath = path.join(ollamaModelsDir, "manifests");
    try {
        let dc = fs.readdirSync(dirPath);
        dc.forEach((fd) => {
            // check for a library folder
            const libraryPath = path.join(dirPath, fd, "library");
            if (fs.existsSync(libraryPath)) {
                registries[fd] = path.join(dirPath, fd, "library");
            } else {
                const sregPath = path.join(dirPath, fd);
                const sregs = fs.readdirSync(sregPath);
                sregs.forEach(r => {
                    registries[fd + "/" + r] = path.join(dirPath, fd, r);
                })
            }
        });
        return registries
    } catch (err) {
        throw new Error(`Error reading directory: ${dirPath}: ${err}`);
    }
}

function detectConfPath(): string {
    let ollamaModelsDir = "";
    //console.log("Models dir env:", process.env["OLLAMA_MODELS"]);
    if (process.env["OLLAMA_MODELS"]) {
        return path.join(process.env["OLLAMA_MODELS"])
    }
    switch (os.platform()) {
        case "linux":
            const dir = path.join(process.env?.HOME ?? "~", ".ollama", "models");
            // check if dir exists
            if (fs.existsSync(dir)) {
                return dir
            }
            const dir2 = path.join("user", "share", "ollama", "models");
            // check if dir exists
            if (fs.existsSync(dir2)) {
                return dir2
            }
            break
        case "darwin":
            const dir3 = path.join(process.env?.HOME ?? "~", "Library", "Application Support", "Ollama", "models");
            // check if dir exists
            if (fs.existsSync(dir3)) {
                return dir3
            }
            const dir4 = path.join(process.env?.HOME ?? "~", ".ollama", "models");
            // check if dir exists
            if (fs.existsSync(dir4)) {
                return dir4
            }
            break
        case "win32":
            try {
                ollamaModelsDir = path.join(process.env?.LOCALAPPDATA!, "Ollama", "models")
            } catch (e) {
                throw new Error("Unable to find Ollama models storage path")
            }
        default:
            throw new Error("Unsupported OS")
    }
    return ollamaModelsDir
}

function readRegistries(registriesPaths: Record<string, string>) {
    const registryData = _readRegistries(registriesPaths);
    return registryData
}

function registriesStats(registriesData: Array<OllamaRegistry>): Record<string, number> {
    const rs: Record<string, number> = {};
    registriesData.forEach((r) => rs[r.name] = _countModelsInRegistry(r));
    return rs
}

export {
    detectConfPath,
    detectRegistries,
    readRegistries,
    registriesStats,
    readModelInfo,
}


