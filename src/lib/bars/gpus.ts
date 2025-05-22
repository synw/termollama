import os from "os";
import { MultiBar, Options, SingleBar } from "cli-progress";
import color from "ansi-colors";
import { CardBarInfo, ExtendedModelData, GPUCardInfo, GPUInfo, TotalMemoryInfo } from "../../interfaces.js";
import { formatFileSize } from "../utils.js";
import { getGPUMemoryInfo } from "../gpu.js";
import { formatModelData, modelBarOptions } from "./models.js";
import { ps } from "../ps.js";
import { padCardInfo, tagFormat, totalBarTagFormat } from "./format.js";
import { updateGpuBarsInfo } from "./update.js";

function gpuDetailsStats(
    info: GPUInfo,
    models: Array<ExtendedModelData>,
    realTime: boolean,
    maxModelBars?: number,
) {
    //console.log("GDS ***************")
    // handle failed gpu fetch cases
    //if (info.cards.length == 0) { return }
    const { success, cardsData, totalData } = updateGpuBarsInfo(info);
    if (!success) {
        if (realTime) {
            return
        } else {
            throw new Error(`updateGpuBarsInfo ${cardsData} / ${totalData}`)
        }
    }
    const barOptions: Options = {
        autopadding: true,
        barCompleteChar: '=',
        barIncompleteChar: '=',
        clearOnComplete: realTime,
        hideCursor: true,
        format: tagFormat,
        gracefulExit: true,
        barGlue: '\u001b[38;5;238m',
    };
    const multibar = new MultiBar(barOptions);
    const nCards = info.cards.length;
    //console.log("INFO", info);
    const bars = new Array<SingleBar>();
    let totalBar: SingleBar;
    //console.log("CARDS BARS", cardsData.length);
    if (nCards > 1) {
        for (const bd of cardsData) {
            //console.log(card.index)
            const data = padCardInfo(bd);
            bars.push(multibar.create(data.totalMemory, data.usedMemory, data));
        }
    }
    if (realTime) {
        // total
        const tdata = padCardInfo(totalData);
        totalBar = multibar.create(
            totalData.totalMemory, totalData.usedMemory, tdata, {
            format: nCards > 1 ? totalBarTagFormat : tagFormat
        });
    }
    // models
    const modelBars = new Array<SingleBar>();
    const modelBarSlots = new Array<SingleBar>();
    models.forEach(m => {
        /*console.log(info.totalMemory.totalMemoryBytes, m.raw_size_vram)
        console.log(info.totalMemory.totalMemoryBytes - m.raw_size_vram)
        console.log("M", m);*/
        const md = formatModelData(m);
        const bars = realTime ? modelBarSlots : modelBars;
        bars.push(multibar.create(info.totalMemory.totalMemoryBytes, m.raw_size_vram,
            { output: md },
            modelBarOptions
        ))
    });
    if (!realTime) {
        const tdata = padCardInfo(totalData);
        totalBar = multibar.create(
            totalData.totalMemory, totalData.usedMemory, tdata, {
            format: nCards > 1 ? totalBarTagFormat : tagFormat
        }
        );
        bars.push(totalBar);
        multibar.stop();
        return
    }
    // model slots
    let maxModelsLoaded: number;
    if (maxModelBars) {
        maxModelsLoaded = maxModelBars
    } else {
        if (process.env["OLLAMA_MAX_LOADED_MODELS"]) {
            maxModelsLoaded = parseInt(process.env["OLLAMA_MAX_LOADED_MODELS"])
        } else {
            //sif (options?.w)
            maxModelsLoaded = info.cards.length * 3;
        }
    }
    let mi = 0;
    while (mi < (maxModelsLoaded - models.length)) {
        modelBarSlots.push(multibar.create(info.totalMemory.totalMemoryBytes, 0,
            { output: "" },
            modelBarOptions
        ))
        mi++
    }
    //console.log("MBL", modelBarSlots.length)
    // real time
    let b = 0;
    let checkModelsInterval = 0;
    setInterval(() => {
        let _cardsData: Array<CardBarInfo>;
        let _totalData: CardBarInfo;
        try {
            const res = updateGpuBarsInfo();
            if (!res.success) {
                return
            }
            _cardsData = res.cardsData;
            _totalData = res.totalData
        } catch (e) {
            multibar.stop()
            throw new Error(`bar info err: ${e}`)
        }
        let i = 0;
        bars.forEach(b => {
            //console.log("BL", i, barData.length);
            const data = padCardInfo(_cardsData[i]);
            b.update(_cardsData[i].usedMemory, data);
            ++i
        });
        totalBar.update(_totalData.usedMemory, _totalData)
        if (checkModelsInterval == 5) {
            try {
                ps().then(({ models }) => {
                    let nbars = 0;
                    models.forEach(m => {
                        const md = formatModelData(m);
                        modelBarSlots[nbars].update(m.raw_size_vram, { output: md });
                        ++nbars;
                    });
                    while (nbars < maxModelsLoaded) {
                        try {
                            modelBarSlots[nbars].update(0, { output: "" });
                        } catch (e) {
                            multibar.stop();
                            console.log("MM", maxModelsLoaded, nbars);
                            console.log("M", models.length);
                            console.log("S", modelBarSlots.length);
                            throw new Error(`\n\n\nUpdate models bar slot ${nbars}: ${e}`);
                        }
                        ++nbars;
                    }
                });
            } catch (e) {
                multibar.stop();
                throw new Error(`\n\n\nUpdate models bars error: ${e}`);
            }
            checkModelsInterval = 0;
        }
        checkModelsInterval++
        ++b
    }, 1000)
}

function gpuTotalStatsBar(info: {
    cards: GPUCardInfo[];
    totalMemory: TotalMemoryInfo;
}): SingleBar {
    const bar = new SingleBar({
        format: totalBarTagFormat,
        barCompleteChar: "=",
        barIncompleteChar: '.',
        autopadding: true,
        hideCursor: true
    });
    return bar
}

function gpuTotalStats(info: {
    cards: GPUCardInfo[];
    totalMemory: TotalMemoryInfo;
}) {
    let totalPowerDraw = 0;
    let totalPowerLimit = 0;
    for (const card of info.cards) {
        totalPowerDraw += card.powerDraw;
        totalPowerLimit += card.powerLimit;
    }
    const bar = gpuTotalStatsBar(info);
    const barData = updateGpuBarsInfo();
    bar.start(info.totalMemory.totalMemoryBytes, info.totalMemory.usedMemoryBytes, barData.totalData);
    bar.stop()
}

function ramStats(hasGpu: boolean) {
    const yellow = hasGpu ? color.yellow : color.yellowBright;
    const green = hasGpu ? color.green : color.greenBright;
    const bar = new SingleBar({
        format: `RAM [{bar}] ${color.bold("{percentage}%")} | ${yellow("{used}")} used / ${green("{free}")} free`,
        barCompleteChar: "=",
        barIncompleteChar: '.',
        hideCursor: true
    });
    const totalRam = os.totalmem();
    const freeRam = os.freemem();
    const usedRam = totalRam - freeRam;
    bar.start(totalRam, usedRam, {
        free: formatFileSize(totalRam - usedRam),
        used: formatFileSize(usedRam),
    });
    bar.stop()
}

export {
    gpuTotalStats,
    gpuDetailsStats,
    ramStats,
    getGPUMemoryInfo,
};
