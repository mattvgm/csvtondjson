import { CSVToNDJSON } from "./src";
import { pipeline } from "node:stream/promises";
import fs from "fs";

(async () => {
  const readStream = fs.createReadStream("./data/todos.csv");

  const convertToCsvStream = new CSVToNDJSON({
    delimiter: ",",
    header: ["Id", "Nome", "Idade", "Peso", "Cidade", "Altura"],
  });

  const writeStream = process.stdout;

  await pipeline(readStream, convertToCsvStream, writeStream);
})();
