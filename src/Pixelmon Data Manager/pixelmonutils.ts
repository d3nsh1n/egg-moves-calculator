import is from "@sindresorhus/is";
import { EggGroupsLib, MoveLearnData, MoveParents } from "../lib";
import { error, unboundLog } from "../logger";
import { Pokemon } from "../pokemon";
import { DataManager } from "./data_manager";
import { LevelUpMoveData, MoveKeys } from "./pixelmonlib";

const __CONTEXT__ = "PixelmonUtils";
const LOG = false;
const log = (...data: any) => unboundLog(LOG, __CONTEXT__, "#121212", ...data);

export function getParentsForMove(pokemon: Pokemon, move: string, method: MoveKeys): string[] {
    const out: string[] = [];

    for (const potentialParentName of DataManager.getPokemonInEggGroups(...pokemon.getEggGroups())) {
        if (!DataManager.POKEMON[potentialParentName].canLearn(move)) {
            continue;
        }

        // Check if parent can pass it
        if (parentIsValid(pokemon, DataManager.POKEMON[potentialParentName], method)) {
            out.push(potentialParentName);
        }
    }
    return out;
}

export function getMoveParents(parents: string[], move: string): MoveParents {
    const out: MoveParents = {};
    for (const parent of parents) {
        out[parent] = DataManager.LEARNABLE_MOVES[parent][move];
    }
    return out;
}

export function parentIsValid(base: Pokemon, parent: Pokemon, method: MoveKeys): boolean {
    //* If same species, return
    if (base.toString() === parent.toString()) return false;

    //* Check if they share an Egg Group
    if (!shareEggGroup(base, parent)) return false;

    //* If parent can't be male, return
    if (parent.malePercentage === 0) return false;

    //* Don't include Egg Moves of same evo line
    //todo not entirely true, Dragapult Sucker Punch, todo notSoonTM
    if (isSameEvoLine(base, parent) && method === "eggMoves") return false;
    return true;
}

export function shareEggGroup(pokemon1: Pokemon, pokemon2: Pokemon): boolean {
    for (const group in DataManager.EGG_GROUPS) {
        const pokemonInGroup = DataManager.EGG_GROUPS[group as keyof EggGroupsLib];
        if (!pokemonInGroup) throw log(error("!ERR: Could not read Pokemon in group", group));
        if (pokemonInGroup.includes(pokemon1.toString()) && pokemonInGroup.includes(pokemon2.toString())) return true;
    }
    return false;
}

export function isSameEvoLine(pokemon1: Pokemon, pokemon2: Pokemon) {
    return pokemon1.getBasic().toString() === pokemon2.getBasic().toString();
}

export function toPokemonName(species: string, form: string): string {
    return form === "" ? species : `${species}-${form}`;
}

export function findBasicPreevolution(preEvolutions: string[]): Pokemon {
    for (const pr of preEvolutions) {
        const prPokemon = DataManager.POKEMON[pr] || getDefaultFormOfSpecies(pr);
        if (is.undefined(prPokemon.preEvolutions) || prPokemon.preEvolutions.length === 0) return prPokemon;
    }
    throw log(error("Could not find a basic stage in"), preEvolutions);
}

export function getFormWithTag(speciesName: string, tag: string): Pokemon | null {
    for (const form of DataManager.FORM_INDEX[speciesName]) {
        const pokemon = DataManager.POKEMON[toPokemonName(speciesName, form)];
        if (!is.undefined(pokemon.tags) && pokemon.tags.includes(tag)) {
            return pokemon;
        }
    }
    return null;
}

export function getDefaultFormOfSpecies(speciesName: string): Pokemon | null {
    const pokemon: Pokemon = DataManager.POKEMON[speciesName];
    if (!is.undefined(pokemon)) {
        return pokemon;
    }

    // No "speciesname" form, need to find default form
    if (is.undefined(DataManager.FORM_INDEX[speciesName] || DataManager.FORM_INDEX[speciesName].length === 0)) {
        log(error(`No default form can be found for ${speciesName}`));
        return null;
    }

    const temp: Pokemon = DataManager.POKEMON[toPokemonName(speciesName, DataManager.FORM_INDEX[speciesName][0])];
    const defaultForm: string = temp.getDefaultFormName();
    return DataManager.POKEMON[toPokemonName(speciesName, defaultForm)] || null;
}

export function hasForm(speciesName: string, formName: string): boolean {
    return DataManager.FORM_INDEX[speciesName].includes(formName);
}

export function forEachPokemon(callback: (pokemon: Pokemon) => void) {
    for (const pokemonName in DataManager.POKEMON) {
        callback(DataManager.POKEMON[pokemonName]);
    }
}

/** Extract Move Learn Data - Uses a unified format for moves, and returns array in case of multiple moves from the same level in LevelUpMoveData */
export function getMoveLearnData(move: string | LevelUpMoveData, method: MoveKeys): MoveLearnData[] {
    if (is.string(move)) {
        return [
            {
                name: move,
                method,
            },
        ];
    } else {
        const out: MoveLearnData[] = [];
        for (const m of move.attacks) {
            out.push({
                name: m,
                method,
                level: move.level,
            });
        }
        return out;
    }
}
