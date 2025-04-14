import color from "ansi-colors";
import { ModelResponse } from 'ollama/dist/index.js';
import { ExtendedModelData, ModelData } from './interfaces.js';
import { formatFileSize, getTimeHumanizedUntil } from './lib/utils.js';
import { ollama } from './state.js';
// @ts-ignore
import TCharts from "tcharts.js";
import { getGPUOccupationPercent, getTotalGPUMem } from "./lib/gpu.js";

async function models(args: Array<string>) {
    const res = await ollama.list();
    const ps = await ollama.ps();
    const runningModels = ps.models.map(m => m);
    let _models = res.models.sort((a, b) => a.name.localeCompare(b.name));
    const allModels: Record<string, ModelResponse> = {};
    _models.forEach((m) => {
        const rm = runningModels.find(x => x.model == m.model);
        if (rm) {
            allModels[m.model] = rm;
        } else {
            allModels[m.model] = m;
        }
    });
    if (_models.length == 0) {
        console.log("No models found");
        return
    }
    //console.log("RM", runningModels);
    const models = new Array<ExtendedModelData>();
    let hasOffload = false;
    let hasModelsLoaded = false;
    // filter
    let filters: Array<string> = [];
    //console.log("args", args);
    args?.forEach((a) => {
        if (a != "-m") {
            filters.push(a)
        }
    });
    let hasFilters = false;
    if (filters.length > 0) {
        hasFilters = true;
    }
    for (const [name, m] of Object.entries(allModels)) {
        if (hasFilters) {
            let isIncluded = true;
            for (const f of filters) {
                if (!m.model.includes(f)) {
                    isIncluded = false;
                    break;
                }
            }
            if (!isIncluded) {
                continue
            }
        }
        const modelData = {} as ExtendedModelData;
        //console.log("M", m);
        modelData.name = name;
        modelData.size = formatFileSize(m.size);
        modelData.quant = m.details.quantization_level;
        modelData.params = m.details.parameter_size;
        modelData.size_ram = "0";
        modelData.ram_percentage = "0%";
        modelData.size_vram = "";
        modelData.raw_size_vram = 0;
        modelData.expire = "";
        modelData.isLoaded = m?.size_vram ? true : false;
        if (modelData.isLoaded) {
            hasModelsLoaded = true;
            //console.log("LM", m);
            modelData.raw_size_vram = m.size_vram;
            modelData.size_vram = formatFileSize(m.size_vram);
            if (m.size > m.size_vram) {
                modelData.size_ram = formatFileSize(m.size - m.size_vram);
                modelData.ram_percentage = (((m.size - m.size_vram) / m.size) * 100).toFixed(1) + '%';
                hasOffload = true;
            }
            modelData.expire = getTimeHumanizedUntil(m.expires_at.toString());
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
        totalGpuMem = getTotalGPUMem();
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
    models,
}