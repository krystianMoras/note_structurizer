import { TFile, Notice, Plugin } from "obsidian";
import * as fs from "fs";
import * as path from "path";

interface PythonEnforcerPluginSettings {
    projectPath: string; // absolute path to the python project
	overwriteOriginal?: boolean;
    outputDir?: string;
}

const DEFAULT_SETTINGS: PythonEnforcerPluginSettings = {
    projectPath: ""
};

import { PluginSettingTab, App, Setting } from "obsidian";

class PythonEnforcerSettingTab extends PluginSettingTab {
    plugin: PythonEnforcerPlugin;

    constructor(app: App, plugin: PythonEnforcerPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl("h2", { text: "Note Structurizer Plugin Settings" });

        new Setting(containerEl)
            .setName("Note Structurizer python project path")
            .setDesc("Path to the project if not installed.")
            .addText(text =>
                text.setPlaceholder("/path/to/your/project")
                    .setValue(this.plugin.settings.projectPath)
                    .onChange(async (value) => {
                        this.plugin.settings.projectPath = value;
                        await this.plugin.saveSettings();
                    })
            );
        new Setting(containerEl)
            .setName("Overwrite Original Note")
            .setDesc("If enabled, the original note will be overwritten with the enforced structure.")
            .addToggle(toggle =>
                toggle.setValue(!!this.plugin.settings.overwriteOriginal)
                    .onChange(async (value) => {
                        this.plugin.settings.overwriteOriginal = value;
                        await this.plugin.saveSettings();
                        // show/hide the output directory setting depending on toggle
                        outputDirSettingEl.style.display = value ? "none" : "";
                    })
            );

        // container for the conditional output directory setting
        const outputDirSettingEl = containerEl.createDiv();

        new Setting(outputDirSettingEl)
            .setName("Output directory")
            .setDesc("Directory (relative to vault) where the enforced note will be written when not overwriting the original.")
            .addText(text =>
                text.setPlaceholder("path/to/output/dir")
                    .setValue(((this.plugin.settings as any).outputDir) || "")
                    .onChange(async (value) => {
                        (this.plugin.settings as any).outputDir = value;
                        await this.plugin.saveSettings();
                    })
            );

        // initial visibility based on current setting
        if (this.plugin.settings.overwriteOriginal) {
            outputDirSettingEl.style.display = "none";
        }
	
    }
}


import { exec } from "child_process";

export default class PythonEnforcerPlugin extends Plugin {
    settings: PythonEnforcerPluginSettings;
    enforcerScripts: string[] = [];

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new PythonEnforcerSettingTab(this.app, this));
        this.scanForEnforcers();
        this.registerCommands();
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    scanForEnforcers() {

        const vaultPath = (this.app.vault as any).adapter.basePath;

        const files = this.app.vault.getFiles();
        this.enforcerScripts = [];

        files.forEach(f => {
            if (!f.path.endsWith(".py")) return;

            // heuristic: look for `enforcer =` in file
            const fullPath = path.join(vaultPath, f.path);
            try {
                const content = fs.readFileSync(fullPath, "utf-8");
                if (content.includes("enforcer =")) {
                    this.enforcerScripts.push(f.path);
                }
            } catch {}
        });
    }

    registerCommands() {
        const projectPath = this.settings.projectPath;
		const vaultPath = (this.app.vault as any).adapter.basePath;
        this.addCommand({
            id: "rescan-enforcers",
            name: "Rescan for Note Structurizer enforcer scripts",
            callback: () => {
                // remove existing commands
                this.enforcerScripts.forEach(scriptPath => {
                    this.removeCommand(`run-enforcer-${path.relative(this.app.vault.getRoot().path,scriptPath)}`);
                });
                this.enforcerScripts = [];
                this.scanForEnforcers();
                this.registerCommands();
                new Notice(`Found ${this.enforcerScripts.length} enforcer scripts.`);
            }
        });
        this.enforcerScripts.forEach(scriptPath => {
            this.addCommand({
                id: `run-enforcer-${path.relative(this.app.vault.getRoot().path,scriptPath)}`,
                name: `run ${path.relative(this.app.vault.getRoot().path,scriptPath)}`,
                callback: async () => {
                    await this.loadSettings();

                    const active = this.app.workspace.getActiveFile();
                    if (!active) return new Notice("No active note to run on");


					const inputFile = path.join(vaultPath, active.path);
                    const scriptFullPath = path.join(vaultPath,scriptPath);
					const outputFile = this.settings.overwriteOriginal ? inputFile : path.join(
                        vaultPath,
                        ((this.settings as any).outputDir || "").trim(),
                        path.basename(active.path)
                    );
                    const cmd = `${projectPath} note-structure-enforce --script "${scriptFullPath}" --input "${inputFile}" --output "${outputFile}"`;

                    exec(cmd, (err, stdout, stderr) => {
                        if (err) {
                            console.error(err);
                            new Notice(`Error running enforcer: ${err.message}`);
                        } else {
                            new Notice(`Enforcer finished: ${outputFile}`);
                        }
                    });
                }
            });
        });
    }
}
