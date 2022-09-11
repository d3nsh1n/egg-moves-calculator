import chalk from "chalk";
import { EggGroups, FormData, isPokemonData, LevelUpMoveData, MoveKeys, MovesData, PokemonData } from "../lib/pokemonlib";
import { EggGroupsLib, LearnableMoves, MOVE_KEYS, INHERITABLE_KEYS, Forms, AllPokemonData, LearnMethodInfo, MoveParents, MoveLearnData } from "../lib/lib";
import { DataLoader } from "./dataLoader";
import is from "@sindresorhus/is";
import { performance } from "perf_hooks";
import fs from "fs-extra";
import { getFormMoves, getListOfParents, getMoveLearnData, parentIsValid } from "../lib/utils";

export class DataLib {
    /** Pokemon: Move: LearnMethodInfo
     * Lists every Pokemon and all the possible moves it can learn
     */
    public static LEARNABLE_MOVES: LearnableMoves = {};

    /** EggGroup: ListOfPokemonInIt
     * List of Egg Groups and arrays of Pokemon in them
     */
    public static EGG_GROUPS_LIB: EggGroupsLib = {};

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

        //! Learnable moves
        if (is.emptyObject(this.LEARNABLE_MOVES) || forceLoad) {
            this._generateLearnableMoves();
        }

        console.log(chalk.bgGreen(`DataLib took ${(performance.now() - startTime).toFixed(0)} milliseconds to initialize.`));
    }

    private static _generateLearnableMoves() {
        //* Initial Pass
        for (const form in this.FORMS) {
            this.LEARNABLE_MOVES[form] ||= {};

            const formData: FormData = this.FORMS[form];
            for (const learnMethod in formData.moves) {
                for (const m of formData.moves[learnMethod as MoveKeys]) {
                    // Extract Move Learn Data - Uses a unified format for moves, and returns array in case of multiple moves from the same level in LevelUpMoveData
                    const moveLearnData: MoveLearnData[] = getMoveLearnData(m, learnMethod as MoveKeys);
                    for (const move of moveLearnData) {
                        // Alias and init
                        // let moveLearnInfo = this.LEARNABLE_MOVES[form][move.name];
                        this.LEARNABLE_MOVES[form][move.name] ||= { learnMethods: [] };

                        this.LEARNABLE_MOVES[form][move.name].learnMethods.push(move.method);
                        if (move.level !== undefined) this.LEARNABLE_MOVES[form][move.name].level = move.level;
                    }
                }
            }
        }

        //* Second pass, for egg moves
        //? "Needs" to be second pass for performance reasons, wont have to go looking in data.moves again
        for (const form in this.LEARNABLE_MOVES) {
            for (const move in this.LEARNABLE_MOVES[form]) {
                // Alias
                const learnMethodInfo: LearnMethodInfo = this.LEARNABLE_MOVES[form][move];
                if (learnMethodInfo.learnMethods.includes("eggMoves")) {
                    learnMethodInfo.parents = getListOfParents(form, move, "eggMoves");
                }
            }
        }
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

    public static getPokemonInEggGroups(...groups: string[]) {
        const out: string[] = [];
        for (const group of groups) {
            if (!Object.values(EggGroups).includes(group as EggGroups)) {
                console.error(chalk.red(`Incorrect Egg Group provided: ${group}.`));
                return [];
            }
            out.push(...this.EGG_GROUPS_LIB[group as EggGroups]!);
        }
        return [...new Set(out)];
    }

    //! POKEMON_DATA
    public static addPokemonData(pokemonData: PokemonData) {
        this.POKEMON_DATA[pokemonData.name] = pokemonData;
    }

    public static getPokemonData(species: string): PokemonData {
        //todo read from file?
        if (DataLib.POKEMON_DATA.hasOwnProperty(species)) {
            console.error(chalk.red(`Could not read POKEMON_DATA for ${species}.`));
        }
        return this.POKEMON_DATA[species];
    }

    //! FORMS
    public static addForm(fullName: string, form: FormData) {
        this.FORMS[fullName] = form;
    }

    public static getForm(fullName: string): FormData {
        if (!DataLib.FORMS.hasOwnProperty(fullName)) {
            console.error(chalk.red(`Could not read FORM for ${fullName}`));
        }
        return this.FORMS[fullName];
    }

    public static formExists(fullName: string): boolean {
        return DataLib.FORMS.hasOwnProperty(fullName);
    }
}
