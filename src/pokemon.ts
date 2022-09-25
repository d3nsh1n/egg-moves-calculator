import is from "@sindresorhus/is";
import { INHERITABLE_KEYS, MoveLearnData } from "./lib";
import { DataManager } from "./Pixelmon Data Manager/data_manager";
import { AbilitiesData, EggGroups, EvolutionData, FormData, MoveKeys, MovesData, PokemonData, TypesData } from "./Pixelmon Data Manager/pixelmonlib";
import { findBasicPreevolution, getDefaultFormOfSpecies, getFormWithTag, toMoveLearnData, hasForm, toPokemonName } from "./Pixelmon Data Manager/pixelmonutils";

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

    public canInheritMove(move: string): boolean {
        // Guard
        if (is.undefined(this.moves)) {
            return false;
        }

        for (const key of INHERITABLE_KEYS) {
            if (is.undefined(this.moves[key])) {
                continue;
            }

            for (const moveOfForm of this.getMoves(key)) {
                if (moveOfForm.name === move) {
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
        return !is.undefined(DataManager.LEARNABLE_MOVES[this.toString()][move]);
    }

    public getEggGroups(): string[] {
        return this.eggGroups || DataManager.POKEMON[this.name].eggGroups || this.getDefaultForm().eggGroups;
    }

    public getForms(): string[] {
        return DataManager.FORM_INDEX[this.name];
    }

    public getDefaultFormName(): string {
        return this.defaultForms[0] || this.getForms()[0];
    }

    public getDefaultForm(): Pokemon {
        return DataManager.POKEMON[toPokemonName(this.name, this.getDefaultFormName())];
    }

    public getPreEvolutions(): string[] {
        return this.preEvolutions || this.getDefaultForm().preEvolutions || [];
    }

    public getMoves(key: MoveKeys): MoveLearnData[] {
        const out = [];
        if (is.undefined(this.moves) || is.undefined(this.moves[key])) {
            return [];
        }
        for (const move of this.moves[key]) {
            out.push(...toMoveLearnData(move, key));
        }
        return out;
    }

    public isBasic(): boolean {
        return this.getPreEvolutions().length === 0;
    }

    public getBasic(): Pokemon {
        // Get preevolutions from the Pokemon data, the Pokemon data of its default form, or assume empty
        const preEvolutions = this.getPreEvolutions();
        const isBasic = preEvolutions.length === 0;
        const speciesBasicStage = isBasic ? this.name : findBasicPreevolution(preEvolutions).name;

        // basic-form
        if (this.form !== "" && hasForm(speciesBasicStage, this.form)) {
            return DataManager.POKEMON[toPokemonName(speciesBasicStage, this.form)];
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
        return basicSpeciesDefaultForm || DataManager.POKEMON[speciesBasicStage];
    }
}
