import { performance } from "perf_hooks";
import { MOVE_KEYS, MoveLearnData, LearnMethodInfo } from "../lib/lib";
import chalk from "chalk";
import fs from "fs-extra";
import { EggGroups, FormData, LevelUpMoveData, MoveKeys, PokemonData } from "./pixelmonlib";
import { getMoveUsage } from "../smogon-data-collection/smogon_stats";
import ky from "ky-universal";
import { error, unboundLog } from "../lib/logger";
import is from "@sindresorhus/is";
import { Pokemon } from "../lib/pokemon";
import { extractLearnMethodInfoBase, getParentsForMove } from "./pixelmonutils";
import { MoveRegistry } from "./move_registry";

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
    //* =========================== Static Members ===========================
    public static Pokemon: Map<string, Pokemon> = new Map();
    public static FormIndex: Map<string, string[]> = new Map();

    /** Pokemon: Move: LearnMethodInfo
     * Lists every Pokemon and all the possible moves it can learn
     */
    public static MoveRegistry: MoveRegistry;

    /** EggGroup: ListOfPokemonInIt
     * List of Egg Groups and arrays of Pokemon in them
     */
    public static EggGroups: Map<EggGroups, string[]>;

    /** FullName: Pokemon
     * Storage of all PokemonData loaded (parsed JSON files)
     */

    public static EvoLines: Map<string, string[]>;

    //* =========================== Constructor ===========================
    constructor(private forceLoad: boolean = false, private skipWrite: boolean = false) {
        let startTime = performance.now();

        //* Load POKEMON
        const filenames = DataManager.getDataFilenamesFromDir(rawDataDir);
        DataManager._loadDataFromFiles(filenames);

        //* Load files if they exist, initialize with defaults if they don't.
        DataManager.EggGroups = DataManager.LoadOrCreate(eggGroupsPath, DataManager._generateEggGroups, forceLoad);
        DataManager.EvoLines = DataManager.LoadOrCreate(evoLinesPath, DataManager._generateEvoLines, forceLoad);

        //todo Serialize and save Registry
        // DataManager.MoveRegistry = DataManager.LoadOrCreate(learnableMovesPath, DataManager._generateMoveRegistry, forceLoad);
        DataManager.MoveRegistry = DataManager._generateMoveRegistry();

        log(chalk.bgGreen(`DataLoader took ${(performance.now() - startTime).toFixed(0)} milliseconds to initialize.`));

        if (!skipWrite) {
            DataManager._writeLibrariesToFiles();
        }
    }

    //* =========================== Constructor Methods ===========================
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
                DataManager.Pokemon.set(pokemon.toString(), pokemon);

                // Register form in the index
                if (!DataManager.FormIndex.has(pokemon.name)) DataManager.FormIndex.set(pokemon.name, []);
                DataManager.FormIndex.get(pokemon.name)!.push(pokemon.form);
            }
        }
        log(chalk.bgGreenBright(`_loadDataFromFiles took ${(performance.now() - startTime).toFixed(0)} milliseconds to initialize.`));
    }

    private static _generateEggGroups(): Map<EggGroups, string[]> {
        const out: Map<EggGroups, string[]> = new Map();
        const pokemonLib = DataManager.Pokemon;

        for (const [pokemonName, pokemon] of pokemonLib) {
            // Forms don't have different egg groups, but we need to store them for each form
            if (is.undefined(pokemon.eggGroups)) continue;

            for (const group of pokemon.eggGroups) {
                const groupMembers = out.getOrCreate(group, []);
                if (groupMembers.includes(pokemonName)) continue;
                groupMembers.push(pokemonName);
            }
        }

        return out;
    }

    private static _generateEvoLines(): Map<string, string[]> {
        const out: Map<string, string[]> = new Map();
        const pokemonLib = DataManager.Pokemon;

        // Establish evo lines
        for (const [pokemonName, pokemon] of pokemonLib) {
            if (pokemon.isBasic()) {
                out.set(pokemonName, []);
            }
        }

        // Populate evo lines
        for (const [pokemonName, pokemon] of pokemonLib) {
            const basic = pokemon.getBasic();
            // log(chalk.blue(`Adding ${form} to ${basic}`));
            const lineMembers = out.get(basic.toString());
            if (is.undefined(lineMembers)) {
                log(error(`No evo line ${basic} exists for ${pokemonName}.`));
                continue;
            }
            lineMembers.push(pokemonName);
        }

        return out;
    }

    private static _generateMoveRegistry(): MoveRegistry {
        const _registry = new MoveRegistry();
        // const learnableMoves: Map<string, { [move: string]: LearnMethodInfo }> = new Map();
        // const pokemonLib = DataManager.Pokemon;

        //* Initial Pass
        for (const [pokemonName, pokemon] of DataManager.Pokemon) {
            for (const learnMethod in pokemon.moves) {
                const movesLearnInfo = pokemon.getMovesLearnInfo(learnMethod as MoveKeys);
                for (const [move, learnInfo] of movesLearnInfo) {
                    if (learnInfo.learnMethods.includes("eggMoves")) {
                        learnInfo.parents = getParentsForMove(pokemon, move, "eggMoves");
                    }
                    _registry.addMove(pokemonName, move, learnInfo);
                    // learnableMoves[pokemonName][move.name] ||= { learnMethods: [] };

                    // learnableMoves[pokemonName][move.name].learnMethods.push(move.method);
                    // if (move.level !== undefined) learnableMoves[pokemonName][move.name].level = move.level;
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
                    learnMethodInfo.parents = getParentsForMove(DataManager.Pokemon[pokemonName], move, "eggMoves");
                }
            }
        }

        return learnableMoves;
    }

    /** Write Files */
    static _writeLibrariesToFiles() {
        const startTime = performance.now();
        fs.writeFileSync(eggGroupsPath, JSON.stringify(DataManager.EggGroups, null, 4));
        fs.writeFileSync(learnableMovesPath, JSON.stringify(DataManager.LEARNABLE_MOVES, null, 4));
        fs.writeFileSync(evoLinesPath, JSON.stringify(DataManager.EvoLines, null, 4));
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
    public static getPokemonInEggGroups(...groups: EggGroups[]): string[] {
        const out: string[] = [];
        const eggGroupLib = DataManager.EggGroups;

        for (const group of groups) {
            if (!Object.values(EggGroups).includes(group)) {
                console.error(chalk.red(`Incorrect Egg Group provided: ${group}.`));
                continue;
            }
            out.push(...(eggGroupLib.get(group) || []));
        }
        return [...new Set(out)];
    }

    //#endregion
}
