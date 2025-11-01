## Setup

### llama.cpp

```
brew install llama.cpp
llama-server -hf tsej/Llama-PLLuM-8B-instruct-GGUF:Q4_0
```

### Note enforcer


```
uv sync
uv tool install .
```

### Usage:

**As a standalone script**

```
note-structure-enforce --script <PATH_TO_ENFORCER_SCRIPT> --input <INPUT_FILE> --output <OUTPUT_FILE>
```

e.g.

```
note-structure-enforce --script examples/recipe_enforcer.py --input examples/notes_unprocessed/przepis.md --output examples/notes_processed/przepis.md
```


**With obsidian plugin**

See [note-structurizer-obsidian/README.md](note-structurizer-obsidian/README.md)
