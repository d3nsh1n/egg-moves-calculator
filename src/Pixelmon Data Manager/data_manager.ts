import { performance } from "perf_hooks";
import { PokemonLib, EggGroupsLib, LearnableMovesLib, MOVE_KEYS, EvoLinesLib, MoveLearnData, LearnMethodInfo, FormIndexLib } from "../lib";
import chalk from "chalk";
import fs from "fs-extra";
import { EggGroups, FormData, LevelUpMoveData, MoveKeys, PokemonData } from "./pixelmonlib";
import { getMoveUsage } from "../Smogon Data Collection/smogon_stats";
import ky from "ky-universal";
import { error, unboundLog } from "../logger";
import is from "@sindresorhus/is";
import { Pokemon } from "../pokemon";
import { getMoveLearnData, getParentsForMove } from "./pixelmonutils";

const __CONTEXT__ = "DataManager";
const LOG = true;
const log = (...data: any) => unboundLog(LOG, __CONTEXT__, "#1232AA", ...data);

export const MISMOVES: string[] = [];
export const MISFORMS: string[] = [];

const dataDir = "data";
const rawDataDir = `${dataDir}/species`;

const dataOutDir = `${dataDir}/out`;
const learnableMovesPath = `${dataOutDir}/learnable_moves.json`;
const eggGroupsPath = `${dataOutDir}/egg_groups.json`;
const evoLinesPath = `${dataOutDir}/evo_lines.json`;

export class DataManager {
    public static POKEMON: PokemonLib = {};
    public static FORM_INDEX: FormIndexLib = {};

    /** Pokemon: Move: LearnMethodInfo
     * Lists every Pokemon and all the possible moves it can learn
     */
    public static LEARNABLE_MOVES: LearnableMovesLib = {};

    /** EggGroup: ListOfPokemonInIt
     * List of Egg Groups and arrays of Pokemon in them
     */
    public static EGG_GROUPS: EggGroupsLib = {};

    /** FullName: Pokemon
     * Storage of all PokemonData loaded (parsed JSON files)
     */

    public static EVO_LINES: EvoLinesLib = {};

    constructor(private forceLoad: boolean = false, private skipWrite: boolean = false) {
        let startTime = performance.now();

        //* Load POKEMON
        const filenames = DataManager.getDataFilenamesFromDir(rawDataDir);
        DataManager._loadDataFromFiles(filenames);

        //* Load files if they exist, initialize with defaults if they don't.
        DataManager.EGG_GROUPS = DataManager.LoadOrCreate(eggGroupsPath, DataManager._generateEggGroups, forceLoad);
        DataManager.EVO_LINES = DataManager.LoadOrCreate(evoLinesPath, DataManager._generateEvolLines, forceLoad);
        DataManager.LEARNABLE_MOVES = DataManager.LoadOrCreate(learnableMovesPath, DataManager._generateLearnableMoves, forceLoad);

        log(chalk.bgGreen(`DataLoader took ${(performance.now() - startTime).toFixed(0)} milliseconds to initialize.`));

        if (!skipWrite) {
            DataManager._writeLibrariesToFiles();
        }
    }

    //! Constructor Methods
    //#region Constructor Methods

    /**  Load data from the JSON files and store them as Pokemon in DataManager.POKEMON */
    private static _loadDataFromFiles(filenames: string[]) {
        log(`Loading ${filenames.length} files.`);
        let startTime = performance.now();

        //* Iterate over every file
        for (const filename of filenames) {
            //* Read filedata
            const data = fs.readFileSync(`${rawDataDir}/${filename}`);
            const pokemonData: PokemonData = JSON.parse(data.toString());

            //* For each form
            for (const form of pokemonData.forms) {
                const pokemon: Pokemon = new Pokemon(pokemonData, form);

                // Store Pokemon data
                DataManager.POKEMON[pokemon.toString()] = pokemon;

                // Register form in the index
                DataManager.FORM_INDEX[pokemon.name] ||= [];
                DataManager.FORM_INDEX[pokemon.name].push(pokemon.form);
            }
        }
        log(chalk.bgGreenBright(`_loadDataFromFiles took ${(performance.now() - startTime).toFixed(0)} milliseconds to initialize.`));
    }

    private static _generateEggGroups(): EggGroupsLib {
        const eggGroupsLib: EggGroupsLib = {};
        const pokemonLib = DataManager.POKEMON;

        for (const pokemonName in pokemonLib) {
            //* Forms don't have different egg groups, but we need to store them for each form
            const pokemon = pokemonLib[pokemonName];
            if (is.undefined(pokemon.eggGroups)) continue;

            for (const group of pokemon.eggGroups) {
                eggGroupsLib[group] ||= [];
                if (eggGroupsLib[group]!.includes(pokemonName)) continue;
                eggGroupsLib[group]!.push(pokemonName);
            }
        }

        return eggGroupsLib;
    }

    private static _generateEvolLines(): EvoLinesLib {
        const evoLinesLib: EvoLinesLib = {};
        const pokemonLib = DataManager.POKEMON;

        // Establish evo lines
        for (const pokemonName in pokemonLib) {
            const pokemon = pokemonLib[pokemonName];
            if (pokemon.isBasic()) {
                evoLinesLib[pokemonName] = [];
            }
        }

        // Populate evo lines
        for (const pokemonName in pokemonLib) {
            const pokemon = pokemonLib[pokemonName];
            const basic = pokemon.getBasic();
            // log(chalk.blue(`Adding ${form} to ${basic}`));
            if (is.undefined(evoLinesLib[basic.toString()])) {
                log(error(`No evo line ${basic} exists for ${pokemonName}.`));
                continue;
            }

            evoLinesLib[basic.toString()].push(pokemonName);
        }

        return evoLinesLib;
    }

    private static _generateLearnableMoves(): LearnableMovesLib {
        const learnableMoves: LearnableMovesLib = {};
        const pokemonLib = DataManager.POKEMON;

        //* Initial Pass
        for (const pokemonName in pokemonLib) {
            const pokemon: Pokemon = pokemonLib[pokemonName];

            learnableMoves[pokemonName] ||= {};

            for (const learnMethod in pokemon.moves) {
                for (const m of pokemon.moves[learnMethod as MoveKeys]) {
                    // Extract Move Learn Data - Uses a unified format for moves, and returns array in case of multiple moves from the same level in LevelUpMoveData
                    const moveLearnData: MoveLearnData[] = getMoveLearnData(m, learnMethod as MoveKeys);
                    for (const move of moveLearnData) {
                        // Alias and init
                        // let moveLearnInfo = result[form][move.name];
                        learnableMoves[pokemonName][move.name] ||= { learnMethods: [] };

                        learnableMoves[pokemonName][move.name].learnMethods.push(move.method);
                        if (move.level !== undefined) learnableMoves[pokemonName][move.name].level = move.level;
                    }
                }
            }
        }

        // "Hacky" save, second pass requires canLearn(), which requires a filled LEARNABLE_MOVES
        DataManager.LEARNABLE_MOVES = learnableMoves;

        //* Second pass, for egg moves
        //? "Needs" to be second pass for performance reasons, wont have to go looking in data.moves again
        for (const pokemonName in learnableMoves) {
            for (const move in learnableMoves[pokemonName]) {
                // Alias
                const learnMethodInfo: LearnMethodInfo = learnableMoves[pokemonName][move];

                if (learnMethodInfo.learnMethods.includes("eggMoves")) {
                    learnMethodInfo.parents = getParentsForMove(DataManager.POKEMON[pokemonName], move, "eggMoves");
                }
            }
        }

        return learnableMoves;
    }

    /** Write Files */
    static _writeLibrariesToFiles() {
        const startTime = performance.now();
        fs.writeFileSync(eggGroupsPath, JSON.stringify(DataManager.EGG_GROUPS, null, 4));
        fs.writeFileSync(learnableMovesPath, JSON.stringify(DataManager.LEARNABLE_MOVES, null, 4));
        fs.writeFileSync(evoLinesPath, JSON.stringify(DataManager.EVO_LINES, null, 4));
        log(chalk.bgGreen(`DataLoader took ${(performance.now() - startTime).toFixed(0)} milliseconds to write files.`));
    }

    /**
     * Attempt to load file specified by `filepath`, and return `defaultValue` or `undefined` if file is missing.
     */
    public static LoadOrCreate<T>(filePath: string, defaultValueGenerator: () => T, forceLoad = false): T {
        if (forceLoad) {
            return defaultValueGenerator();
        } else {
            if (fs.existsSync(filePath)) {
                return JSON.parse(fs.readFileSync(filePath).toString());
            } else {
                return defaultValueGenerator();
            }
        }
    }

    /**
     * Read the filenames in `rawDataDir` and return a list of the ones matching the RegExp.
     * @param {string} rawDataDir - The directory to search.
     * @param {RegExp} [regexp= /([0-9]*)_(.*)\.json/] - The RegExp to match. Default: `(num)_(pokemon).json`
     */
    public static getDataFilenamesFromDir(rawDataDir: string, regexp: RegExp = /([0-9]*)_(.*)\.json/) {
        const files = fs.readdirSync(rawDataDir).filter((filename) => {
            //* Check if the filename matches the JSON files format
            const match = regexp.exec(filename);
            if (match === null) log(chalk.red(filename, "didn't match!"));
            return match !== null;
        });
        return files;
    }
    //#endregion

    //! Methods
    //#region Methods
    public static getPokemonInEggGroups(...groups: string[]): string[] {
        const out: string[] = [];
        const eggGroupLib = DataManager.EGG_GROUPS;

        for (const group of groups) {
            if (!Object.values(EggGroups).includes(group as EggGroups)) {
                console.error(chalk.red(`Incorrect Egg Group provided: ${group}.`));
                continue;
            }
            out.push(...eggGroupLib[group as EggGroups]!);
        }
        return [...new Set(out)];
    }

    //#endregion
}
