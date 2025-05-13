import { checkbox } from '@inquirer/prompts';
import { ListResponse } from 'ollama';
import ora from 'ora';
import { execute } from "./lib/execute.js";
import { getGPUMemoryInfo } from './lib/gpu.js';
import { memTotalStats, modelsMemChart } from './lib/stats.js';
import { ollamaPs } from './ps.js';

async function unload(rml: ListResponse) {
    const runningModels = rml.models.map(m => m.model);
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
            const spinner = ora('Unloading ' + m).start();
            await execute("ollama", ["stop", m], { onStdout: (t) => null });
            spinner.stopAndPersist({ text: m, symbol: "-" });
        }
        //console.log(`Unloaded ${answer.length} model${answer.length > 1 ? 's' : ''}`);
        await new Promise(resolve => setTimeout(resolve, 350));
        modelsMemChart(await ollamaPs());
        const { hasGPU, info } = await getGPUMemoryInfo();
        if (hasGPU) {
            memTotalStats(info)
        }
    } else {
        console.log("No models unloaded")
    }
}

export { unload };
