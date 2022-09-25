// export function getEggGroups(fullName: string): EggGroups[] {
//     // If form is "base", get Egg Groups (for performance)
//     if (DataLib.getForm(fullName).eggGroups) {
//         return DataLib.getForm(fullName).eggGroups;
//     }

//     // Get base species
//     const [species, form] = getSpeciesForm(fullName);

//     // Get default form
//     const defaultFormNames = DataLib.POKEMON_DATA[species].defaultForms;
//     if (defaultFormNames.length === 0) {
//         log(chalk.red(`No default forms for ${species}!`));
//         return [];
//     }

//     const defaultForm = getFullName(species, defaultFormNames[0]);
//     if (DataLib.formExists(defaultForm)) {
//         return DataLib.getForm(defaultForm).eggGroups;
//     } else {
//         log(error("Could not read FORM data for", defaultForm));
//     }
//     return [];
// }
