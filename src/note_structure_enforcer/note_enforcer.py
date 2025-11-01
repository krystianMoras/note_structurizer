
from abc import ABC, abstractmethod
from typing import Generic, TypeVar, get_args, get_origin
from pydantic import BaseModel
from note_structure_enforcer import settings_model
try:
    from langfuse.openai import OpenAI
except ImportError:
    from openai import OpenAI


from pathlib import Path

OUTPUT_TYPE = TypeVar("OUTPUT_TYPE", bound=BaseModel)

class NoteStructureEnforcer(ABC, Generic[OUTPUT_TYPE]):

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)

        # Capture generic parameter
        orig = cls.__orig_bases__[0]  # type: ignore

        # Get MyModel from NoteStructureEnforcer[MyModel]
        args = get_args(orig)
        if args:
            cls.output_type = args[0]

    def __init__(self, prompt: str, language_model: str):
        self.openai_client = OpenAI(api_key=settings_model.openai_api_key, base_url=settings_model.openai_api_base)
        self.system_prompt = prompt
        self.language_model = language_model


    def enforce_structure(self, note_path: Path, output_path: Path) -> None:
        note_text = Path(note_path).read_text()
        structure = self.structurize(note_text)
        back_to_markdown = self.compose_note(structure)
        written_bytes = Path(output_path).write_text(back_to_markdown, encoding="utf-8")
        if written_bytes == 0:
            raise IOError(f"Failed to write to {output_path}")

    def structurize(self, note_text: str) -> OUTPUT_TYPE:
        response = self.openai_client.chat.completions.parse(
            messages = [
                {
                    "role": "system",
                    "content": self.system_prompt
                },
                {
                    "role": "user",
                    "content": note_text
                }
            ], 
            model=self.language_model,
            response_format=self.output_type
        )
        return response.choices[0].message.parsed
    
    @abstractmethod
    def compose_note(self, structured_note: OUTPUT_TYPE) -> str:
        """Generates a markdown note from the structured note object."""
        pass


