import { ModelResponse } from 'ollama';
import { ExtendedModelData } from '../interfaces.js';
import { getGPUOccupationPercent, getTotalGPUMem } from "./gpu.js";
import { formatFileSize, getTimeHumanizedUntil } from './utils.js';
// @ts-ignore
import TCharts from "tcharts.js";
import { ollama } from '../state.js';


async function ps(display = false): Promise<{
    hasOffload:
    boolean, isRunning: boolean,
    hasLoadedModels: boolean,
    models: Array<ExtendedModelData>,
}> {
    const _ps = await ollamaPs();
    if (!_ps.isRunning) {
        return { isRunning: false, hasOffload: false, hasLoadedModels: false, models: [] }
    }
    let data = _ps.models;
    if (data.length == 0) {
        return { isRunning: true, hasOffload: false, hasLoadedModels: false, models: [] }
    }
    const totalGpuMem = await getTotalGPUMem();
    const hasGpu = totalGpuMem > 0;
    const choices: Array<{ name: string, value: string }> = [];
    const models = new Array<ExtendedModelData>();
    let hasOffload = false;
    //console.log("PS DATA", data);
    data.forEach((m) => {
        //throw new Error(JSON.stringify(m, null, "  "))
        const raw_size_ram = m.size - m.size_vram;
        const modelData = {} as ExtendedModelData;
        modelData.name = m.name;
        modelData.size = formatFileSize(m.size);
        modelData.quant = m.details.quantization_level;
        modelData.params = m.details.parameter_size;
        modelData.size_ram = raw_size_ram == 0 ? "0" : formatFileSize(m.size);
        modelData.ram_percentage = "0";
        modelData.size_vram = m.size_vram == 0 ? "0" : formatFileSize(m.size_vram);
        modelData.raw_size_ram = raw_size_ram;
        modelData.raw_size_vram = m.size_vram;
        modelData.size_vram = m.size_vram == 0 ? "0" : formatFileSize(m.size_vram);
        modelData.expire = "";
        if (m.size > m.size_vram) {
            modelData.size_ram = formatFileSize(raw_size_ram);
            modelData.ram_percentage = (((raw_size_ram) / m.size) * 100).toFixed(1) + '%';
            hasOffload = true;
        }
        modelData.expire = getTimeHumanizedUntil(m.expires_at.toString());
        models.push(modelData);
        choices.push({
            name: m.name,
            value: m.model,
        })
    });
    if (!display) {
        return { isRunning: true, hasLoadedModels: true, hasOffload: hasOffload, models: models }
    }
    // models
    const { Table } = TCharts;
    const table = new Table(0.2);
    const dt = new Array<string>("Model", "Size");
    dt.push("Unload in");
    if (hasGpu) {
        dt.push("Gpu usage");
    }
    if (hasOffload || !hasGpu) {
        dt.push("Ram")
    }
    if (hasGpu) {
        models.sort((a, b) => b.raw_size_vram - a.raw_size_vram);
    } else {
        models.sort((a, b) => b.raw_size_ram - a.raw_size_ram);
    };
    const tdata = new Array<Array<string>>(dt);
    for (const m of models) {
        let name = m.name;
        let gpuOccupation = "";
        name = m.name;
        gpuOccupation = `${getGPUOccupationPercent(totalGpuMem, m.raw_size_vram)}%`;
        const size = m.isLoaded ? m.size_vram : m.size;
        const mdata = [name, size, m.expire];
        if (hasOffload || !hasGpu) {
            mdata.push(m.ram_percentage)
        }
        if (hasGpu) {
            mdata.push(gpuOccupation);
        }
        tdata.push(mdata);
    }
    table.setData(tdata);
    console.log(table.string());
    return { isRunning: true, hasLoadedModels: true, hasOffload: hasOffload, models: models }
}

async function ollamaPs(): Promise<{ isRunning: boolean, models: Array<ModelResponse> }> {
    try {
        const models = await ollama.ps();
        return { isRunning: true, models: models.models };
    } catch (e: any) {
        if (!e.toString().includes("fetch failed")) {
            //console.warn("No instance of Ollama is running");
            //process.exit(0)
            throw new Error(`${e}`)
        }
    }
    return { isRunning: false, models: [] }
}

async function ollamaPsOrQuit(): Promise<Array<ModelResponse>> {
    const { isRunning, models } = await ollamaPs();
    if (!isRunning) {
        console.warn("No instance of Ollama is running");
        process.exit(0)
    }
    if (models.length == 0) {
        console.log("No models are loaded in memory")
        process.exit(0)
    }
    return models
}

export {
    ollamaPs,
    ollamaPsOrQuit, ps
};

