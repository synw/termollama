import { Ollama } from 'ollama';

let ollama: Ollama;
let gpus = new Array<number>();

function initState(port: number = 11434) {
    ollama = new Ollama({ host: `http://localhost:${port}` })
}

export {
    initState,
    ollama,
    gpus,
}