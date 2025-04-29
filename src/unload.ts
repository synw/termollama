import { checkbox } from '@inquirer/prompts';
import { memTotalStats, modelsMemChart } from './lib/stats.js';
import { getGPUMemoryInfo } from './lib/gpu.js';
import { execute } from "./lib/execute.js";
import { ollama } from './state.js';

async function unload() {
    const runningModels = (await ollama.ps()).models.map(m => m.model);
    const choices: Array<{ name: string, value: string }> = [];
    runningModels.forEach((m) => {
        choices.push({
            name: m,
            value: m,
        })
    });
    const answer = await checkbox({
        message: 'Unload models?',
        choices: choices,
    });
    if (answer.length > 0) {
        for (const m of answer) {
            console.log("Unloading", m);
            await execute("ollama", ["stop", m], { onStdout: (t) => null });
        }
        //console.log(`Unloaded ${answer.length} model${answer.length > 1 ? 's' : ''}`);
        await new Promise(resolve => setTimeout(resolve, 350));
        modelsMemChart(await ollama.ps());
        memTotalStats(await getGPUMemoryInfo())
    } else {
        console.log("No models unloaded")
    }
}

export { unload }