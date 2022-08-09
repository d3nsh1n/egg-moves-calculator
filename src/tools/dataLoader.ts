import { performance } from "perf_hooks";
import { EggGroupsLib, InheritableMoves, MoveSources, MOVE_KEYS } from "src/lib/lib";
import { DataLib } from "./dataLib";
import chalk from "chalk";
import fs from "fs-extra";
import { FormData, LevelUpMoveData, MoveKeys, PokemonData } from "src/lib/pokemonlib";

export class DataLoader {
    private static readonly dataDir = "data";
    private static readonly rawDataDir = `${this.dataDir}/species`;
    private static readonly inheritableMovesPath = `${this.dataDir}/inheritable_moves.json`;
    private static readonly eggGroupsPath = `${this.dataDir}/egg_groups.json`;
    private static readonly learnableMovesPath = `${this.dataDir}/learnable_moves.json`;
    private static readonly formsPath = `${this.dataDir}/forms.json`;

    //! Constructor Methods
    //#region Constructor Methods

    // private static __static_constructor = (() => {
    constructor() {
        let startTime = performance.now();
        console.log(chalk.blue("DONE!"));
        //* Load files if they exist, initialize with defaults if they don't.
        DataLib.INHERITABLE_MOVES = DataLoader.TryLoadFile(DataLoader.inheritableMovesPath, {} as InheritableMoves);
        // DataLib.LEVELUP_MOVES = DataLoader.TryLoadFile(DataLoader.levelupMovesPath, {} as LevelUpMoves);
        DataLib.EGG_GROUPS_LIB = DataLoader.TryLoadFile(DataLoader.eggGroupsPath, {} as EggGroupsLib);
        DataLib.MOVES_SOURCES = DataLoader.TryLoadFile(DataLoader.learnableMovesPath, {} as MoveSources);

        const filenames = DataLoader.getListOfDataFiles(DataLoader.rawDataDir);
        DataLoader.__generateInitial(filenames);
        DataLoader.__generateInheritableMoves(filenames);
        //* Write Files
        fs.writeFileSync(DataLoader.eggGroupsPath, JSON.stringify(DataLib.EGG_GROUPS_LIB, null, 4));
        fs.writeFileSync(DataLoader.learnableMovesPath, JSON.stringify(DataLib.MOVES_SOURCES, null, 4));
        fs.writeFileSync(DataLoader.inheritableMovesPath, JSON.stringify(DataLib.INHERITABLE_MOVES, null, 4));
        fs.writeFileSync(DataLoader.formsPath, JSON.stringify(DataLib.FORMS, null, 4));
        console.log(chalk.bgGreen(`DataLoader took ${(performance.now() - startTime).toFixed(0)} milliseconds to initialize.`));
    }
    // })();

    //? MOVE_SOURCES, EGG_GROUPS
    private static __generateInitial(filenames: string[]) {
        let startTime = performance.now();

        //* Iterate over every file
        for (const filename of filenames) {
            //* Read filedata
            const data = fs.readFileSync(`${this.rawDataDir}/${filename}`);
            const pokemonData: PokemonData = JSON.parse(data.toString());
            //* For each form
            for (const form of pokemonData.forms) {
                const fullName = form.name === "" ? pokemonData.name : `${pokemonData.name}-${form.name}`;

                //* Store Form Data
                DataLib.addForm(fullName, form);

                //* Add Move Sources
                DataLib.addMoveSources(fullName, form);

                //* Add to Egg Groups
                DataLib.addEggGroupsToLib(fullName, form);
            }
        }
        console.log(chalk.bgGreenBright(`__generateMoveSources took ${(performance.now() - startTime).toFixed(0)} milliseconds to initialize.`));
    }

    //? INHERITABLE_MOVES
    private static __generateInheritableMoves(filenames: string[]) {
        for (const filename of filenames) {
            const data = fs.readFileSync(`${this.rawDataDir}/${filename}`);
            const pokemonData: PokemonData = JSON.parse(data.toString());

            //* Generate files on a per-form basis
            for (const form of pokemonData.forms) {
                const fullName = form.name === "" ? pokemonData.name : `${pokemonData.name}-${form.name}`;
                DataLib.addInheritableMoves(fullName, form);
            }

            //* Generate files on a per-species basis
            return;
        }
    }
    //#endregion

    //! Methods
    //#region Methods

    /**
     * Attempt to load file specified by `filepath`, and return `defaultValue` or `undefined` if file is missing.
     */
    public static TryLoadFile<T>(filePath: string, defaultValue?: T): T {
        let result = undefined;
        if (fs.existsSync(filePath)) result = JSON.parse(fs.readFileSync(filePath).toString());
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

    /**
     *
     * @param formData FormData object to get the moves from
     * @param key key of object to get moves from. E.g. eggMoves
     */
    public static getFormMoves(formData: FormData, key: MoveKeys): string[] | LevelUpMoveData[] | undefined {
        return formData.moves?.[key];
    }
    //#endregion
}
