## Setup

### llama.cpp

```
brew install llama.cpp
llama-server -hf tsej/Llama-PLLuM-8B-instruct-GGUF:Q4_0
```

### Note enforcer

Copy contents of `.env.example` to `.env`, should work with default llama.cpp otherwise adjust accordingly (langfuse not required)

```
uv sync
uv tool install .
```

## Implement note enforcer

See [example](examples/recipes_structure.py)


The bare minimum example is to define some pydantic model:

```py
class Krok(BaseModel):
    opis: str
    dodatkowe_wskazówki: str

class Przepis(BaseModel):
    czas_przygotowania: str
    rodzaj_dania: str
    posiłek: str
    ilość_porcji: str
    składniki: list[str]
    kroki: list[Krok]
    propozycja_podania: str
```

Extend the `NoteStructureEnforcer` class:
```py
class RecipeStructureEnforcer(NoteStructureEnforcer[Przepis]):

    def compose_note(self, structured_note: Przepis) -> str:
        return f"""---
czas_przygotowania: {structured_note.czas_przygotowania}
rodzaj_dania: {structured_note.rodzaj_dania}
posiłek: {structured_note.posiłek}
ilość_porcji: {structured_note.ilość_porcji}
---
## Składniki
{"\n".join(f"- {składnik}" for składnik in structured_note.składniki)}
## Przygotowanie
{"\n".join(f"""{i+1}. {krok.opis}\n\n{krok.dodatkowe_wskazówki or ""}""" for i, krok in enumerate(structured_note.kroki))}
## Propozycja podania
{structured_note.propozycja_podania}
"""
```

Instantiate with prompt and model:
```py
enforcer = RecipeStructureEnforcer(
    prompt="""Przepisz przepis według struktury. Nie omijaj ważnych informacji. Treść przepisu powinna być zgodna, jedynie dopasowana do struktury.""",
    language_model="tsej/Llama-PLLuM-8B-instruct-GGUF:Q4_0"
)
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
