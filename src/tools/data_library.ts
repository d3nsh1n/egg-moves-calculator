import fs, { move } from "fs-extra";
import path from "path";
import chalk from "chalk";
import { logger } from "./logger";
import { EggGroups, FormData, isPokemonData, LevelUpMovesData, MoveKeys, MovesData, PokemonData } from "../lib/datalib";
import { Beneficiaries, EggGroupsLib, SpeciesMoves, Inheritors, MovesLib } from "../lib/lib";
import is from "@sindresorhus/is";
import { performance } from "perf_hooks";

export class DataLib {
    private static readonly dataPath = "data";
    private static readonly rawDataDir = `${this.dataPath}/species`;
    private static readonly eggMovesPath = `${this.dataPath}/egg_moves.json`;
    private static readonly levelupMovesPath = `${this.dataPath}/levelup_moves.json`;
    private static readonly eggGroupsPath = `${this.dataPath}/egg_groups.json`;
    private static readonly beneficiariesPath = `${this.dataPath}/beneficiaries.json`;
    private static readonly inheritorsPath = `${this.dataPath}/inheritors.json`;

    private readonly INHERITANCE_METHODS = ["levelUpMoves", "tutorMoves", "eggMoves", "transferMoves"];

    public static EGG_MOVES_LIB: MovesLib = {};
    public static EGG_MOVES_LIB_2: MovesLib = {};
    public static LEVELUP_MOVES: MovesLib = {};
    public static EGG_GROUPS_LIB: EggGroupsLib = {};
    public static BENEFICIARIES: Beneficiaries = {};
    public static INHERITORS: Inheritors = {};

    private static __static_constructor = (() => {
        var startTime = performance.now();

        DataLib.EGG_MOVES_LIB = DataLib.TryLoadFile(this.eggMovesPath, {} as MovesLib);
        DataLib.LEVELUP_MOVES = DataLib.TryLoadFile(this.eggMovesPath, {} as MovesLib);
        DataLib.EGG_GROUPS_LIB = DataLib.TryLoadFile(this.eggGroupsPath, {} as EggGroupsLib);
        DataLib.BENEFICIARIES = DataLib.TryLoadFile(this.beneficiariesPath, {} as Beneficiaries);
        DataLib.INHERITORS = DataLib.TryLoadFile(this.inheritorsPath, {} as Inheritors);

        DataLib.generateMissingLibraries();

        fs.writeFile("data/test.json", JSON.stringify(DataLib.EGG_MOVES_LIB, null, 4));
        var endTime = performance.now();
        console.log(chalk.bgGreen(`DataLib took ${(endTime - startTime).toFixed(0)} milliseconds to initialize.`));
    })();

    /** Fills any of the libraries that are empty with the appropriate information.  */
    private static generateMissingLibraries() {
        const filenames = getListOfDataFiles(this.rawDataDir);

        //* Iterate over every Pokemon that has a data file
        for (const filename of filenames) {
            const data = fs.readFileSync(`${this.rawDataDir}/${filename}`);
            const pokemonData: PokemonData = JSON.parse(data.toString());

            //* Generate files on a per-form basis
            for (const form of pokemonData.forms) {
                const pokemonName = form.name === "" ? pokemonData.name : `${pokemonData.name}-${form.name}`;
                const formName = form.name === "" ? "default" : form.name;

                DataLib._addEggMoves(pokemonName, form, formName);
            }

            //* Generate files on a per-species basis
            DataLib._addEggMoves2(pokemonData);
        }
    }

    private static _addEggMoves(pokemonName: string, form: FormData, formName: string) {
        const eggMoves = getFormMoves(form, "eggMoves");
        if (pokemonName === "Slowbro-galarian") console.log("ONE:", eggMoves);

        if (!eggMoves) return;
        if (DataLib.EGG_MOVES_LIB.hasOwnProperty(pokemonName)) return;
        else DataLib.EGG_MOVES_LIB[pokemonName] = {};
        DataLib.EGG_MOVES_LIB[pokemonName][formName] = eggMoves;
    }

    private static _addEggMoves2(pokemonData: PokemonData) {
        // if (pokemonData.name === "Slowbro") console.log(pokemonData.forms);
        for (const form of pokemonData.forms) {
            const pokemonName = form.name === "" ? pokemonData.name : `${pokemonData.name}-${form.name}`;
            const formName = form.name === "" ? "default" : form.name;

            const eggMoves = getFormMoves(form, "eggMoves");
            if (pokemonName === "Slowbro-galarian") console.log("TWO:", eggMoves);
            if (!eggMoves) continue;
            if (DataLib.EGG_MOVES_LIB_2.hasOwnProperty(pokemonName)) continue;
            else DataLib.EGG_MOVES_LIB_2[pokemonName] = {};
            DataLib.EGG_MOVES_LIB_2[pokemonName][formName] = eggMoves;
        }
    }

    private static _addLevelUpMoves() {}

    static TryLoadFile<T>(filePath: string, defaultValue?: T): T {
        let result = undefined;
        if (fs.existsSync(filePath)) result = JSON.parse(fs.readFileSync(filePath).toString());
        return result || defaultValue;
    }
}

// async function GenerateFiles(): Promise<void> {

//     return new Promise((resolve) => {
//         //* Read all files in directoryPath
//         fs.readdir(directoryPath, async (err, files) => {

//                 // if (!isPokemonData(pokemonData)) throw console.error("Incorrect file format!");

//                 //* Get data
//                 if (pokemonData.dex % 100 === 0) console.log(pokemonData.dex);
//                 //! Egg Moves
//                 if (generateEggMoves) {
//                     const eggMoves = getSpeciesMoves(pokemonData, "eggMoves");
//                     EGG_MOVES[match[2]] = eggMoves;
//                     logger.red("Done with ", file);
//                 } //todo REMOVE else EGG_MOVES = JSON.parse((await fs.readFile(eggMovesPath)).toString());

//                 //! Levelup Moves
//                 if (generateLevelupMoves) {
//                     console.log("LU moves");
//                     LEVELUP_MOVES[match[2]] = getSpeciesMoves(pokemonData, "levelUpMoves");
//                     logger.red("Done with ", file);
//                 } //else LEVELUP_MOVES = JSON.parse((await fs.readFile(levelupMovesPath)).toString());

//                 //! Egg Groups
//                 if (generateEggGroups) {
//                     for (const form of pokemonData.forms) {
//                         for (const i in form.eggGroups) {
//                             const group = form.eggGroups[i];
//                             if (!EGG_GROUPS.hasOwnProperty(group)) EGG_GROUPS[group] = [];
//                             EGG_GROUPS[group]!.push(pokemonData.name);
//                         }
//                     }
//                 } //else EGG_GROUPS = JSON.parse((await fs.readFile(eggGroupsPath)).toString());

//                 //! Beneficiaries
//                 // For each move that a Pokemon can learn, store it along with the way(s) it's learned by
//                 if (generateBeneficiaries) {
//                     for (const form of pokemonData.forms) {
//                         // Determine Pokemon name based on form (e.g. "Yamask" or "Yamask-Galar")
//                         const name = form.name === "" ? pokemonData.name : `${pokemonData.name}-${form.name}`;
//                         // Initialize key
//                         BENEFICIARIES[name] = {};
//                         // Iterate through every move, of every learn method
//                         for (const learnMethod in form.moves) {
//                             if (learnMethod === "levelUpMoves") {
//                                 for (const level of form.moves[learnMethod as keyof MovesData] as any[]) {
//                                     for (const move of level.attacks) {
//                                         // Initialize the array if it's the first time you're encountering this move
//                                         // (A Pokemon can learn the same move through multiple ways)
//                                         if (!BENEFICIARIES[name][move]) BENEFICIARIES[name][move] = { learnBy: [] };
//                                         // Add the learn method to the list
//                                         BENEFICIARIES[name][move].learnBy.push(learnMethod);
//                                     }
//                                 }
//                             } else {
//                                 for (const move of form.moves[learnMethod as keyof MovesData] as string[]) {
//                                     // Initialize the array if it's the first time you're encountering this move
//                                     // (A Pokemon can learn the same move through multiple ways)
//                                     if (!BENEFICIARIES[name][move]) BENEFICIARIES[name][move] = { learnBy: [] };
//                                     // Add the learn method to the list
//                                     BENEFICIARIES[name][move].learnBy.push(learnMethod);
//                                 }
//                             }
//                         }
//                     }
//                 } //else BENEFICIARIES = JSON.parse((await fs.readFile(beneficiariesPath)).toString());

//                 //! Inheritors
//                 // console.log("Generating");
//                 if (generateInheritors) {
//                     for (const form of pokemonData.forms) {
//                         // Determine Pokemon name based on form (e.g. "Yamask" or "Yamask-Galar")
//                         const name = form.name === "" ? pokemonData.name : `${pokemonData.name}-${form.name}`;
//                         // Initialize key
//                         INHERITORS[name] = {};

//                         //* Get a list of every Inheritable move
//                         const InheritableMoves: [string, string][] = [];
//                         // Iterate through every move, of every inheritance method
//                         for (const learnMethod of INHERITANCE_METHODS) {
//                             if (learnMethod === "levelUpMoves") {
//                                 for (const level of form.moves[learnMethod as keyof MovesData] as any[]) {
//                                     for (const move of level.attacks) {
//                                         if (!InheritableMoves.includes([move, learnMethod])) InheritableMoves.push([move, learnMethod]);
//                                     }
//                                 }
//                             } else {
//                                 for (const move of form.moves[learnMethod as keyof MovesData] as string[]) {
//                                     if (!InheritableMoves.includes([move, learnMethod])) InheritableMoves.push([move, learnMethod]);
//                                 }
//                             }
//                         }
//                         //* For every inheritable move, see which Pokemon shares an Egg Group and can learn it
//                         console.log("InhMOVES:", InheritableMoves);
//                         for (const inheritable of InheritableMoves) {
//                             console.log("Inheritable:", inheritable, "Name:", name);
//                             INHERITORS[name][inheritable[0]] = { inheritanceType: inheritable[1], beneficiaries: {} };
//                             console.log("INHERITORS:", INHERITORS);
//                             for (const eggGroup of form.eggGroups) {
//                                 console.log("Egg Group:", eggGroup);
//                                 console.log("EGG GROUP:", EGG_GROUPS[eggGroup]);
//                                 //todo egg groups has pokemon names rather than names-forms
//                                 for (const potentialParent of EGG_GROUPS[eggGroup]!) {
//                                     console.log("Potential Parent:", potentialParent);
//                                     // console.log(chalk.yellow(potentialParent, BENEFICIARIES[potentialParent], [inheritable[0]]));
//                                     // if the potential parent learns the move
//                                     if (BENEFICIARIES[potentialParent][inheritable[0]]) {
//                                         // Store as Gastly: Toxic: Koffing: [LevelUp, Tm2]
//                                         INHERITORS[name][inheritable[0]].beneficiaries[potentialParent] = { learnBy: BENEFICIARIES[potentialParent][inheritable[0]].learnBy };
//                                     }
//                                 }
//                             }
//                             return;
//                         }
//                     }
//                 }
//             }
//             if (generateEggMoves) fs.writeFile(eggMovesPath, JSON.stringify(EGG_MOVES, null, 4));
//             if (generateLevelupMoves) fs.writeFile(levelupMovesPath, JSON.stringify(LEVELUP_MOVES, null, 4));
//             if (generateEggGroups) fs.writeFile(eggGroupsPath, JSON.stringify(EGG_GROUPS, null, 4));
//             if (generateBeneficiaries) fs.writeFile(beneficiariesPath, JSON.stringify(BENEFICIARIES, null, 4));
//             // if (generateInheritors) fs.writeFile(inheritorsPath, JSON.stringify(INHERITORS, null, 4));

//             resolve();
//         });
//     });
// }

//! Helpers

/**
 *
 * @param pokemonData PokemonData object (data JSON) to get the moves from
 * @param key key of object to get moves from. E.g. eggMoves
 * @returns
 */
export function getSpeciesMoves(pokemonData: PokemonData, key: MoveKeys): SpeciesMoves {
    const moves: SpeciesMoves = {};
    for (const form of pokemonData.forms) {
        const formMoves = form.moves?.[key];
        if (!is.array<string>(formMoves)) {
            console.log(chalk.yellow(form.name, "Moves are not a list of strings!"));
            continue;
        }
        moves[form.name || "normal"] = formMoves;
    }
    return moves;
}

/**
 *
 * @param formData FormData object to get the moves from
 * @param key key of object to get moves from. E.g. eggMoves
 */
export function getFormMoves(formData: FormData, key: MoveKeys): string[] | LevelUpMovesData | undefined {
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
        if (match === null) logger.red(filename, "didn't match!");
        return match !== null;
    });
    return files;
}
