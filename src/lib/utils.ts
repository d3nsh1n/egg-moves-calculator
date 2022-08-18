import { EggGroupsLib, MoveParents } from "./lib";
import { FormData, LevelUpMoveData, MoveKeys, PokemonData } from "./pokemonlib";
import chalk from "chalk";
import { DataLib } from "../tools/dataLib";
import { toPixelmonName } from "./smogonlib";

export function parentIsValid(baseFullName: string, parentFullName: string, method: MoveKeys): boolean {
    // console.log(chalk.magenta("Checking potential parent", parentFullName, "for", baseFullName, method));

    //* If same species, return
    if (baseFullName === parentFullName) return false;

    //* Check if they share an Egg Group
    if (!shareEggGroup(baseFullName, parentFullName)) return false;

    const baseFormData: FormData = DataLib.FORMS[baseFullName];
    const parentFormData: FormData = DataLib.FORMS[parentFullName];

    //* If parent can't be male, return
    if (parentFormData.malePercentage === 0) return false;

    //* Don't include Egg Moves of same evo line
    if (isSameEvoLine(baseFullName, parentFullName) && method === "eggMoves") return false;
    return true;
}

export function shareEggGroup(fullName1: string, fullName2: string): boolean {
    for (const group in DataLib.EGG_GROUPS_LIB) {
        const listOfPokemonInGroup = DataLib.EGG_GROUPS_LIB[group as keyof EggGroupsLib];
        if (!listOfPokemonInGroup) throw console.log(chalk.red("!ERR: Could not read list of Pokemon in group", group));
        if (listOfPokemonInGroup.includes(fullName1) && listOfPokemonInGroup.includes(fullName2)) return true;
    }
    return false;
}

export function getDefaultForm(pokemonName: string): FormData {
    const defaultForm = DataLib.POKEMON_DATA[pokemonName].defaultForms?.[0];
    if (!defaultForm) {
        const fallback = DataLib.POKEMON_DATA[pokemonName].forms[0];
        console.log(chalk.yellow(`No default forms on ${pokemonName}. Returning forms[0]: "${fallback.name}"`));
        return fallback;
    }
    const fullName = defaultForm === "" ? pokemonName : `${pokemonName}-${defaultForm}`;

    if (fullName !== pokemonName) console.log(chalk.yellow.bgGreen(`INFO: Non "" default form: ${defaultForm}`));
    if (DataLib.POKEMON_DATA[pokemonName].defaultForms!.length > 1) console.log(chalk.yellow(`WARN: Multiple default forms detected for ${pokemonName}.`));

    return DataLib.FORMS[fullName];
}

/**
 *
 * @param formData FormData object to get the moves from
 * @param key key of object to get moves from. E.g. eggMoves
 */
export function getFormMoves(formData: FormData, key: MoveKeys): string[] | LevelUpMoveData[] | undefined {
    // console.log("Grabbing", key, "from", formData);
    return formData.moves?.[key];
}

export function isSameEvoLine(fullName1: string, fullName2: string) {
    if (fullName1 === fullName2) return true;

    //* Build `line`s as preevos + current
    const line1: string[] = [...(DataLib.FORMS[fullName1].preEvolutions || []), fullName1];
    const line2: string[] = [...(DataLib.FORMS[fullName2].preEvolutions || []), fullName2];

    //* Return whether or not the 2 lines share a stage
    return line1.some((stage) => line2.includes(stage));
}

export function getParents(fullName: string, move: string, _methodsToInclude: MoveKeys[] = ["eggMoves", "levelUpMoves", "tutorMoves", "transferMoves"], deep = false) {
    const parents: MoveParents = {};
    //* Get list of Pokemon that learn the move
    const listOfParents = Object.keys(DataLib.MOVES_SOURCES[move]);

    //* For each possible parent, store parent and its way of learning the move
    for (const parentName of listOfParents) {
        // Alias
        const storedLearnInfo = DataLib.MOVES_SOURCES[move][parentName];

        // Filter out methods not provided by method call
        const validMethods = storedLearnInfo.learnMethods.filter((method) => _methodsToInclude.includes(method));
        if (validMethods.length === 0) continue;

        // Filter out methods that can't be used to inherit move from parent
        const finalValidMethods = validMethods.filter((method) => parentIsValid(fullName, parentName, method));
        if (finalValidMethods.length === 0) continue;

        // Store a deep copy of the MOVE_SOURCES sub-object
        parents[parentName] = JSON.parse(JSON.stringify(DataLib.MOVES_SOURCES[move][parentName]));
    }
    // Return deepcopy of object, to get rid of references to MOVE_SOURCES, and avoid circular objects
    const deepCopy = JSON.parse(JSON.stringify(parents));
    return deepCopy;
}

export function getSpeciesForm(fullName: string): [string, string] {
    const species_form = fullName.split("-");
    return [species_form[0], species_form[1] || ""];
}

export function getBasic(evoName: string): string {
    evoName = toPixelmonName(evoName);
    const [species, form] = getSpeciesForm(evoName);

    const evoFormData = DataLib.FORMS[evoName];
    if (!evoFormData) {
        console.log(chalk.red("No form data found for", evoName));
        return "";
    }
    const preEvolutions = DataLib.FORMS[evoName].preEvolutions || [];
    const isBasic = preEvolutions?.length === 0;
    const basicSpecies = isBasic ? species : _getBasicPreEvo(preEvolutions as string[]);

    if (hasForm(basicSpecies, form)) {
        return form === "" ? basicSpecies : `${basicSpecies}-${form}`;
    } else {
        const basicSpeciesDefaultForm = getDefaultForm(basicSpecies).name;
        return basicSpeciesDefaultForm === "" ? basicSpecies : `${basicSpecies}-${basicSpeciesDefaultForm}`;
    }
}

function _getBasicPreEvo(preEvolutions: string[]): string {
    for (const pr of preEvolutions) {
        if (DataLib.FORMS[pr].preEvolutions?.length === 0) return pr;
    }
    console.log(chalk.red("Could not find a basic stage in"));
    console.log(preEvolutions);
    return "";
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
