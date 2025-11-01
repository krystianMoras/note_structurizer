from pydantic import BaseModel
from note_structure_enforcer.note_enforcer import NoteStructureEnforcer

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
    

enforcer = RecipeStructureEnforcer(
    prompt="""Przepisz przepis według struktury. Nie omijaj ważnych informacji. Treść przepisu powinna być zgodna, jedynie dopasowana do struktury.""",
    language_model="tsej/Llama-PLLuM-8B-instruct-GGUF:Q4_0"
)

