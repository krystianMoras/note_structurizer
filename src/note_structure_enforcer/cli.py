import runpy
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
from pydantic import BaseModel
from pydantic_settings import CliApp
from note_structure_enforcer.note_enforcer import NoteStructureEnforcer
import sys

class CLINoteStructureEnforcer(BaseModel):

    script: Path
    input: Path
    output: Path

    def cli_cmd(self) -> None:
        sys.path.insert(0, str(self.script.parent.resolve()))
        module_globals = runpy.run_path(str(self.script))

        # Expect the script to define an "enforcer"
        enforcer:NoteStructureEnforcer = module_globals.get("enforcer")
        if enforcer is None:
            raise RuntimeError(f"No 'enforcer' object found in {self.script}")

        enforcer.enforce_structure(self.input, self.output)



def main():
    app = CliApp().run(CLINoteStructureEnforcer)