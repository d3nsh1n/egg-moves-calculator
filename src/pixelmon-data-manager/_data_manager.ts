import { performance } from "perf_hooks";
import { MOVE_KEYS, MoveLearnData, LearnMethodInfo } from "../lib/lib";
import chalk from "chalk";
import fs from "fs-extra";
import { EggGroups, FormData, LevelUpMoveData, MoveKeys, PokemonData } from "./pixelmonlib";
import { Logger } from "../lib/logger";
import is from "@sindresorhus/is";
import { Pokemon } from "../lib/pokemon";
import { extractLearnMethodInfoBase, getParentsForMove } from "./pixelmonutils";
import { MoveRegistry } from "./_move_registry";
import { EggGroupRegistry } from "./_egg_group_registry";
import { PokemonRegistry } from "./_pokemon_registry";
import { mapReplacer } from "../lib/utils";

const { log, warn, error } = new Logger(true, "DataManager", "#23584F");

export const MISMOVES: string[] = [];
export const MISFORMS: string[] = [];

//* =========================== * FILEPATHS * ===========================
const dataDir = "data";
const rawDataDir = `${dataDir}/species`;
const dataOutDir = `${dataDir}/out`;
const pokemonRegistry = `${dataOutDir}/PokemonRegistry.json`;
const moveRegistry = `${dataOutDir}/MoveRegistry.json`;
const eggGroupsPath = `${dataOutDir}/EggGroups.json`;
const evoLinesPath = `${dataOutDir}/EvoLines.json`;
//* =========================== * * * ===========================

export class DataManager {
    public static PokemonRegistry: PokemonRegistry;
    public static MoveRegistry: MoveRegistry;
    public static EggGroupRegistry: EggGroupRegistry;

    //* =========================== Constructor ===========================
    constructor(private forceLoad: boolean = false, private skipWrite: boolean = false) {
        let startTime = performance.now();

        // Load POKEMON
        const filenames = DataManager.getDataFilenamesFromDir(rawDataDir);
        const pokemonData = DataManager._loadDataFromFiles(filenames);

        //// Load files if they exist, initialize with defaults if they don't.
        //// DataManager.EvoLines = DataManager.LoadOrCreate(evoLinesPath, DataManager._generateEvoLines, forceLoad);
        //// DataManager.EggGroupRegistry = DataManager.LoadOrCreate(eggGroupsPath, DataManager._generateEggGroups, forceLoad);
        //// DataManager.MoveRegistry = DataManager.LoadOrCreate(learnableMovesPath, DataManager._generateMoveRegistry, forceLoad);
        //todo Serialize and save Registry
        DataManager.PokemonRegistry = new PokemonRegistry(pokemonData);
        log("DONE: PokemonRegistry");
        // fs.writeFileSync("data/PokemonRegistry.json", JSON.stringify(DataManager.PokemonRegistry, mapReplacer, 4));
        DataManager.PokemonRegistry.generateEvoLines();
        log("DONE: EvoLines");
        DataManager.EggGroupRegistry = new EggGroupRegistry(DataManager.PokemonRegistry);
        log("DONE: EggGroups");
        DataManager.MoveRegistry = new MoveRegistry(DataManager.PokemonRegistry);
        log("DONE: MoveRegistry");
        console.log("Pokemon:", DataManager.PokemonRegistry.all().size);
        DataManager.MoveRegistry.populateEggMoves();

        log(chalk.bgGreen(`DataLoader took ${(performance.now() - startTime).toFixed(0)} milliseconds to initialize.`));

        if (!skipWrite) {
            DataManager._writeLibrariesToFiles();
        }
    }

    //* =========================== Methods ===========================
    /**  Load data from the JSON files and store them as Pokemon in DataManager */
    private static _loadDataFromFiles(filenames: string[]): Pokemon[] {
        log(`Loading ${filenames.length} files.`);
        const out: Pokemon[] = [];
        let startTime = performance.now();

        //* Iterate over every file
        for (const filename of filenames) {
            //* Read filedata
            const data = fs.readFileSync(`${rawDataDir}/${filename}`);
            const pokemonData: PokemonData = JSON.parse(data.toString());

            //* For each form
            for (const form of pokemonData.forms) {
                const pokemon: Pokemon = new Pokemon(pokemonData, form);
                out.push(pokemon);
                for (const move of form.moves?.levelUpMoves || []) {
                    if (move.level == 100 || move.level == "100") {
                        console.log(pokemonData.name, form.name, move.attacks);
                    }
                }
            }
        }
        log(chalk.bgGreenBright(`_loadDataFromFiles took ${(performance.now() - startTime).toFixed(0)} milliseconds to initialize.`));
        return out;
    }

    /** Write Files */
    static _writeLibrariesToFiles() {
        const startTime = performance.now();
        fs.emptyDirSync(dataOutDir);
        fs.writeFileSync(pokemonRegistry, JSON.stringify(DataManager.PokemonRegistry, mapReplacer, 4));
        fs.writeFileSync(eggGroupsPath, JSON.stringify(DataManager.EggGroupRegistry, mapReplacer, 4));
        fs.writeFileSync(moveRegistry, JSON.stringify(DataManager.MoveRegistry, mapReplacer, 4));
        fs.writeFileSync(evoLinesPath, JSON.stringify(DataManager.PokemonRegistry.EvoLines, mapReplacer, 4));
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
}
