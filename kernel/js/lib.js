import is from "@sindresorhus/is";
import chalk from "chalk";
export function isPokemonData(value) {
  if (is.undefined(value)) return false;
  if (!is.string(value.name)) return false;
  if (!is.number(value.dex)) return false;
  if (!is.array(value.defaultForms)) return false;
  if (!is.array(value.forms, isFormData)) return false;
  if (!is.number(value.generation)) return false;
  return true;
}
export function isFormData(value) {
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
  if (!is.array(value.evolutions, isEvolutionData)) return false;
  return true;
}
export function isMovesData(value) {
  if (is.undefined(value)) return false;
  if (!is.array(value.eggMoves)) return false;
  if (!is.array(value.tmMoves8)) return false;
  if (!is.array(value.trMoves)) return false;
  if (!is.array(value.hmMoves)) return false;
  if (!is.array(value.transferMoves)) return false;
  if (!is.array(value.tmMoves7)) return false;
  if (!is.array(value.tmMoves6)) return false;
  if (!is.array(value.tmMoves5)) return false;
  if (!is.array(value.tmMoves4)) return false;
  if (!is.array(value.tmMoves3)) return false;
  if (!is.array(value.tmMoves2)) return false;
  if (!is.array(value.tmMoves1)) return false;
  if (!is.array(value.tmMoves)) return false;
  return true;
}
export function isAbilitiesData(value) {
  return true;
}
export function isEvolutionData(value) {
  return true;
}
export var EggGroupsData;

(function (EggGroupsData) {})(EggGroupsData || (EggGroupsData = {}));

export function isEggGroupsData(value) {
  return true;
}
export var TypesData;

(function (TypesData) {})(TypesData || (TypesData = {}));

export function isTypesData(value) {
  return true;
}
export function isIrrelevantData(value) {
  return true;
}
export function isPossibleGenders(value) {
  return true;
}