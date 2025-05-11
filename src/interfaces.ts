interface GPUCard extends TotalMemoryInfo {
    index: number;
    name: string;
}

interface TotalMemoryInfo {
    totalMemoryBytes: number;
    usedMemoryBytes: number;
    usagePercentage: number;
}

interface EnvVars {
    OLLAMA_FLASH_ATTENTION: number | null;
    OLLAMA_KV_CACHE_TYPE: string | null;
    OLLAMA_KEEP_ALIVE: number | null;
    OLLAMA_MAX_LOADED_MODELS: number | null;
    OLLAMA_CONTEXT_LENGTH: number | null;
    OLLAMA_MAX_QUEUE: number | null;
    OLLAMA_NUM_PARALLEL: number | null;
    OLLAMA_HOST: string | null;
    OLLAMA_ORIGINS: string | null;
    OLLAMA_MODELS: string | null;
    CUDA_VISIBLE_DEVICES: string | null;
}

interface ModelData {
    name: string;
    size: string;
    size_vram: string;
    size_ram: string;
    ram_percentage: string;
    expire: string;
}

interface ExtendedModelData extends ModelData {
    isLoaded: boolean;
    raw_size_vram: number;
    params: string;
    quant: string;
}

interface StateOptions {
    useInstance?: string;
    useHttps?: boolean;
}

interface ServeOptions {
    flashAttention?: boolean;
    kv4?: boolean;
    kv8?: boolean;
    debug?: boolean;
    keepAlive?: string;
    ctx?: number;
    maxLoadedModels?: number;
    maxQueue?: number;
    port?: number;
    cpu: boolean;
    gpu?: Array<number>;
    host?: string;
}

interface ParsedOptions {
    flags: string[];
    [key: string]: number | string[]; // Allow both numbers and the 'flags' array
}

interface KeyPress {
    sequence: string;
    name: string;
    ctrl: boolean;
    meta: boolean;
    shift: boolean;
}

type CmdName = "env" | "load" | "unload" | "mem" | "search" | "keepAlive" | "models" | "ctx" | "default";

export {
    GPUCard,
    TotalMemoryInfo,
    EnvVars,
    ParsedOptions,
    ModelData,
    CmdName,
    KeyPress,
    ExtendedModelData,
    StateOptions,
    ServeOptions,
}