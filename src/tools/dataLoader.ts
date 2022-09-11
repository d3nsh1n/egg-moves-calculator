import { performance } from "perf_hooks";
import { EggGroupsLib, Forms, LearnableMoves, MOVE_KEYS } from "../lib/lib";
import { DataLib } from "./dataLib";
import chalk from "chalk";
import fs from "fs-extra";
import { FormData, LevelUpMoveData, MoveKeys, PokemonData } from "../lib/pokemonlib";
import { getMoveUsage } from "../smogon_stats";
import ky from "ky-universal";
import { getFullName } from "../lib/utils";

export const MISMOVES: string[] = [];
export const MISFORMS: string[] = [];

export class DataLoader {
    private static readonly dataDir = "data";
    private static readonly dataOutDir = `${this.dataDir}/out`;
    private static readonly rawDataDir = `${this.dataDir}/species`;
    private static readonly learnableMovesPath = `${this.dataOutDir}/learnable_moves.json`;
    private static readonly eggGroupsPath = `${this.dataOutDir}/egg_groups.json`;
    private static readonly formsPath = `${this.dataOutDir}/forms.json`;

    //! Constructor Methods
    //#region Constructor Methods

    constructor(private forceLoad: boolean = false) {
        let startTime = performance.now();
        //* Make the static instance of DataLib?
        new DataLib();

        //* Load files if they exist, initialize with defaults if they don't.
        DataLib.LEARNABLE_MOVES = DataLoader.TryLoadFile(DataLoader.learnableMovesPath, {} as LearnableMoves, forceLoad);
        DataLib.EGG_GROUPS_LIB = DataLoader.TryLoadFile(DataLoader.eggGroupsPath, {} as EggGroupsLib, forceLoad);
        DataLib.FORMS = DataLoader.TryLoadFile(DataLoader.formsPath, {} as Forms, forceLoad);

        const filenames = DataLoader.getListOfDataFiles(DataLoader.rawDataDir);
        DataLoader._loadDataFromFiles(filenames);
        console.log(chalk.bgGreen(`DataLoader took ${(performance.now() - startTime).toFixed(0)} milliseconds to initialize.`));

        //* Initialize DataLib after loading Libraries
        DataLib.init(forceLoad);

        //* Write Files
        startTime = performance.now();
        fs.writeFileSync(DataLoader.eggGroupsPath, JSON.stringify(DataLib.EGG_GROUPS_LIB, null, 4));
        fs.writeFileSync(DataLoader.formsPath, JSON.stringify(DataLib.FORMS, null, 4));
        fs.writeFileSync(DataLoader.learnableMovesPath, JSON.stringify(DataLib.LEARNABLE_MOVES, null, 4));
        console.log(chalk.bgGreen(`DataLoader took ${(performance.now() - startTime).toFixed(0)} milliseconds to write files.`));
    }

    /**  FORMS, POKEMON_DATA, EGG_GROUPS */
    private static _loadDataFromFiles(filenames: string[]) {
        let startTime = performance.now();

        //* Iterate over every file
        for (const filename of filenames) {
            //* Read filedata
            const data = fs.readFileSync(`${this.rawDataDir}/${filename}`);
            const pokemonData: PokemonData = JSON.parse(data.toString());

            //* Store Pokemon Data
            DataLib.addPokemonData(pokemonData);

            //* For each form
            for (const form of pokemonData.forms) {
                const fullName = getFullName(pokemonData.name, form.name);

                //* Store Form Data
                DataLib.addForm(fullName, form);

                //* Add to Egg Groups
                DataLib.addEggGroupsToLib(fullName, form);
            }
        }
        console.log(chalk.bgGreenBright(`_loadDataFromFiles took ${(performance.now() - startTime).toFixed(0)} milliseconds to initialize.`));
    }
    //#endregion

    //! Methods
    //#region Methods

    /**
     * Attempt to load file specified by `filepath`, and return `defaultValue` or `undefined` if file is missing.
     */
    public static TryLoadFile<T>(filePath: string, defaultValue?: T, forceLoad = false): T {
        let result = undefined;
        if (fs.existsSync(filePath) && !forceLoad) result = JSON.parse(fs.readFileSync(filePath).toString());
        return result || defaultValue;
    }

    /**
     * Read the filenames in `rawDataDir` and return a list of the ones matching the RegExp.
     * @param {string} rawDataDir - The directory to search.
     * @param {RegExp} [regexp= /([0-9]*)_(.*)\.json/] - The RegExp to match. Default: `(num)_(pokemon).json`
     */

    public static getListOfDataFiles(rawDataDir: string, regexp: RegExp = /([0-9]*)_(.*)\.json/) {
        const files = fs.readdirSync(rawDataDir).filter((filename) => {
            //* Check if the filename matches the JSON files format
            const match = regexp.exec(filename);
            if (match === null) console.log(chalk.red(filename, "didn't match!"));
            return match !== null;
        });
        return files;
    }

    //#endregion
}
