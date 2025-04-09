import { memTotalStats } from './lib/stats.js';
import { getGPUMemoryInfo } from './lib/gpu.js';
import { formatFileSize, getTimeHumanizedUntil } from './lib/utils.js';
import { ModelData } from './interfaces.js';
// @ts-ignore
import TCharts from "tcharts.js";
import { ollama } from './state.js';

async function ps(showGpuInfo = true) {
    //console.log(JSON.stringify(await ollama.ps(), null, "  "));
    //const res = await execute("ollama", ["ps"]);
    //console.log(res);
    const ps = await ollama.ps();
    let data = ps.models;
    //console.log(data);
    if (data.length == 0) {
        return
    }
    const choices: Array<{ name: string, value: string }> = [];
    const models = new Array<ModelData>();
    let hasOffload = false;
    data.forEach((m) => {
        const modelData: ModelData = {} as ModelData;
        modelData.name = m.model;
        modelData.size = formatFileSize(m.size);
        modelData.size_vram = formatFileSize(m.size_vram);
        modelData.size_ram = "0";
        modelData.ram_percentage = "0%";
        if (m.size > m.size_vram) {
            modelData.size_ram = formatFileSize(m.size - m.size_vram);
            modelData.ram_percentage = (((m.size - m.size_vram) / m.size) * 100).toFixed(1) + '%';
            hasOffload = true;
        }
        modelData.expire = getTimeHumanizedUntil(m.expires_at.toString());
        models.push(modelData);
        choices.push({
            name: m.name,
            value: m.model,
        })
    });
    if (data.length == 0) {
        console.log("No models are loaded in vram");
        return
    }
    // models
    const { Table } = TCharts;
    const table = new Table(0.2);
    const dt = new Array<string>("Name", "Size", "Unload in");
    if (hasOffload) {
        dt.push("Ram")
    }
    const tdata = new Array<Array<string>>(dt);
    for (const m of models) {
        const mdata = [m.name, m.size, m.expire];
        if (hasOffload) {
            mdata.push(m.ram_percentage)
        }
        tdata.push(mdata);
    }
    table.setData(tdata);
    console.log(table.string());
    //console.log();
    // gpu total mem
    if (showGpuInfo) {
        memTotalStats(getGPUMemoryInfo());
    }
}

export { ps }

