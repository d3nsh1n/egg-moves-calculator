import "./tools/data_library.js";
import { DataLib } from "./tools/data_library.js";
const filePath = "data/species/092_gastly.json";
export async function main() {
  console.log(Object.keys(DataLib.EGG_MOVES_LIB).length);
  console.log(Object.keys(DataLib.EGG_MOVES_LIB_2).length);
  console.log(Object.keys(DataLib.EGG_MOVES_LIB).filter(value => !Object.keys(DataLib.EGG_MOVES_LIB_2).includes(value)));
}
main();