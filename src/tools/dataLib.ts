import chalk from "chalk";
import { EggGroups, FormData, isPokemonData, LevelUpMoveData, MoveKeys, MovesData, PokemonData } from "../lib/pokemonlib";
import { MoveSources, EggGroupsLib, InheritableMoves, MOVE_KEYS, INHERITABLE_KEYS, Forms, AllPokemonData, LearnMethodInfo, MoveParents } from "../lib/lib";
import { DataLoader } from "./dataLoader";
import is from "@sindresorhus/is";
import { performance } from "perf_hooks";
import fs from "fs-extra";
import { getFormMoves, getParents, parentIsValid } from "../lib/utils";

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

    /** The same as Move_Sources, but with Egg Moves being removed if they can be onbtained otherwise.
     * e.g. [levelUpMoves, eggMoves] in Move_Sources becomes [levelUpMoves]
     */
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
                    learnMethodInfo.parents = JSON.parse(JSON.stringify(getParents(pokemon, move, ["levelUpMoves"])));
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
                if (!parentIsValid(fullName, pokemon, "eggMoves")) continue;

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
            const moves = getFormMoves(form, key);
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
            const moves = getFormMoves(form, method as MoveKeys);

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
}
