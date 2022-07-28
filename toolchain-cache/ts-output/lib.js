import is from "@sindresorhus/is";
export function isPokemonJSON(value) {
    if (is.undefined(value))
        return false;
    if (!is.string(value.name))
        return false;
    if (!is.number(value.dex))
        return false;
    if (!is.array(value.defaultForms))
        return false;
    if (!is.array(value.name, isForm))
        return false;
    if (!is.number(value.generation))
        return false;
    return true;
}
export function isForm(value) {
    if (is.undefined(value))
        return false;
    if (!is.string(value.name))
        return false;
    if (!is.string(value.experienceGroup))
        return false;
    if (!isMoves(value.moves))
        return false;
    if (!isAbilities(value.abilities))
        return false;
    if (!isPossibleGenders(value.possibleGenders))
        return false;
    if (!isEggGroups(value.eggGroups))
        return false;
    if (!isTypes(value.types))
        return false;
    if (!is.number(value.malePercentage))
        return false;
    if (!is.array(value.evolutions))
        return false;
    return true;
}
export function isMoves(value) {
    if (is.undefined(value))
        return false;
    if (!is.array(value.eggMoves))
        return false;
    if (!is.array(value.tmMoves8))
        return false;
    if (!is.array(value.trMoves))
        return false;
    if (!is.array(value.hmMoves))
        return false;
    if (!is.array(value.transferMoves))
        return false;
    if (!is.array(value.tmMoves7))
        return false;
    if (!is.array(value.tmMoves6))
        return false;
    if (!is.array(value.tmMoves5))
        return false;
    if (!is.array(value.tmMoves4))
        return false;
    if (!is.array(value.tmMoves3))
        return false;
    if (!is.array(value.tmMoves2))
        return false;
    if (!is.array(value.tmMoves1))
        return false;
    if (!is.array(value.tmMoves))
        return false;
    return true;
}
export function isAbilities(value) {
    return true;
}
export function isEvolution(value) {
    return true;
}
export var EggGroups;
(function (EggGroups) {
})(EggGroups || (EggGroups = {}));
export function isEggGroups(value) {
    return true;
}
export var Types;
(function (Types) {
})(Types || (Types = {}));
export function isTypes(value) {
    return true;
}
export function isIrrelevant(value) {
    return true;
}
export function isPossibleGenders(value) {
    return true;
}
//# sourceMappingURL=lib.js.map