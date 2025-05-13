import { ExtendedModelData } from './interfaces.js';
import { getGPUMemoryInfo, getGPUOccupationPercent, getTotalGPUMem } from './lib/gpu.js';
import { memTotalStats } from './lib/stats.js';
import { formatFileSize, getTimeHumanizedUntil } from './lib/utils.js';
import { ListResponse } from 'ollama';
// @ts-ignore
import TCharts from "tcharts.js";
import { ollama } from './state.js';


async function ps(showGpuInfo = true): Promise<boolean> {
    const ps = await ollamaPs();
    let data = ps.models;
    //console.log(data);
    if (data.length == 0) {
        return false
    }
    const totalGpuMem = await getTotalGPUMem();
    const hasGpu = totalGpuMem > 0;
    const choices: Array<{ name: string, value: string }> = [];
    const models = new Array<ExtendedModelData>();
    let hasOffload = false;
    data.forEach((m) => {
        //console.log("M", m);
        const modelData = {} as ExtendedModelData;
        modelData.name = m.name;
        modelData.size = formatFileSize(m.size);
        modelData.quant = m.details.quantization_level;
        modelData.params = m.details.parameter_size;
        modelData.size_ram = hasGpu ? "0" : formatFileSize(m.size);
        modelData.ram_percentage = hasGpu ? "0%" : "100%";
        modelData.size_vram = "0";
        modelData.raw_size_ram = hasGpu ? 0 : m.size;
        modelData.expire = "";
        modelData.raw_size_vram = m?.size_vram ?? 0;
        modelData.size_vram = m?.size_vram ? formatFileSize(m.size_vram) : "";
        if (hasGpu) {
            if (m.size > m.size_vram) {
                modelData.size_ram = formatFileSize(m.size - m.size_vram);
                modelData.ram_percentage = (((m.size - m.size_vram) / m.size) * 100).toFixed(1) + '%';
                hasOffload = true;
            }
        }
        modelData.expire = getTimeHumanizedUntil(m.expires_at.toString());
        models.push(modelData);
        choices.push({
            name: m.name,
            value: m.model,
        })
    });
    if (data.length == 0) {
        console.log("No models are loaded in memory");
        return false
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
    //console.log();
    // gpu total mem
    if (hasGpu && showGpuInfo) {
        memTotalStats(await getGPUMemoryInfo());
    }
    return hasOffload
}

async function ollamaPs(): Promise<ListResponse> {
    let ps: ListResponse;
    try {
        ps = await ollama.ps();
    } catch (e: any) {
        if (e.toString().includes("fetch failed")) {
            console.warn("No instance of Ollama is running");
            process.exit(0)
        }
        throw new Error(`${e}`)
    }
    return ps
}

async function ollamaPsOrQuit(): Promise<ListResponse> {
    const ps = await ollamaPs();
    if (ps.models.length == 0) {
        console.log("No models are loaded in memory")
        process.exit(0)
    }
    return ps
}

export {
    ollamaPs,
    ollamaPsOrQuit, ps
};

