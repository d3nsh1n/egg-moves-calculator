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
        for (const pokemon in this.POKEMON_DATA) {
            const pokemonData: PokemonData = this.POKEMON_DATA[pokemon];
            for (const formData of pokemonData.forms) {
                const fullName = formData.name === "" ? pokemonData.name : `${pokemonData.name}-${formData.name}`;
                DataLib.addMoveSources(fullName, formData);
            }
        }

        //! Move sources parents for egg moves
        for (const move in this.MOVES_SOURCES) {
            const pokemonThatLearnMove = Object.keys(this.MOVES_SOURCES[move]);
            for (const pokemon of pokemonThatLearnMove) {
                const learnMethodInfo: LearnMethodInfo = this.MOVES_SOURCES[move][pokemon];
                if (learnMethodInfo.learnMethods.includes("eggMoves")) {
                    learnMethodInfo.parents = JSON.parse(JSON.stringify(this._getParents(pokemon, move, ["levelUpMoves"])));
                }
            }
        }

        //! Inheritable moves
        for (const pokemon in this.POKEMON_DATA) {
            const pokemonData: PokemonData = this.POKEMON_DATA[pokemon];
            for (const formData of pokemonData.forms) {
                const fullName = formData.name === "" ? pokemonData.name : `${pokemonData.name}-${formData.name}`;
                DataLib.addInheritableMoves(fullName, formData);
            }
        }

        console.log(chalk.bgGreen(`DataLib took ${(performance.now() - startTime).toFixed(0)} milliseconds to initialize.`));
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
            //* Initialize if first entry for move
            const learnMethods = this.MOVES_SOURCES[move][fullName].learnMethods;
            if (!inheritableMoves.hasOwnProperty(move)) inheritableMoves[move] = { learnMethods };

            //* Get how the Pokemon learns the move

            //* Get list of all pokemon that learn the move
            const pokemonThatLearnMove = Object.keys(this.MOVES_SOURCES[move]);
            for (const pokemon of pokemonThatLearnMove) {
                //* Get how the parents learn the move
                const learnMethodInfo: LearnMethodInfo = this.MOVES_SOURCES[move][pokemon];

                //* For each way the pokemon can learn the move, see if each parent is viable to pass it
                for (const method of learnMethods) {
                    if (this._parentIsValid(fullName, pokemon, method)) {
                        if (!this.INHERITABLE_MOVES[fullName][move].parents) this.INHERITABLE_MOVES[fullName][move].parents = {};
                        this.INHERITABLE_MOVES[fullName][move].parents[pokemon] = learnMethodInfo;
                    }
                }
            }
        }
    }

    /** Get a list of all moves the Pokemon (form) can possibly inherit from breeding. */
    private static getInheritableMoves(form: FormData): string[] {
        const inheritableMoves: string[] = [];
        for (const key of INHERITABLE_KEYS) {
            const moves = DataLib.getFormMoves(form, key);
            if (!moves) continue;

            if (is.array<string>(moves, is.string)) {
                inheritableMoves.push(...moves);
            } else {
                moves.forEach((levelUpMoveData) => inheritableMoves.push(...levelUpMoveData.attacks));
            }
        }
        return inheritableMoves;
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

    private static _getParents(fullName: string, move: string, _methodsToInclude: MoveKeys[] = ["eggMoves", "levelUpMoves", "tutorMoves", "transferMoves"], deep = false) {
        const parents: MoveParents = {};
        //* Get list of Pokemon that learn the move
        const listOfParents = Object.keys(this.MOVES_SOURCES[move]);

        //* For each possible parent, store parent and its way of learning the move
        for (const parentName of listOfParents) {
            const pLearnMethodInfo: LearnMethodInfo = this.MOVES_SOURCES[move][parentName];

            for (const method of pLearnMethodInfo.learnMethods) {
                if (!_methodsToInclude.includes(method)) continue;
                if (!this._parentIsValid(fullName, parentName, method)) continue;
                parents[parentName] = pLearnMethodInfo;
            }
        }
        return parents;
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

    public static getDefaultForm(fullName: string): FormData {
        const defaultForm = this.POKEMON_DATA[fullName].defaultForms[0];
        if (defaultForm !== fullName) console.log(chalk.yellow(`WARN: Differently named default form: ${defaultForm}`));
        if (this.POKEMON_DATA[fullName].defaultForms.length > 1) console.log(chalk.yellow(`WARN: Multiple default forms detected.`));

        return this.FORMS[`${fullName}-${defaultForm}`];
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

        //* Return whether or not the 2 lines share a stage
        return line1.some((stage) => line2.includes(stage));
    }

    public static getParents(fullName: string, move: string, deep = false): MoveParents {
        const _methodsToInclude: MoveKeys[] = ["eggMoves", "levelUpMoves"];
        const parents: MoveParents = {};
        //* Filter possible parents based on Egg Groups
        const listOfPokemonThatLearnMove = Object.keys(this.MOVES_SOURCES[move]);
        const listOfParents = listOfPokemonThatLearnMove.filter((p) => this.shareEggGroup(p, fullName));

        //* For each possible parent, store parent and its way of learning the move
        for (const parentName of listOfParents) {
            const learnedFrom = this.MOVES_SOURCES[move][parentName].learnMethods;

            for (const method of learnedFrom) {
                if (!_methodsToInclude.includes(method)) continue;
                if (!this._parentIsValid(fullName, parentName, method)) continue;
                parents[parentName] = this.MOVES_SOURCES[move][parentName];
            }
        }
        return parents;
    }
}
