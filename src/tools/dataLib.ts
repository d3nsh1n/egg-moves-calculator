import fs, { move } from "fs-extra";
import path from "path";
import chalk from "chalk";
import { EggGroups, FormData, isPokemonData, LevelUpMoveData, MoveKeys, MovesData, PokemonData } from "../lib/pokemonlib";
import { MoveSources, EggGroupsLib, InheritableMoves, LevelUpMoves, MOVE_KEYS, INHERITABLE_KEYS } from "../lib/lib";
import is from "@sindresorhus/is";
import { performance } from "perf_hooks";
import { DataLoader } from "./dataLoader";

export abstract class DataLib {
    /** Pokemon: Move: Movedata where Movedata includes parents and other info*/
    public static INHERITABLE_MOVES: InheritableMoves = {};
    /** pokemon: LevelUpMoveData[];*/
    // public static LEVELUP_MOVES: LevelUpMoves = {};
    /** EggGroup: ListOfPokemonInIt */
    public static EGG_GROUPS_LIB: EggGroupsLib = {};
    /** Move: PokemonThatLearnIt: LearnMethods */
    public static MOVES_SOURCES: MoveSources = {};

    public static addInheritableMoves(fullName: string, form: FormData) {
        //* Skip or initialize
        if (DataLib.INHERITABLE_MOVES.hasOwnProperty(fullName)) return;
        else DataLib.INHERITABLE_MOVES[fullName] = {};

        //* Get list of possible inheritable moves and iterate it
        const listOfInheritableMoves = this.getInheritableMoves(form);
        for (const move of listOfInheritableMoves) {
            //* Initialize if first entry for move
            if (!DataLib.INHERITABLE_MOVES[fullName].hasOwnProperty(move)) DataLib.INHERITABLE_MOVES[fullName][move] = { parents: [] };

            //* Filter possible parents based on Egg Groups
            const listOfPokemonThatLearnMove = Object.keys(this.MOVES_SOURCES[move]);
            const listOfParents = listOfPokemonThatLearnMove.filter((p) => this.shareEggGroup(p, fullName));

            //* For each possible parent, store parent and its way of learning the move
            for (const parent of listOfParents) {
                const learnedFrom = this.MOVES_SOURCES[move][parent];
                DataLib.INHERITABLE_MOVES[fullName][move].parents.push([parent, learnedFrom]);
            }
        }
    }

    /** Get a list of all moves the Pokemon (form) can possibly inherit from breeding.   */
    private static getInheritableMoves(form: FormData): string[] {
        const inheritableMoves: string[] = [];
        for (const key in INHERITABLE_KEYS) {
            const moves = DataLoader.getFormMoves(form, key as MoveKeys) as string[]; //todo change cast if it can be LevelUpMoves
            if (moves) inheritableMoves.push(...moves);
        }
        return inheritableMoves;
    }

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

    public static addMoveSources(fullName: string, form: FormData) {
        //* Iterate over each possible method (json key) of obtaining a move
        for (const method of MOVE_KEYS) {
            const moves = DataLoader.getFormMoves(form, method as MoveKeys);

            //* If there are moves
            if (!moves) continue;

            //* Add each move to sources
            for (const move of moves) {
                if (typeof move !== "string") {
                    // non-levelUpMove
                    DataLib._addMoveSource(fullName, method, ...move.attacks);
                } else {
                    // levelUp move
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

    public static shareEggGroup(fullName1: string, fullName2: string): boolean {
        for (const group in DataLib.EGG_GROUPS_LIB) {
            const listOfPokemonInGroup = DataLib.EGG_GROUPS_LIB[group as keyof EggGroupsLib];
            if (!listOfPokemonInGroup) throw console.log(chalk.red("!ERR: Could not read list of Pokemon in group", group));
            if (listOfPokemonInGroup.includes(fullName1) && listOfPokemonInGroup.includes(fullName2)) return true;
        }
        return false;
    }
}
