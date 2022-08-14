import { performance } from "perf_hooks";
import { EggGroupsLib, InheritableMoves, MoveSources, MOVE_KEYS } from "src/lib/lib";
import { DataLib } from "./dataLib";
import chalk from "chalk";
import fs from "fs-extra";
import { FormData, LevelUpMoveData, MoveKeys, PokemonData } from "src/lib/pokemonlib";
import { getMoveUsage } from "../smogon_stats";
import ky from "ky-universal";

export const MISMOVES: string[] = [];
export const MISFORMS: string[] = [];

export class DataLoader {
    private static readonly dataDir = "data";
    private static readonly rawDataDir = `${this.dataDir}/species`;
    private static readonly inheritableMovesPath = `${this.dataDir}/inheritable_moves.json`;
    private static readonly eggGroupsPath = `${this.dataDir}/egg_groups.json`;
    private static readonly moveSourcesPath = `${this.dataDir}/move_sources.json`;
    private static readonly formsPath = `${this.dataDir}/forms.json`;

    //! Constructor Methods
    //#region Constructor Methods

    constructor(private forceLoad: boolean = false) {
        let startTime = performance.now();
        //* Make the static instance of DataLib?
        new DataLib();

        //* Load files if they exist, initialize with defaults if they don't.
        DataLib.INHERITABLE_MOVES = DataLoader.TryLoadFile(DataLoader.inheritableMovesPath, {} as InheritableMoves, forceLoad);
        DataLib.EGG_GROUPS_LIB = DataLoader.TryLoadFile(DataLoader.eggGroupsPath, {} as EggGroupsLib, forceLoad);
        DataLib.MOVES_SOURCES = DataLoader.TryLoadFile(DataLoader.moveSourcesPath, {} as MoveSources, forceLoad);

        const filenames = DataLoader.getListOfDataFiles(DataLoader.rawDataDir);
        DataLoader.__loadFiles(filenames);
        DataLib.init(forceLoad);

        //* Write Files
        console.log(MISMOVES);
        fs.writeFileSync(DataLoader.eggGroupsPath, JSON.stringify(DataLib.EGG_GROUPS_LIB, null, 4));
        fs.writeFileSync(DataLoader.moveSourcesPath, JSON.stringify(DataLib.MOVES_SOURCES, null, 4));
        fs.writeFileSync(DataLoader.formsPath, JSON.stringify(DataLib.FORMS, null, 4));

        const gen1: InheritableMoves = {};
        const gen2: InheritableMoves = {};
        const gen3: InheritableMoves = {};
        const gen4: InheritableMoves = {};
        const gen5: InheritableMoves = {};
        const gen6: InheritableMoves = {};
        const gen7: InheritableMoves = {};
        const gen8: InheritableMoves = {};
        let dex = 0;
        for (const pokemon in DataLib.INHERITABLE_MOVES) {
            // const dex = DataLib.POKEMON_DATA[pokemon.split("-")[0]].dex;
            fs.writeFileSync(`data/inheritables/${pokemon}.json`, JSON.stringify(DataLib.INHERITABLE_MOVES[pokemon], null, 4));
            // dex++;
            // if (dex <= 151) {
            //     console.log(chalk.red(dex));
            //     gen1[pokemon] = JSON.parse(JSON.stringify(DataLib.INHERITABLE_MOVES[pokemon]));
            // } else if (dex <= 251) {
            //     console.log(chalk.yellow(dex));
            //     gen2[pokemon] = JSON.parse(JSON.stringify(DataLib.INHERITABLE_MOVES[pokemon]));
            // } else if (dex <= 386) {
            //     console.log(chalk.blue(dex));
            //     gen3[pokemon] = JSON.parse(JSON.stringify(DataLib.INHERITABLE_MOVES[pokemon]));
            // } else if (dex <= 493) {
            //     console.log(chalk.magenta(dex));
            //     gen4[pokemon] = JSON.parse(JSON.stringify(DataLib.INHERITABLE_MOVES[pokemon]));
            // } else if (dex <= 649) {
            //     console.log(chalk.cyanBright(dex));
            //     gen5[pokemon] = JSON.parse(JSON.stringify(DataLib.INHERITABLE_MOVES[pokemon]));
            // } else if (dex <= 721) {
            //     console.log(chalk.green(dex));
            //     gen6[pokemon] = JSON.parse(JSON.stringify(DataLib.INHERITABLE_MOVES[pokemon]));
            // } else if (dex <= 809) {
            //     console.log(chalk.bgRedBright(dex));
            //     gen7[pokemon] = JSON.parse(JSON.stringify(DataLib.INHERITABLE_MOVES[pokemon]));
            // } else if (dex <= 905) {
            //     console.log(dex);
            //     gen8[pokemon] = JSON.parse(JSON.stringify(DataLib.INHERITABLE_MOVES[pokemon]));
            // }
        }
        // fs.writeFileSync(`data/inheritable_gen1.json`, JSON.stringify(gen1, null, 4));
        // fs.writeFileSync(`data/inheritable_gen2.json`, JSON.stringify(gen2, null, 4));
        // fs.writeFileSync(`data/inheritable_gen3.json`, JSON.stringify(gen3, null, 4));
        // fs.writeFileSync(`data/inheritable_gen4.json`, JSON.stringify(gen4, null, 4));
        // fs.writeFileSync(`data/inheritable_gen5.json`, JSON.stringify(gen5, null, 4));
        // fs.writeFileSync(`data/inheritable_gen6.json`, JSON.stringify(gen6, null, 4));
        // fs.writeFileSync(`data/inheritable_gen7.json`, JSON.stringify(gen7, null, 4));
        // fs.writeFileSync(`data/inheritable_gen8.json`, JSON.stringify(gen8, null, 4));

        console.log(chalk.bgGreen(`DataLoader took ${(performance.now() - startTime).toFixed(0)} milliseconds to initialize.`));
        //!
        // DataLoader.debug(filenames);
    }

    //? MOVE_SOURCES, EGG_GROUPS
    private static __loadFiles(filenames: string[]) {
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
                const fullName = form.name === "" ? pokemonData.name : `${pokemonData.name}-${form.name}`;

                //* Store Form Data
                DataLib.addForm(fullName, form);

                //* Add to Egg Groups
                DataLib.addEggGroupsToLib(fullName, form);
            }
        }
        console.log(chalk.bgGreenBright(`__loadFiles took ${(performance.now() - startTime).toFixed(0)} milliseconds to initialize.`));
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
