import { ListResponse, ModelResponse } from "ollama";
// @ts-ignore
import TsCharts from "tcharts.js";
import { formatFileSize, getTimeHumanizedUntil } from "./utils.js";
import { ExtendedModelData } from "../interfaces.js";
import { ollama } from "../state.js";
import { ollamaPs } from "./ps.js";

async function getModelsData(filters: Array<string>): Promise<{
    hasOffload: boolean,
    hasModelsLoaded: boolean,
    models: ExtendedModelData[]
}> {
    let res: ListResponse;
    try {
        res = await ollama.list();
    } catch (e: any) {
        if (e.toString().includes("fetch failed")) {
            console.warn("No instance of Ollama is running");
            process.exit(0)
        }
        throw new Error(`${e}`)
    }
    const runningModels: Record<string, ModelResponse> = {};
    const runningModelsList = (await ollamaPs()).models;
    const runningModelsNames = new Array<string>();
    runningModelsList.forEach((m) => {
        runningModelsNames.push(m.name);
        runningModels[m.name] = m
    });
    const allModels: Record<string, ModelResponse> = {};
    // sort models list
    let _models = res.models.sort((a, b) => a.name.localeCompare(b.name));
    // dispatch models
    _models.forEach((m) => allModels[m.model] = m);
    if (_models.length == 0) {
        //console.log("No models found");
        return { models: [], hasOffload: false, hasModelsLoaded: false };
    }
    //console.log("RM", runningModels);
    const models = new Array<ExtendedModelData>();
    let hasOffload = false;
    let hasModelsLoaded = false;
    const hasFilters = filters.length > 0;
    for (const [name, m] of Object.entries(allModels)) {
        if (hasFilters) {
            let isIncluded = false;
            for (const f of filters) {
                if (m.model.includes(f)) {
                    isIncluded = true;
                    break;
                }
            }
            if (!isIncluded) {
                continue
            }
        }
        const modelData = {} as ExtendedModelData;
        const isRunning = runningModelsNames.includes(name);
        modelData.name = name;
        modelData.size = formatFileSize(m.size);
        modelData.quant = m.details.quantization_level;
        modelData.params = m.details.parameter_size;
        modelData.size_ram = "0";
        modelData.ram_percentage = "0%";
        modelData.size_vram = "";
        modelData.raw_size_vram = 0;
        modelData.expire = "";
        modelData.isLoaded = isRunning;
        if (modelData.isLoaded) {
            hasModelsLoaded = true;
            //console.log("LM", m);
            const rm = runningModels[modelData.name];
            modelData.raw_size_vram = rm.size_vram;
            modelData.size_vram = formatFileSize(rm.size_vram);
            if (rm.size > rm.size_vram) {
                modelData.size_ram = formatFileSize(rm.size - rm.size_vram);
                modelData.ram_percentage = (((rm.size - rm.size_vram) / rm.size) * 100).toFixed(1) + '%';
                hasOffload = true;
            }
            modelData.expire = getTimeHumanizedUntil(rm.expires_at.toString());
        }
        models.push(modelData);
    }
    return { models: models, hasOffload: hasOffload, hasModelsLoaded: hasModelsLoaded }
}

function modelsMemChart(modelsData: Array<ModelResponse>) {
    if (modelsData.length == 0) {
        return
    }
    const { Box } = TsCharts;
    const box = new Box(110, 10);
    const data = new Array<{ name: string, value: number }>();
    modelsData.forEach((m) => {
        const size = m?.size_vram ? m.size_vram : m.size;
        //console.log("M", m, size);
        data.push({ name: `${m.name}(${formatFileSize(size)}) `, value: size })
    });
    box.setData(data);
    console.log(box.string());
}

export {
    getModelsData,
    modelsMemChart,
};

