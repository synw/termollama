// @ts-ignore
import TCharts from "tcharts.js";
import { getGPUOccupationPercent, getTotalGPUMem } from "./lib/gpu.js";
import { getModelsData } from './lib/models.js';

async function models(filters: Array<string>) {
    const { models, hasOffload, hasModelsLoaded } = await getModelsData(filters);
    //console.log(models);
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
    const { Table } = TCharts;
    const table = new Table(0.1);
    table.setData(tdata);
    console.log(table.string());
}

export {
    models
};
