import chalk from "chalk";
import { EggGroups, FormData, isPokemonData, LevelUpMoveData, MoveKeys, MovesData, PokemonData } from "../lib/pokemonlib";
import { MoveSources, EggGroupsLib, InheritableMoves, MOVE_KEYS, INHERITABLE_KEYS, Forms, AllPokemonData, LearnMethodInfo, MoveParents } from "../lib/lib";
import { DataLoader } from "./dataLoader";
import is from "@sindresorhus/is";
import { performance } from "perf_hooks";
import fs from "fs-extra";

export class DataLib {
    /** Pokemon: Move: Movedata where Movedata includes parents and other info
     * Lists every Pokemon and all the possible moves it can inherit through breeding (Egg moves + Tutors by default)
     */
    public static INHERITABLE_MOVES: InheritableMoves = {};

    /** EggGroup: ListOfPokemonInIt
     * List of Egg Groups and arrays of Pokemon in them
     */
    public static EGG_GROUPS_LIB: EggGroupsLib = {};

    /** Move: PokemonThatLearnIt: LearnMethods
     * Lists every move and how each Pokemon learns it
     */
    public static MOVES_SOURCES: MoveSources = {};
    public static MOVE_PARENTS: MoveSources = {};

    /** Fullname: FormData
     * Storage of each form loaded
     */
    public static FORMS: Forms = {};

    /** SpeciesName: PokemonData
     * Storage of all PokemonData loaded (parsed JSON files)
     */
    public static POKEMON_DATA: AllPokemonData = {};

    //! # === CONTRUCTOR === #
    public static init(forceLoad = false) {
        let startTime = performance.now();

        //! Move sources
        if (is.emptyObject(this.MOVES_SOURCES) || forceLoad) {
            this.__initMoveSources();
        }

        //! Move parents
        if (is.emptyObject(this.MOVE_PARENTS) || forceLoad) {
            this._initMoveParents();
        }

        //! Inheritable moves
        if (is.emptyObject(this.INHERITABLE_MOVES) || forceLoad) {
            this.__initInheritableMoves();
        }

        console.log(chalk.bgGreen(`DataLib took ${(performance.now() - startTime).toFixed(0)} milliseconds to initialize.`));
    }

    private static __initMoveSources() {
        for (const pokemon in this.POKEMON_DATA) {
            const pokemonData: PokemonData = this.POKEMON_DATA[pokemon];
            // Default forms debugging
            // if (!this.FORMS.hasOwnProperty(pokemonData.name) && !pokemonData.forms[0].eggGroups?.includes(EggGroups.Undiscovered)) console.log(chalk.red(">>", pokemonData.name), pokemonData.defaultForms);
            for (const formData of pokemonData.forms) {
                const fullName = formData.name === "" ? pokemonData.name : `${pokemonData.name}-${formData.name}`;

                DataLib.addMoveSources(fullName, formData);
            }
        }
    }

    private static _initMoveParents() {
        for (const move in this.MOVES_SOURCES) {
            //* Initialize move if it doesn't exist
            if (!this.MOVE_PARENTS.hasOwnProperty(move)) this.MOVE_PARENTS[move] = {};

            for (const parent in this.MOVES_SOURCES[move]) {
                // Alias, deepCopy
                const learnMethodInfo = JSON.parse(JSON.stringify(this.MOVES_SOURCES[move][parent])) as LearnMethodInfo;

                // Make an array of elements that are not "eggMoves", and if that array has elements (length > 0), there are methods other than eggMove
                const methodsOtherThanEM = learnMethodInfo.learnMethods.filter((method) => method !== "eggMoves");
                const isOnlyEggMove = methodsOtherThanEM.length === 0;

                //* Any method has priority over Egg Moves
                //todo Not true, consider existing breeds
                if (!isOnlyEggMove) {
                    const finalLearnInfo: LearnMethodInfo = { learnMethods: methodsOtherThanEM };

                    // Grab level info if levelUpMove
                    if (methodsOtherThanEM.includes("levelUpMoves")) {
                        finalLearnInfo.level = this.MOVES_SOURCES[move][parent].level;
                    }

                    this.MOVE_PARENTS[move][parent] = finalLearnInfo;
                    continue;
                }

                //* Only Egg Move
                // do stuff
                this.MOVE_PARENTS[move][parent] = learnMethodInfo;
            }
        }

        //! Second iteration for Egg Moves
        for (const move in this.MOVE_PARENTS) {
            const pokemonThatLearnMove = Object.keys(this.MOVE_PARENTS[move]);
            for (const pokemon of pokemonThatLearnMove) {
                const learnMethodInfo: LearnMethodInfo = this.MOVE_PARENTS[move][pokemon];
                if (learnMethodInfo.learnMethods.includes("eggMoves")) {
                    learnMethodInfo.parents = JSON.parse(JSON.stringify(this.getParents(pokemon, move, ["levelUpMoves"])));
                }
            }
        }
    }

    private static __initInheritableMoves() {
        for (const pokemon in this.POKEMON_DATA) {
            const pokemonData: PokemonData = this.POKEMON_DATA[pokemon];
            for (const formData of pokemonData.forms) {
                const fullName = formData.name === "" ? pokemonData.name : `${pokemonData.name}-${formData.name}`;
                DataLib.addInheritableMoves(fullName, formData);
            }
        }
    }

    //! INHERITABLE_MOVES
    public static addInheritableMoves(fullName: string, form: FormData) {
        //* Skip or initialize
        if (DataLib.INHERITABLE_MOVES.hasOwnProperty(fullName)) return;
        else DataLib.INHERITABLE_MOVES[fullName] = {};

        // Alias for readability
        const inheritableMoves = DataLib.INHERITABLE_MOVES[fullName];

        //* Get list of possible inheritable moves and iterate it
        const listOfInheritableMoves = this.getInheritableMoves(form);
        for (const move of listOfInheritableMoves) {
            //! Debug
            if (inheritableMoves.hasOwnProperty(move)) console.log(chalk.red(`MOVE ${move} ALREADY EXISTS? CHECK ${fullName}`));

            // Alias
            const learnMethods = this.MOVE_PARENTS[move][fullName].learnMethods;

            // MOVE_PARENTS methods should either only be eggMoves, or others
            const isOnlyEggMove = learnMethods.includes("eggMoves");

            //* Any method has priority over Egg Moves
            //todo Not true, consider existing breeds
            if (!isOnlyEggMove) {
                //todo deepCopy this?
                inheritableMoves[move] = this.MOVE_PARENTS[move][fullName];
                continue;
            }

            //* # === Egg Move only === #

            // Initialize - No need to check, should always be here once per move
            inheritableMoves[move] = { learnMethods };

            //* Get list of all pokemon/parents that learn the move
            const pokemonThatLearnMove = Object.keys(this.MOVE_PARENTS[move]);
            for (const pokemon of pokemonThatLearnMove) {
                if (!this._parentIsValid(fullName, pokemon, "eggMoves")) continue;

                //* Get how the parents learn the move
                const plearnMethodInfo: LearnMethodInfo = this.MOVE_PARENTS[move][pokemon];

                let learnMethodInfo = this.INHERITABLE_MOVES[fullName][move];
                if (!learnMethodInfo.parents) learnMethodInfo.parents = {};
                learnMethodInfo.parents[pokemon] = plearnMethodInfo;
                //! If it stops working, remove learnMethodInfo, use fullpath, and assert (although it should be fine, it's an object, should grab ref)
            }
        }
    }

    /** Get a list of all moves the Pokemon (form) can possibly inherit from breeding. */
    private static getInheritableMoves(form: FormData, inheritableKeys = INHERITABLE_KEYS): string[] {
        const inheritableMoves: string[] = [];
        for (const key of inheritableKeys) {
            const moves = DataLib.getFormMoves(form, key);
            if (!moves) continue;

            if (is.array<string>(moves, is.string)) {
                inheritableMoves.push(...moves);
            } else {
                moves.forEach((levelUpMoveData) => inheritableMoves.push(...levelUpMoveData.attacks));
            }
        }
        const unique = [...new Set(inheritableMoves)];
        return unique;
    }

    //! EGG_GROUPS
    public static addEggGroupsToLib(fullName: string, form: FormData) {
        //* Forms don't have different egg groups, but we need to store them for each form
        const eggGroups = form.eggGroups;
        if (!eggGroups) return;
        for (const group of eggGroups) {
            if (!DataLib.EGG_GROUPS_LIB.hasOwnProperty(group)) DataLib.EGG_GROUPS_LIB[group] = [];
            if (DataLib.EGG_GROUPS_LIB[group]!.includes(fullName)) return;
            DataLib.EGG_GROUPS_LIB[group]!.push(fullName);
        }
    }

    //! MOVE_SOURCES
    public static addMoveSources(fullName: string, form: FormData) {
        //* Iterate over each possible method (json key) of obtaining a move
        for (const method of MOVE_KEYS) {
            const moves = DataLib.getFormMoves(form, method as MoveKeys);

            //* If there are moves
            if (!moves) continue;

            //* Add each move to sources
            for (const move of moves) {
                DataLib._addMoveSource(fullName, method, move);
            }
        }
    }

    private static _addMoveSource(pokemonName: string, method: MoveKeys, moveData: string | LevelUpMoveData) {
        const moves = typeof moveData === "string" ? [moveData] : moveData.attacks;
        for (const move of moves) {
            // Alias for readability
            const sources = this.MOVES_SOURCES;

            //* Initialize move if it doesn't exist
            if (!sources.hasOwnProperty(move)) sources[move] = {};

            //* Initialize parent for move if it doesn't exist
            if (!sources[move].hasOwnProperty(pokemonName)) sources[move][pokemonName] = { learnMethods: [] };

            //* Add learn method
            const parentLearnMethods = sources[move][pokemonName].learnMethods;
            if (!parentLearnMethods.includes(method)) parentLearnMethods.push(method);
            if (method === "levelUpMoves") sources[move][pokemonName].level = (<LevelUpMoveData>moveData).level;
        }
    }

    //! POKEMON_DATA
    public static addPokemonData(pokemonData: PokemonData) {
        this.POKEMON_DATA[pokemonData.name] = pokemonData;
    }

    //! FORMS
    public static addForm(fullName: string, form: FormData) {
        this.FORMS[fullName] = form;
    }

    //! Helpers
    private static _parentIsValid(baseFullName: string, parentFullName: string, method: MoveKeys): boolean {
        // console.log(chalk.magenta("Checking potential parent", parentFullName, "for", baseFullName, method));

        //* If same species, return
        if (baseFullName === parentFullName) return false;

        //* Check if they share an Egg Group
        if (!this.shareEggGroup(baseFullName, parentFullName)) return false;

        const baseFormData: FormData = this.FORMS[baseFullName];
        const parentFormData: FormData = this.FORMS[parentFullName];

        //* If parent can't be male, return
        if (parentFormData.malePercentage === 0) return false;

        //* Don't include Egg Moves of same evo line
        if (this.isSameEvoLine(baseFullName, parentFullName) && method === "eggMoves") return false;
        return true;
    }

    public static shareEggGroup(fullName1: string, fullName2: string): boolean {
        for (const group in DataLib.EGG_GROUPS_LIB) {
            const listOfPokemonInGroup = DataLib.EGG_GROUPS_LIB[group as keyof EggGroupsLib];
            if (!listOfPokemonInGroup) throw console.log(chalk.red("!ERR: Could not read list of Pokemon in group", group));
            if (listOfPokemonInGroup.includes(fullName1) && listOfPokemonInGroup.includes(fullName2)) return true;
        }
        return false;
    }

    public static getDefaultForm(pokemonName: string): FormData {
        const defaultForm = this.POKEMON_DATA[pokemonName].defaultForms[0];
        const fullName = defaultForm === "" ? pokemonName : `${pokemonName}-${defaultForm}`;

        if (fullName !== pokemonName) console.log(chalk.yellow(`WARN: Differently named default form: ${defaultForm}`));
        if (this.POKEMON_DATA[pokemonName].defaultForms.length > 1) console.log(chalk.yellow(`WARN: Multiple default forms detected for ${pokemonName}.`));

        return this.FORMS[fullName];
    }

    /**
     *
     * @param formData FormData object to get the moves from
     * @param key key of object to get moves from. E.g. eggMoves
     */
    public static getFormMoves(formData: FormData, key: MoveKeys): string[] | LevelUpMoveData[] | undefined {
        // console.log("Grabbing", key, "from", formData);
        return formData.moves?.[key];
    }

    public static isSameEvoLine(fullName1: string, fullName2: string) {
        if (fullName1 === fullName2) return true;

        //* Build `line`s as preevos + current
        const line1: string[] = [...(DataLib.FORMS[fullName1].preEvolutions || []), fullName1];
        const line2: string[] = [...(DataLib.FORMS[fullName2].preEvolutions || []), fullName2];
        console.log(line1);
        console.log(line2);

        //* Return whether or not the 2 lines share a stage
        return line1.some((stage) => line2.includes(stage));
    }

    public static getParents(fullName: string, move: string, _methodsToInclude: MoveKeys[] = ["eggMoves", "levelUpMoves", "tutorMoves", "transferMoves"], deep = false) {
        const parents: MoveParents = {};
        //* Get list of Pokemon that learn the move
        const listOfParents = Object.keys(this.MOVES_SOURCES[move]);

        //* For each possible parent, store parent and its way of learning the move
        for (const parentName of listOfParents) {
            // Alias
            const storedLearnInfo = this.MOVES_SOURCES[move][parentName];

            // Filter out methods not provided by method call
            const validMethods = storedLearnInfo.learnMethods.filter((method) => _methodsToInclude.includes(method));
            if (validMethods.length === 0) continue;

            // Filter out methods that can't be used to inherit move from parent
            const finalValidMethods = validMethods.filter((method) => this._parentIsValid(fullName, parentName, method));
            if (finalValidMethods.length === 0) continue;

            // Store a deep copy of the MOVE_SOURCES sub-object
            parents[parentName] = JSON.parse(JSON.stringify(this.MOVES_SOURCES[move][parentName]));
        }
        // Return deepcopy of object, to get rid of references to MOVE_SOURCES, and avoid circular objects
        const deepCopy = JSON.parse(JSON.stringify(parents));
        return deepCopy;
    }

    public static forEachPokemon(callback: (pokemonData: PokemonData) => void) {
        for (const pokemon in DataLib.POKEMON_DATA) {
            callback(this.POKEMON_DATA[pokemon]);
        }
    }
}
