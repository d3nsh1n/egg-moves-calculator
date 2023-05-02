import is from "@sindresorhus/is";
import { INHERITABLE_KEYS, LearnMethodInfo, MoveLearnData } from "./lib";
import { DataManager } from "../pixelmon-data-manager/_data_manager";
import { AbilitiesData, EggGroups, EvolutionData, FormData, MoveKeys, MovesData, PokemonData, TypesData } from "../pixelmon-data-manager/pixelmonlib";
import { findBasicPreevolution, getDefaultFormOfSpecies, getFormWithTag, extractLearnMethodInfoBase, hasForm, toPokemonName } from "../pixelmon-data-manager/pixelmonutils";
import { error, warn } from "console";
import { PokemonRegistry } from "../pixelmon-data-manager/_pokemon_registry";

export class Pokemon implements Omit<PokemonData, "forms">, Partial<FormData> {
    name: string;
    dex: number;
    defaultForms: string[];
    generation: number;

    form: string;
    moves?: MovesData;
    abilities: AbilitiesData;
    tags: string[];
    possibleGenders: ("MALE" | "FEMALE")[];
    eggGroups: EggGroups[];
    types: TypesData;
    preEvolutions?: string[];
    malePercentage?: number;
    evolutions: EvolutionData[];

    constructor(pokemonData: PokemonData, formData: FormData) {
        const { name, dex, defaultForms, generation } = pokemonData;
        this.name = name;
        this.dex = dex;
        this.defaultForms = defaultForms;
        this.generation = generation;

        const { moves, abilities, tags, possibleGenders, eggGroups, types, preEvolutions, malePercentage, evolutions } = formData;
        this.form = formData.name;
        this.moves = moves;
        this.abilities = abilities;
        this.tags = tags;
        this.possibleGenders = possibleGenders;
        this.eggGroups = eggGroups;
        this.types = types;
        this.preEvolutions = preEvolutions;
        this.malePercentage = malePercentage;
        this.evolutions = evolutions;
    }

    public canInherit(move: string): boolean {
        // Guard
        if (is.undefined(this.moves)) {
            return false;
        }

        for (const key of INHERITABLE_KEYS) {
            if (is.undefined(this.moves[key])) {
                continue;
            }

            for (const [moveOfForm, learnInfo] of this.getMovesLearnInfo(key)) {
                if (moveOfForm === move) {
                    return true;
                }
            }
        }
        return false;
    }

    public toSpeciesForm(): [string, string] {
        return [this.name, this.form || ""];
    }

    /** Returns a [species]-[form] string of the Pokemon */
    public toString(): string {
        const fullName = this.form === "" ? this.name : `${this.name}-${this.form}`;
        return fullName;
    }

    public canLearn(move: string): boolean {
        //? Performant way. Cleaner alternative: search this.moves
        const dataInRegistry = DataManager.MoveRegistry?.getPokemonMoves(this.toString());
        // console.log(DataManager.MoveRegistry.getPokemonMoves(this.toString()) === undefined, this.toString());

        if (dataInRegistry === undefined) {
            // Registry not yet initialized, or something went wrong.
            // warn("No Move Registry found! Manually calculating canLearn()", this.toString());
            for (const learnMethod in this.moves) {
                if (this.getMovesLearnInfo(learnMethod as keyof MovesData).has(move)) return true;
            }
            return false;
        } else {
            return dataInRegistry.has(move);
        }
    }

    public getEggGroups(): EggGroups[] {
        return this.eggGroups || DataManager.PokemonRegistry.get(this.name)?.eggGroups || this.getDefaultForm().eggGroups;
    }

    public getForms(): string[] {
        return DataManager.PokemonRegistry.Forms.get(this.name)!;
    }

    public getDefaultFormName(): string {
        return this.defaultForms[0] || this.getForms()[0];
    }

    public getDefaultForm(): Pokemon {
        return DataManager.PokemonRegistry.get(toPokemonName(this.name, this.getDefaultFormName()))!;
    }

    public getPreEvolutions(): string[] {
        return this.preEvolutions || this.getDefaultForm().preEvolutions || [];
    }

    public getMovesLearnInfo(learnMethod: MoveKeys): Map<string, LearnMethodInfo> {
        const out: Map<string, LearnMethodInfo> = new Map();
        if (is.undefined(this.moves) || is.undefined(this.moves[learnMethod])) {
            return out;
        }
        for (const moveOrLevelUpData of this.moves[learnMethod]) {
            const learnMethodInfoBase = extractLearnMethodInfoBase(moveOrLevelUpData);

            for (const [moveName, moveInfoBase] of learnMethodInfoBase) {
                moveInfoBase.learnMethods.push(learnMethod);
                if (out.has(moveName)) {
                    // Move is learned via more than one means, append new data
                    const inf = out.get(moveName);
                    inf!.learnMethods.push(...moveInfoBase.learnMethods);
                    inf!.level = moveInfoBase.level;
                } else {
                    // First encounter of move
                    out.set(moveName, moveInfoBase);
                }
            }
        }
        return out;
    }

    public isBasic(): boolean {
        return this.getPreEvolutions().length === 0;
    }

    public getBasic(registry?: PokemonRegistry): Pokemon {
        const PokemonRegistry = registry || DataManager.PokemonRegistry;
        // Get preevolutions from the Pokemon data, the Pokemon data of its default form, or assume empty
        const preEvolutions = this.getPreEvolutions();
        const isBasic = preEvolutions.length === 0;
        const speciesBasicStage = isBasic ? this.name : findBasicPreevolution(preEvolutions).name;
        // basic-form
        if (this.form !== "" && hasForm(speciesBasicStage, this.form)) {
            const pokemonName = toPokemonName(speciesBasicStage, this.form);
            const pokemon = PokemonRegistry.get(pokemonName);
            if (!pokemon) {
                throw error("No Pokemon data found for", pokemonName);
            }
            return pokemon;
        }

        // basic-tag
        for (const tag of this.tags || []) {
            const formWithTag = getFormWithTag(speciesBasicStage, tag);
            if (formWithTag !== null) {
                return formWithTag;
            }
        }

        // basic-default || basic
        const basicSpeciesDefaultForm = getDefaultFormOfSpecies(speciesBasicStage);
        return basicSpeciesDefaultForm || PokemonRegistry.get(speciesBasicStage)!;
    }
}
