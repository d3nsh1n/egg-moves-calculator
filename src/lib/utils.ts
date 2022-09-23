import { EggGroupsLib, INHERITABLE_KEYS, MoveLearnData, MoveParents } from "./lib";
import { EggGroups, FormData, LevelUpMoveData, MoveKeys, PokemonData } from "./pokemonlib";
import chalk from "chalk";
import { DataLib } from "../tools/dataLib";
import { toPixelmonName } from "../Smogon Data Collection/smogonlib";
import is from "@sindresorhus/is";
import { SetRequired } from "type-fest";

const __CONTEXT__ = "";
const LOG = false;
const log = (...data: any) => unboundLog(LOG, __CONTEXT__, "#995599", ...data);

// Chalk
export const error = chalk.red;
export const warn = chalk.yellow;

export function unboundLog(show: boolean, context: string, color: string, ...data: any) {
    if (show) {
        const isBrowser = process.title === "browser";
        if (isBrowser) {
            console.log(`%c[${context}] -`, `color: ${color}`, ...data);
        } else {
            console.log(chalk.hex(color)(`[${context}] -`), ...data);
        }
    }
}

export function canInherit(fullName: string, move: string) {
    const formData = DataLib.getForm(fullName);

    // Guard
    if (!formData.moves) {
        return false;
    }

    for (const key of INHERITABLE_KEYS) {
        if (!formData.moves[key]) {
            continue;
        }

        for (const m of formData.moves[key]) {
            const moves = getMoveLearnData(m, key);
            for (const moveOfForm of moves) {
                if (moveOfForm.name === move) {
                    return true;
                }
            }
        }
    }
    return false;
}

export function getListOfParents(form: string, move: string, method: MoveKeys): string[] {
    const out: string[] = [];

    for (const pokemon of DataLib.getPokemonInEggGroups(...getEggGroups(form))) {
        // Check if parent learns move
        if (!DataLib.LEARNABLE_MOVES[pokemon].hasOwnProperty(move)) {
            continue;
        }

        // Check if parent can pass it
        if (parentIsValid(form, pokemon, method)) {
            out.push(pokemon);
        }
    }
    return out;
}

export function getMoveParents(parents: string[], move: string): MoveParents {
    const out: MoveParents = {};
    for (const parent of parents) {
        out[parent] = DataLib.LEARNABLE_MOVES[parent][move];
    }
    return out;
}

export function parentIsValid(baseFullName: string, parentFullName: string, method: MoveKeys): boolean {
    // debug(chalk.magenta("Checking potential parent", parentFullName, "for", baseFullName, method));

    //* If same species, return
    if (baseFullName === parentFullName) return false;

    //* Check if they share an Egg Group
    if (!shareEggGroup(baseFullName, parentFullName)) return false;

    const baseFormData: FormData = DataLib.FORMS[baseFullName];
    const parentFormData: FormData = DataLib.FORMS[parentFullName];

    //* If parent can't be male, return
    if (parentFormData.malePercentage === 0) return false;

    //* Don't include Egg Moves of same evo line
    //todo not entirely true, Dragapult Sucker Punch, todo notSoonTM
    if (isSameEvoLine(baseFullName, parentFullName) && method === "eggMoves") return false;
    return true;
}

export function getEggGroups(fullName: string): EggGroups[] {
    // If form is "base", get Egg Groups (for performance)
    if (DataLib.getForm(fullName).eggGroups) {
        return DataLib.getForm(fullName).eggGroups;
    }

    // Get base species
    const [species, form] = getSpeciesForm(fullName);

    // Get default form
    const defaultFormNames = DataLib.POKEMON_DATA[species].defaultForms;
    if (defaultFormNames.length === 0) {
        log(chalk.red(`No default forms for ${species}!`));
        return [];
    }

    const defaultForm = getFullName(species, defaultFormNames[0]);
    if (DataLib.formExists(defaultForm)) {
        return DataLib.getForm(defaultForm).eggGroups;
    } else {
        log(error("Could not read FORM data for", defaultForm));
    }
    return [];
}

export function shareEggGroup(fullName1: string, fullName2: string): boolean {
    const [species1, form1] = getSpeciesForm(fullName1);
    const [species2, form2] = getSpeciesForm(fullName2);
    for (const group in DataLib.EGG_GROUPS_LIB) {
        const listOfPokemonInGroup = DataLib.EGG_GROUPS_LIB[group as keyof EggGroupsLib];
        if (!listOfPokemonInGroup) throw log(chalk.red("!ERR: Could not read list of Pokemon in group", group));
        if (listOfPokemonInGroup.includes(species1) && listOfPokemonInGroup.includes(species2)) return true;
    }
    return false;
}

export function getDefaultForm(pokemonName: string): FormData {
    const defaultForm = DataLib.POKEMON_DATA[pokemonName].defaultForms?.[0];
    if (!defaultForm) {
        const fallback = DataLib.POKEMON_DATA[pokemonName].forms[0];
        // debug(chalk.yellow(`No default forms on ${pokemonName}. Returning forms[0]: "${fallback.name}"`));
        return fallback;
    }
    const fullName = defaultForm === "" ? pokemonName : `${pokemonName}-${defaultForm}`;

    if (fullName !== pokemonName) log(chalk.yellow.bgGreen(`INFO: Non "" default form: ${defaultForm}`));
    if (DataLib.POKEMON_DATA[pokemonName].defaultForms!.length > 1) log(chalk.yellow(`WARN: Multiple default forms detected for ${pokemonName}.`));

    return DataLib.FORMS[fullName];
}

/**
 *
 * @param formData FormData object to get the moves from
 * @param key key of object to get moves from. E.g. eggMoves
 */
export function getFormMoves(formData: FormData, key: MoveKeys): string[] | LevelUpMoveData[] | undefined {
    // debug("Grabbing", key, "from", formData);
    return formData.moves?.[key];
}

export function isSameEvoLineOld(fullName1: string, fullName2: string) {
    if (fullName1 === fullName2) return true;

    //* Build `line`s as preevos + current
    const line1: string[] = [...(DataLib.FORMS[fullName1].preEvolutions || []), fullName1];
    const line2: string[] = [...(DataLib.FORMS[fullName2].preEvolutions || []), fullName2];

    //* Return whether or not the 2 lines share a stage
    return line1.some((stage) => line2.includes(stage));
}

export function isSameEvoLine(fullName1: string, fullName2: string) {
    return getBasic(fullName1) === getBasic(fullName2);
}

export function getSpeciesForm(fullName: string): [string, string] {
    const uniqueCases = ["Ho-Oh", "Kommo-o", "Hakamo-o", "Jangmo-o", "Porygon-Z"];
    if (uniqueCases.includes(fullName)) {
        return [fullName, ""];
    }

    const species_form = fullName.split("-");
    return [species_form[0], species_form[1] || ""];
}
export function getFullName(species: string, form: string): string {
    const fullName = form === "" ? species : `${species}-${form}`;
    return fullName;
}

export function getBasic(evoName: string): string {
    evoName = toPixelmonName(evoName);

    const [species, form] = getSpeciesForm(evoName);

    const evoFormData = DataLib.getForm(evoName);

    const preEvolutions = evoFormData.preEvolutions || getDefaultForm(species).preEvolutions || [];
    const isBasic = preEvolutions.length === 0;
    const speciesBasicStage = isBasic ? species : findBasicPreevolution(preEvolutions);

    // basic-form
    if (form !== "" && hasForm(speciesBasicStage, form)) {
        return getFullName(speciesBasicStage, form);
    }

    // basic-tag
    for (const tag of evoFormData.tags || []) {
        const formWithTag = getFormWithTag(speciesBasicStage, tag);
        if (formWithTag !== null) {
            return getFullName(speciesBasicStage, formWithTag.name);
        }
    }

    // basic-default || basic
    const basicSpeciesDefaultForm = getDefaultForm(speciesBasicStage).name;
    return getFullName(speciesBasicStage, basicSpeciesDefaultForm);
}

export function isBasic(fullName: string): boolean {
    const [species, form] = getSpeciesForm(fullName);
    const formData = DataLib.getForm(fullName);
    const preEvolutions = formData.preEvolutions || getDefaultForm(species).preEvolutions || [];
    return preEvolutions.length === 0;
}

function findBasicPreevolution(preEvolutions: string[]): string {
    for (const pr of preEvolutions) {
        const prform = DataLib.getForm(pr);
        if (is.undefined(prform.preEvolutions) || prform.preEvolutions.length === 0) return pr;
    }
    log(chalk.red("Could not find a basic stage in"));
    console.log(preEvolutions);
    return "";
}

export function getFormWithTag(speciesName: string, tag: string) {
    const speciesData = DataLib.getPokemonData(speciesName);
    for (const formData of speciesData.forms) {
        if (!is.undefined(formData.tags) && formData.tags.includes(tag)) {
            return formData;
        }
    }
    return null;
}

export function hasForm(speciesName: string, formName: string): boolean {
    for (const form of DataLib.POKEMON_DATA[speciesName].forms) {
        if (form.name === formName) return true;
    }
    return false;
}

export function forEachPokemon(callback: (pokemonData: PokemonData) => void) {
    for (const pokemon in DataLib.POKEMON_DATA) {
        callback(DataLib.POKEMON_DATA[pokemon]);
    }
}

export function arrayEquals<T>(arr1: T[], arr2: T[], orderMatters = false): boolean {
    //todo implement order matters?
    if (arr1.length !== arr2.length) return false;

    // Same length arrays, doesn't matter which you iterate and compare to the other, you just need 1 mismatch to ensure not same
    // (since subset is already handled)
    for (const element of arr1) {
        if (!arr2.includes(element)) return false;
    }
    return true;
}
export function deepCopy<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
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

isSameEvoLine;
