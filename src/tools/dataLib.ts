import fs, { move } from "fs-extra";
import path from "path";
import chalk from "chalk";
import { EggGroups, FormData, isPokemonData, LevelUpMoveData, MoveKeys, MovesData, PokemonData } from "../lib/datalib";
import { LearnableMoves, EggGroupsLib, InheritableMoves, LevelUpMoves } from "../lib/lib";
import is from "@sindresorhus/is";
import { performance } from "perf_hooks";

export class DataLib {
    private static readonly dataPath = "data";
    private static readonly rawDataDir = `${this.dataPath}/species`;
    private static readonly inheritableMovesPath = `${this.dataPath}/inheritable_moves.json`;
    private static readonly levelupMovesPath = `${this.dataPath}/levelup_moves.json`;
    private static readonly eggGroupsPath = `${this.dataPath}/egg_groups.json`;
    private static readonly learnableMovesPath = `${this.dataPath}/learnable_moves.json`;
    private static readonly inheritorsPath = `${this.dataPath}/inheritors.json`;

    private static readonly __MOVE_METHODS = ["levelUpMoves", "tutorMoves", "eggMoves", "tmMoves8", "trMoves", "hmMoves", "transferMoves", "tmMoves7"]; //, "tmMoves6", "tmMoves5", "tmMoves4", "tmMoves3", "tmMoves2", "tmMoves1", "tmMoves"];
    private static readonly __INHERITANCE_METHODS = ["levelUpMoves", "tutorMoves", "eggMoves", "transferMoves"];

    public static INHERITABLE_MOVES: InheritableMoves = {};
    public static LEVELUP_MOVES: LevelUpMoves = {};
    public static EGG_GROUPS_LIB: EggGroupsLib = {};
    public static LEARNABLE_MOVES: LearnableMoves = {};

    private static __static_constructor = (() => {
        var startTime = performance.now();

        DataLib.INHERITABLE_MOVES = DataLib.TryLoadFile(this.inheritableMovesPath, {} as InheritableMoves);
        DataLib.LEVELUP_MOVES = DataLib.TryLoadFile(this.levelupMovesPath, {} as LevelUpMoves);
        DataLib.EGG_GROUPS_LIB = DataLib.TryLoadFile(this.eggGroupsPath, {} as EggGroupsLib);
        DataLib.LEARNABLE_MOVES = DataLib.TryLoadFile(this.learnableMovesPath, {} as LearnableMoves);

        DataLib.generateMissingLibraries();

        var endTime = performance.now();
        console.log(chalk.bgGreen(`DataLib took ${(endTime - startTime).toFixed(0)} milliseconds to initialize.`));
    })();

    /** Fills any of the libraries that are empty with the appropriate information.  */
    private static generateMissingLibraries() {
        const filenames = getListOfDataFiles(this.rawDataDir);

        //* Initial loop
        for (const filename of filenames) {
            console.log(chalk.blue(filename));
            const data = fs.readFileSync(`${this.rawDataDir}/${filename}`);
            const pokemonData: PokemonData = JSON.parse(data.toString());
            for (const method of this.__MOVE_METHODS) {
                for (const form of pokemonData.forms) {
                    const fullName = form.name === "" ? pokemonData.name : `${pokemonData.name}-${form.name}`;
                    const formName = form.name === "" ? "default" : form.name;
                    const moves = getFormMoves(form, method as keyof MovesData);
                    if (!moves) continue;
                    for (const move of moves) {
                        if (typeof move !== "string") {
                            this._addLearnableMove(fullName, method, ...move.attacks);
                        } else {
                            this._addLearnableMove(fullName, method, move);
                        }
                    }
                }
            }
        }

        //* Iterate over every Pokemon that has a data file
        for (const filename of filenames) {
            const data = fs.readFileSync(`${this.rawDataDir}/${filename}`);
            const pokemonData: PokemonData = JSON.parse(data.toString());

            //* Generate files on a per-form basis
            for (const form of pokemonData.forms) {
                const fullName = form.name === "" ? pokemonData.name : `${pokemonData.name}-${form.name}`;
                const formName = form.name === "" ? "default" : form.name;

                DataLib._addLevelUpMoves(fullName, form, formName);
                DataLib._addEggGroupsToLib(fullName, form);
                DataLib._addInheritableMoves(fullName, form, formName);
            }

            //* Generate files on a per-species basis
        }
        fs.writeFileSync(this.eggGroupsPath, JSON.stringify(this.EGG_GROUPS_LIB, null, 4));
        fs.writeFileSync(this.levelupMovesPath, JSON.stringify(this.LEVELUP_MOVES, null, 4));
        fs.writeFileSync(this.learnableMovesPath, JSON.stringify(this.LEARNABLE_MOVES, null, 4));
    }

    private static _addInheritableMoves(fullName: string, form: FormData, formName: string) {
        if (DataLib.INHERITABLE_MOVES.hasOwnProperty(fullName)) return;
        else DataLib.INHERITABLE_MOVES[fullName] = {};
        const listOfInheritableMoves = this.getInheritableMoves(form);
        for (const move of listOfInheritableMoves) {
            if (!DataLib.INHERITABLE_MOVES[fullName].hasOwnProperty(move)) DataLib.INHERITABLE_MOVES[fullName][move] = { parents: [] };
            const listOfPokemonThatLearnMove = Object.keys(this.LEARNABLE_MOVES[move]);
            const listOfParents = listOfPokemonThatLearnMove.filter((p) => this.shareEggGroup(p, fullName));
            for (const parent of listOfParents) {
                const learnedFrom = this.LEARNABLE_MOVES[move][parent];
                DataLib.INHERITABLE_MOVES[fullName][move].parents.push([parent, learnedFrom]);
            }
        }
    }

    private static getInheritableMoves(form: FormData): string[] {
        const eggMoves = getFormMoves(form, "eggMoves") as string[];
        const tutorMoves = getFormMoves(form, "tutorMoves") as string[];
        const transferMoves = getFormMoves(form, "transferMoves") as string[];
        const inheritableMoves: string[] = [];
        if (eggMoves) inheritableMoves.push(...eggMoves);
        if (tutorMoves) inheritableMoves.push(...tutorMoves);
        if (transferMoves) inheritableMoves.push(...transferMoves);
        return inheritableMoves;
    }

    private static _addLevelUpMoves(fullName: string, form: FormData, formName: string) {
        const levelUpMoves = getFormMoves(form, "levelUpMoves");
        if (!levelUpMoves || is.array<string>(levelUpMoves)) return;
        if (DataLib.LEVELUP_MOVES.hasOwnProperty(fullName)) return;
        else DataLib.LEVELUP_MOVES[fullName] = [];
        DataLib.LEVELUP_MOVES[fullName] = levelUpMoves;
    }

    private static _addEggGroupsToLib(fullName: string, form: FormData) {
        //* Forms don't have different egg groups, but we need to store them for each form
        const eggGroups = form.eggGroups;
        if (!eggGroups) return;
        for (const group of eggGroups) {
            if (!DataLib.EGG_GROUPS_LIB.hasOwnProperty(group)) DataLib.EGG_GROUPS_LIB[group] = [];
            if (DataLib.EGG_GROUPS_LIB[group]!.includes(fullName)) return;
            DataLib.EGG_GROUPS_LIB[group]!.push(fullName);
        }
    }

    private static _addLearnableMove(pokemonName: string, method: string, ...moves: string[]) {
        for (const move of moves) {
            if (!this.LEARNABLE_MOVES.hasOwnProperty(move)) this.LEARNABLE_MOVES[move] = {};
            if (!this.LEARNABLE_MOVES[move].hasOwnProperty(pokemonName)) this.LEARNABLE_MOVES[move][pokemonName] = [];
            if (!this.LEARNABLE_MOVES[move][pokemonName].includes(method)) this.LEARNABLE_MOVES[move][pokemonName].push(method);
        }
    }

    public static shareEggGroup(fullName1: string, fullName2: string): boolean {
        for (const group in DataLib.EGG_GROUPS_LIB) {
            const listOfPokemonInGroup = DataLib.EGG_GROUPS_LIB[group as keyof EggGroupsLib];
            if (!listOfPokemonInGroup) throw console.log(chalk.red("!ERR: Could not read list of Pokemon in group", group));
            if (listOfPokemonInGroup.includes(fullName1) && listOfPokemonInGroup.includes(fullName2)) return true;
        }
        return false;
    }

    //! # === Helpers === #

    static TryLoadFile<T>(filePath: string, defaultValue?: T): T {
        let result = undefined;
        if (fs.existsSync(filePath)) result = JSON.parse(fs.readFileSync(filePath).toString());
        return result || defaultValue;
    }
}
//#region helpers

/**
 *
 * @param pokemonData PokemonData object (data JSON) to get the moves from
 * @param key key of object to get moves from. E.g. eggMoves
 * @returns
 */

/**
 *
 * @param formData FormData object to get the moves from
 * @param key key of object to get moves from. E.g. eggMoves
 */
export function getFormMoves(formData: FormData, key: MoveKeys): string[] | LevelUpMoveData[] | undefined {
    return formData.moves?.[key];
}

/**
 * Read the filenames in `rawDataDir` and return a list of the ones matching the RegExp.
 * @param {string} rawDataDir - The directory to search.
 * @param {RegExp} [regexp= /([0-9]*)_(.*)\.json/] - The RegExp to match. Default: `(num)_(pokemon).json`
 */
export function getListOfDataFiles(rawDataDir: string, regexp: RegExp = /([0-9]*)_(.*)\.json/) {
    const files = fs.readdirSync(rawDataDir).filter((filename) => {
        //* Check if the filename matches the JSON files format
        const match = regexp.exec(filename);
        if (match === null) console.log(chalk.red(filename, "didn't match!"));
        return match !== null;
    });
    return files;
}

export function writeToTest(data: any) {
    fs.writeFileSync("data/test.json", JSON.stringify(data, null, 4));
}

//#endregion
