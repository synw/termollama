import { checkbox } from '@inquirer/prompts';
import { memTotalStats, modelsMemChart } from './lib/stats.js';
import { getGPUMemoryInfo } from './lib/gpu.js';
import { ollama } from './state.js';

async function load(args?: Array<string>) {
    const res = await ollama.list();
    const runningModels = (await ollama.ps()).models.map(m => m.model);
    let rawData = res.models.sort((a, b) => a.size - b.size).map(m => m.model);
    const data = new Array<string>();
    rawData.forEach((row) => {
        if (!runningModels.includes(row)) {
            data.push(row)
        }
    });
    //console.log("ARGS", args);
    // filter
    let filters: Array<string> = [];
    args?.forEach((a) => {
        if (a != "-l") {
            filters.push(a)
        }
    });
    let final = new Array<string>();
    //console.log("F", filters);
    if (filters.length > 0) {
        for (const m of data) {
            let isIncluded = true;
            for (const f of filters) {
                if (!m.includes(f)) {
                    isIncluded = false;
                    break;
                }
            }
            if (isIncluded) {
                final.push(m);
            }
        }
    } else {
        final = data;
    }

    const choices: Array<{ name: string, value: string }> = [];
    final.forEach((m) => {
        choices.push({
            name: m,
            value: m,
        })
    });
    const answer = await checkbox({
        message: 'Load models?',
        choices: choices,
        pageSize: 10,
        loop: false,
    });
    if (answer.length > 0) {
        for (const m of answer) {
            await ollama.generate({ prompt: "", model: m });
            console.log("Loaded", m)
        }
        //console.log(`Loaded ${answer.length} model${answer.length > 1 ? 's' : ''}`)
        modelsMemChart(await ollama.ps());
        memTotalStats(await getGPUMemoryInfo())
    } else {
        console.log("No model loaded")
    }
}

export { load }