import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { logger } from "./logger";
import { EggGroups, isPokemonData, MovesData, PokemonData } from "../lib/datalib";
import { Beneficiaries, FormMoves, Inheritors, SpeciesMoves } from "../lib/lib";
import is from "@sindresorhus/is";

const directoryPath = "data/species";
const eggMovesPath = "data/egg_moves.json";
const levelupMovesPath = "data/levelup_moves.json";
const eggGroupsPath = "data/egg_groups.json";
const beneficiariesPath = "data/beneficiaries.json";
const inheritorsPath = "data/inheritors.json";

const regexp = /([0-9]*)_(.*)\.json/;

let EGG_MOVES: SpeciesMoves = {};
let LEVELUP_MOVES: SpeciesMoves = {};
let EGG_GROUPS: { [group in EggGroups]?: string[] } = {};
let BENEFICIARIES: Beneficiaries = {};
const INHERITANCE_METHODS = ["levelUpMoves", "tutorMoves", "eggMoves", "transferMoves"];
let INHERITORS: Inheritors = {};

async function GenerateFiles(): Promise<void> {
    const generateEggMoves = !fs.existsSync(eggMovesPath);
    const generateLevelupMoves = !fs.existsSync(levelupMovesPath);
    const generateEggGroups = !fs.existsSync(eggGroupsPath);
    const generateBeneficiaries = !fs.existsSync(beneficiariesPath);
    const generateInheritors = !fs.existsSync(inheritorsPath);

    return new Promise((resolve) => {
        //* Read all files in directoryPath
        fs.readdir(directoryPath, async (err, files) => {
            if (err) return console.log("Unable to scan directory: " + err);

            //* Iterate over every file
            // files.forEach(async (file) => {
            for (const file of files) {
                //* Check if the filename matches the JSON files format
                const match = regexp.exec(file);
                if (match === null) {
                    logger.red(file, "didn't match!");
                    continue;
                }

                //* Read the file
                const filePath = `${directoryPath}/${file}`;
                const pokemonData: PokemonData = JSON.parse(
                    await fs.readFile(filePath, {
                        encoding: "utf-8",
                    })
                );
                // if (!isPokemonData(pokemonData)) throw console.error("Incorrect file format!");

                //* Get data
                if (pokemonData.dex % 100 === 0) console.log(pokemonData.dex);
                //! Egg Moves
                if (generateEggMoves) {
                    console.log("Egg moves");
                    const eggMoves = getMoves(pokemonData, "eggMoves");
                    EGG_MOVES[match[2]] = eggMoves;
                    logger.red("Done with ", file);
                } //todo REMOVE else EGG_MOVES = JSON.parse((await fs.readFile(eggMovesPath)).toString());

                //! Levelup Moves
                if (generateLevelupMoves) {
                    console.log("LU moves");
                    LEVELUP_MOVES[match[2]] = getMoves(pokemonData, "levelUpMoves");
                    logger.red("Done with ", file);
                } //else LEVELUP_MOVES = JSON.parse((await fs.readFile(levelupMovesPath)).toString());

                //! Egg Groups
                if (generateEggGroups) {
                    console.log("EGs");
                    for (const form of pokemonData.forms) {
                        for (const i in form.eggGroups) {
                            const group = form.eggGroups[i];
                            if (!EGG_GROUPS.hasOwnProperty(group)) EGG_GROUPS[group] = [];
                            EGG_GROUPS[group]!.push(pokemonData.name);
                        }
                    }
                } //else EGG_GROUPS = JSON.parse((await fs.readFile(eggGroupsPath)).toString());

                //! Beneficiaries
                // For each move that a Pokemon can learn, store it along with the way(s) it's learned by
                if (generateBeneficiaries) {
                    console.log("Benef");
                    for (const form of pokemonData.forms) {
                        // Determine Pokemon name based on form (e.g. "Yamask" or "Yamask-Galar")
                        const name = form.name === "" ? pokemonData.name : `${pokemonData.name}-${form.name}`;
                        // Initialize key
                        BENEFICIARIES[name] = {};
                        // Iterate through every move, of every learn method
                        for (const learnMethod in form.moves) {
                            if (learnMethod === "levelUpMoves") {
                                for (const level of form.moves[learnMethod as keyof MovesData] as any[]) {
                                    for (const move of level.attacks) {
                                        // Initialize the array if it's the first time you're encountering this move
                                        // (A Pokemon can learn the same move through multiple ways)
                                        if (!BENEFICIARIES[name][move]) BENEFICIARIES[name][move] = { learnBy: [] };
                                        // Add the learn method to the list
                                        BENEFICIARIES[name][move].learnBy.push(learnMethod);
                                    }
                                }
                            } else {
                                for (const move of form.moves[learnMethod as keyof MovesData] as string[]) {
                                    // Initialize the array if it's the first time you're encountering this move
                                    // (A Pokemon can learn the same move through multiple ways)
                                    if (!BENEFICIARIES[name][move]) BENEFICIARIES[name][move] = { learnBy: [] };
                                    // Add the learn method to the list
                                    BENEFICIARIES[name][move].learnBy.push(learnMethod);
                                }
                            }
                        }
                    }
                } //else BENEFICIARIES = JSON.parse((await fs.readFile(beneficiariesPath)).toString());

                //! Inheritors
                // console.log("Generating");
                if (generateInheritors) {
                    console.log("Inher");
                    for (const form of pokemonData.forms) {
                        // Determine Pokemon name based on form (e.g. "Yamask" or "Yamask-Galar")
                        const name = form.name === "" ? pokemonData.name : `${pokemonData.name}-${form.name}`;
                        // Initialize key
                        INHERITORS[name] = {};

                        //* Get a list of every Inheritable move
                        const InheritableMoves: [string, string][] = [];
                        // Iterate through every move, of every inheritance method
                        for (const learnMethod of INHERITANCE_METHODS) {
                            if (learnMethod === "levelUpMoves") {
                                for (const level of form.moves[learnMethod as keyof MovesData] as any[]) {
                                    for (const move of level.attacks) {
                                        if (!InheritableMoves.includes([move, learnMethod])) InheritableMoves.push([move, learnMethod]);
                                    }
                                }
                            } else {
                                for (const move of form.moves[learnMethod as keyof MovesData] as string[]) {
                                    if (!InheritableMoves.includes([move, learnMethod])) InheritableMoves.push([move, learnMethod]);
                                }
                            }
                        }
                        //* For every inheritable move, see which Pokemon shares an Egg Group and can learn it
                        for (const inheritable in InheritableMoves) {
                            INHERITORS[name][inheritable[0]] = { inheritanceType: inheritable[1], beneficiaries: {} };
                            for (const eggGroup of form.eggGroups) {
                                //todo egg groups has pokemon names rather than names-forms
                                for (const potentialParent of EGG_GROUPS[eggGroup]!) {
                                    console.log(chalk.yellow(potentialParent, BENEFICIARIES[potentialParent], [inheritable[0]]));
                                    // if the potential parent learns the move
                                    if (BENEFICIARIES[potentialParent][inheritable[0]]) {
                                        // Store as Gastly: Toxic: Koffing: [LevelUp, Tm2]
                                        INHERITORS[name][inheritable[0]].beneficiaries[potentialParent] = { learnBy: BENEFICIARIES[potentialParent][inheritable[0]].learnBy };
                                    }
                                }
                            }
                        }
                    }
                }
            }
            if (generateEggMoves) fs.writeFile(eggMovesPath, JSON.stringify(EGG_MOVES, null, 4));
            if (generateLevelupMoves) fs.writeFile(levelupMovesPath, JSON.stringify(LEVELUP_MOVES, null, 4));
            if (generateEggGroups) fs.writeFile(eggGroupsPath, JSON.stringify(EGG_GROUPS, null, 4));
            if (generateBeneficiaries) fs.writeFile(beneficiariesPath, JSON.stringify(BENEFICIARIES, null, 4));
            if (generateInheritors) fs.writeFile(inheritorsPath, JSON.stringify(INHERITORS, null, 4));

            resolve();
        });
    });
}

export function getMoves(json: PokemonData, key: string): { [form: string]: string[] } {
    const moves: FormMoves = {};
    for (const form of json.forms) {
        const formMoves = form.moves?.[key as keyof MovesData];
        if (!is.array<string>(formMoves)) {
            console.log(chalk.yellow(form.name, "Moves are not a list of strings!"));
            continue;
        }
        moves[form.name || "normal"] = formMoves;
    }
    return moves;
}

await GenerateFiles();
console.log(Object.keys(INHERITORS).length);
