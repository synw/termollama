import { ListResponse, ModelResponse } from 'ollama/dist/index.js';
import { ExtendedModelData } from './interfaces.js';
import { formatFileSize, getTimeHumanizedUntil } from './lib/utils.js';
import { ollama } from './state.js';
// @ts-ignore
import TCharts from "tcharts.js";
import { getGPUOccupationPercent, getTotalGPUMem } from "./lib/gpu.js";
import { ollamaPs } from "./ps.js";

async function models(filters: Array<string>) {
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
        console.log("No models found");
        return
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
        } else {
            //console.log("M", m)
        }
        models.push(modelData);
    }
    //console.log(models);
    const { Table } = TCharts;
    const table = new Table(0.1);
    const dt = new Array<string>("Model", "Params", "Quant", "Size");
    let totalGpuMem = 0;
    if (hasOffload) {
        dt.push("Ram")
    }
    if (hasModelsLoaded) {
        dt.push("Unload in");
        dt.push("Gpu usage");
        totalGpuMem = await getTotalGPUMem();
    }
    const tdata = new Array<Array<string>>(dt);
    for (const m of models) {
        let name = m.name;
        let gpuOccupation = "";
        if (m.isLoaded) {
            name = "🟢 " + m.name;
            gpuOccupation = `${getGPUOccupationPercent(totalGpuMem, m.raw_size_vram)}%`;
        }
        const size = m.isLoaded ? m.size_vram : m.size;
        const mdata = [name, m.params, m.quant, size];
        if (hasOffload) {
            mdata.push(m.ram_percentage)
        }
        if (hasModelsLoaded) {
            mdata.push(m.expire);
            mdata.push(gpuOccupation);
        }
        tdata.push(mdata);
    }
    table.setData(tdata);
    console.log(table.string());
}

export {
    models
};
