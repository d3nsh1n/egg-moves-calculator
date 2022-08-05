import is from "@sindresorhus/is";
import chalk from "chalk";
import { StringKeyOf } from "type-fest";

export type PokemonData = {
    name: string;
    dex: number;
    defaultForms: string[];
    forms: FormData[];
    generation: number;
};
export function isPokemonData(value: any): value is PokemonData {
    if (is.undefined(value)) return false;
    if (!is.string(value.name)) return false;
    if (!is.number(value.dex)) return false;
    if (!is.array<string>(value.defaultForms)) return false;
    if (!is.array<FormData>(value.forms, isFormData)) return false;
    if (!is.number(value.generation)) return false;
    return true;
}

export type FormData = {
    name: string;
    experienceGroup?: string; //todo enum/type?
    dimensions: IrrelevantData;
    moves?: MovesData;
    abilities: AbilitiesData;
    movement: IrrelevantData;
    aggression: IrrelevantData;
    battleStats: IrrelevantData;
    tags: IrrelevantData;
    spawn: IrrelevantData;
    possibleGenders: ("MALE" | "FEMALE")[];
    genderProperties: IrrelevantData;
    eggGroups: EggGroups[];
    types: TypesData;
    preEvolutions: IrrelevantData;
    defaultBaseForm: IrrelevantData;
    megaItems: IrrelevantData;
    megas: IrrelevantData;
    gigantamax: IrrelevantData;
    eggCycles: IrrelevantData;
    weight: IrrelevantData;
    catchRate: IrrelevantData;
    malePercentage?: number;
    evolutions: EvolutionData[];
    evYields: IrrelevantData;
};
export function isFormData(value: any): value is FormData {
    if (is.undefined(value)) return false;
    if (!is.string(value.name)) return false;
    if (!is.undefined(value.experienceGroup) && !is.string(value.experienceGroup)) return false;
    console.log(chalk.blue("good"));
    if (!isMovesData(value.moves)) return false;
    if (!isAbilitiesData(value.abilities)) return false;
    if (!isPossibleGenders(value.possibleGenders)) return false;
    if (!isEggGroupsData(value.eggGroups)) return false;
    if (!isTypesData(value.types)) return false;
    if (!is.undefined(value.malePercentage) && !is.number(value.malePercentage)) return false;
    if (!is.array<EvolutionData>(value.evolutions, isEvolutionData)) return false;
    return true;
}

export type MoveKeys = StringKeyOf<MovesData>;
export type MovesData = {
    levelUpMoves: LevelUpMovesData;
    tutorMoves: string[];
    eggMoves: string[];
    tmMoves8: string[];
    trMoves: string[];
    hmMoves: string[];
    transferMoves: string[];
    tmMoves7: string[];
    tmMoves6: string[];
    tmMoves5: string[];
    tmMoves4: string[];
    tmMoves3: string[];
    tmMoves2: string[];
    tmMoves1: string[];
    tmMoves: string[];
};
export function isMovesData(value: any): value is MovesData {
    if (is.undefined(value)) return false;
    if (!is.array<string>(value.eggMoves)) return false;
    if (!is.array<string>(value.tmMoves8)) return false;
    if (!is.array<string>(value.trMoves)) return false;
    if (!is.array<string>(value.hmMoves)) return false;
    if (!is.array<string>(value.transferMoves)) return false;
    if (!is.array<string>(value.tmMoves7)) return false;
    if (!is.array<string>(value.tmMoves6)) return false;
    if (!is.array<string>(value.tmMoves5)) return false;
    if (!is.array<string>(value.tmMoves4)) return false;
    if (!is.array<string>(value.tmMoves3)) return false;
    if (!is.array<string>(value.tmMoves2)) return false;
    if (!is.array<string>(value.tmMoves1)) return false;
    if (!is.array<string>(value.tmMoves)) return false;
    return true;
}

export type LevelUpMovesData = LevelUpMoveData[];
export type LevelUpMoveData = {
    level: number;
    attacks: string[];
};
export function isLevelUpMovesData(value: any): value is LevelUpMovesData {
    //todo
    return true;
}

export type AbilitiesData = {
    //todo
};
export function isAbilitiesData(value: any): value is AbilitiesData {
    return true;
}

export type EvolutionData = {
    //todo
};
export function isEvolutionData(value: any): value is EvolutionData {
    return true;
}

export enum EggGroupsData {}
//todo
export function isEggGroupsData(value: any): value is EggGroupsData {
    return true;
}

export enum TypesData {}
//todo
export function isTypesData(value: any): value is TypesData {
    return true;
}

export type IrrelevantData = {};
export function isIrrelevantData(value: any): value is IrrelevantData {
    return true;
}

export function isPossibleGenders(value: any): boolean {
    return true;
}

export enum EggGroups {
    Monster = "MONSTER",
    HumanLike = "HUMAN_LIKE",
    Water1 = "WATER_ONE",
    Water3 = "WATER_THREE",
    Bug = "BUG",
    Mineral = "MINERAL",
    Flying = "FLYING",
    Amorphous = "AMORPHOUS",
    Field = "FIELD",
    Water2 = "WATER_TWO",
    Fairy = "FAIRY",
    Ditto = "DITTO",
    Grass = "GRASS",
    Dragon = "DRAGON",
    Undiscovered = "UNDISCOVERED",
}
