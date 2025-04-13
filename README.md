# Termollama

A Linux command line utility for Ollama. Features:

- Quick gpu vram usage stats
- Memory management: load and unload models
- A serve command with options

## Install

Requirements: the `nvidia-smi` command should be available on the system.

```bash
npm i -g termollama
```

The `olm` command is now available.

## Memory occupation stats

Run the `olm` command without any argument to display memory stats. Output:

![](doc/img/stats.png)

Note the action bar at the bottom with quick actions shortcuts: it will stay
on the screen for 5 seconds and disapear. Press `m` to show a memory occupation
chart (or use the `olm -mem` command).

## Models

To list all the available models: `olm -m`.

To search for a model: `olm -m qwen coder`

### Load models

Use the `-l` flag to list all the models and select some to load. Output:

![](doc/img/load.png)

To find models by name and load them use the command with your search arguments. Ouptut of
`olm qw`:

![](doc/img/search.png)

### Unload models

Use the `olm -u` command to unload models. Pick the models to unload from the list.

### Keep alive

To modify the keep alive parameters per model use `olm -k`. Pick a model in the list
and change the keep alive value.

## Serve command

An `olm -x` command is available, equivalent to `ollama serve` but with options.

### Usage

Note: an `olm -env` command is available to display the environnement variables
used by Ollama

Options of `olm -x`:

- **Flash attention**: use the `-fa` flag to enable
- **Kv cache**: possible flags: `-kv4`, `-kv8`, `-kv16` (default)
- **Cpu**: use the `-cpu` flag to run only on cpu
- **Gpu**: provide a list of gpu ids to use: `-gpu 0,1`
- **Keep alive**: to set the default keep alive time: `-ka 1h`
- **Context length**: to set the default context length: `-ctx 8192`
- **Max loaded models**: max number of models in memory: `-mm 4`
- **Max queue**: set the max queue value: `-mq 50`
- **Num parallel**: number of parallel requests: `-np 2`
- **Port**: set the port: `-p 11485` (the host will be set to 0.0.0.0)
- **Host**: set the full host: `-h my.remote.server:11484`

### Examples

```bash
olm -x -h localhost:11385 -ctx 8192 -gpu 1
```

This will run on localhost:11385 with a default context window of 8192 and using only the gpu 1


```bash
olm -x -fa -kv8 -ka 1h
```

This will use flash attention, fp8 kv cache and a default keep alive value of an hour