import chalk from "chalk";
import { EggGroups, FormData, isPokemonData, LevelUpMoveData, MoveKeys, MovesData, PokemonData } from "../lib/pokemonlib";
import { MoveSources, EggGroupsLib, InheritableMoves, MOVE_KEYS, INHERITABLE_KEYS, Forms, AllPokemonData } from "../lib/lib";
import { DataLoader } from "./dataLoader";

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

    //! INHERITABLE_MOVES
    public static addInheritableMoves(fullName: string, form: FormData) {
        //* Skip or initialize
        if (DataLib.INHERITABLE_MOVES.hasOwnProperty(fullName)) return;
        else DataLib.INHERITABLE_MOVES[fullName] = {};

        //* Get list of possible inheritable moves and iterate it
        const listOfInheritableMoves = this.getInheritableMoves(form);
        for (const move_method of listOfInheritableMoves) {
            const move = move_method[0];
            const method = move_method[1];
            //* Initialize if first entry for move
            if (!DataLib.INHERITABLE_MOVES[fullName].hasOwnProperty(move)) DataLib.INHERITABLE_MOVES[fullName][move] = { parents: {}, type: method };

            //* Filter possible parents based on Egg Groups
            const listOfPokemonThatLearnMove = Object.keys(this.MOVES_SOURCES[move]);
            const listOfParents = listOfPokemonThatLearnMove.filter((p) => this.shareEggGroup(p, fullName));

            //* For each possible parent, store parent and its way of learning the move
            for (const parentName of listOfParents) {
                const learnedFrom = this.MOVES_SOURCES[move][parentName];

                for (const method of learnedFrom) {
                    if (this._parentIsValid(fullName, parentName, method as MoveKeys)) {
                        if (!DataLib.INHERITABLE_MOVES[fullName][move].parents.hasOwnProperty(parentName)) DataLib.INHERITABLE_MOVES[fullName][move].parents[parentName] = [];
                        DataLib.INHERITABLE_MOVES[fullName][move].parents[parentName].push(method);
                    }
                }
            }
        }
    }

    /** Get a list of all moves the Pokemon (form) can possibly inherit from breeding. */
    private static getInheritableMoves(form: FormData): [string, string][] {
        const inheritableMoves: [string, string][] = [];
        for (const key of INHERITABLE_KEYS) {
            const moves = DataLoader.getFormMoves(form, key as MoveKeys) as string[]; //todo change cast if it can be LevelUpMoves
            for (const move in moves) {
                inheritableMoves.push([moves[move], key]);
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
            const moves = DataLoader.getFormMoves(form, method as MoveKeys);

            //* If there are moves
            if (!moves) continue;

            //* Add each move to sources
            for (const move of moves) {
                if (typeof move !== "string") {
                    // levelUpMove
                    DataLib._addMoveSource(fullName, method, ...move.attacks);
                } else {
                    // non-levelUp move
                    DataLib._addMoveSource(fullName, method, move);
                }
            }
        }
    }

    private static _addMoveSource(pokemonName: string, method: string, ...moves: string[]) {
        for (const move of moves) {
            if (!this.MOVES_SOURCES.hasOwnProperty(move)) this.MOVES_SOURCES[move] = {};
            if (!this.MOVES_SOURCES[move].hasOwnProperty(pokemonName)) this.MOVES_SOURCES[move][pokemonName] = [];
            if (!this.MOVES_SOURCES[move][pokemonName].includes(method)) this.MOVES_SOURCES[move][pokemonName].push(method);
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

        const baseFormData: FormData = this.FORMS[baseFullName];
        const parentFormData: FormData = this.FORMS[parentFullName];

        //* If parent can't be male, return
        if (parentFormData.malePercentage === 0) return false;

        //* Don't include Egg Moves of same evo line
        if (this._isSameEvoLine(baseFullName, parentFullName) && method === "eggMoves") return false;
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

    public static _isSameEvoLine(fullName1: string, fullName2: string) {
        if (fullName1 === fullName2) return true;

        //* Build `line`s as preevos + current
        const line1: string[] = [...(DataLib.FORMS[fullName1].preEvolutions || []), fullName1];
        const line2: string[] = [...(DataLib.FORMS[fullName2].preEvolutions || []), fullName2];

        //* Return whether or not the 2 lines share a stage
        return line1.some((stage) => line2.includes(stage));
    }
}
