import { CSVToNDJSON } from "./src";
import { pipeline } from "node:stream/promises";
import fs from "fs";

(async () => {
  const readStream = fs.createReadStream("./data/todos.csv", {
    highWaterMark: 1024,
  });

  const convertToCsvStream = new CSVToNDJSON({
    delimiter: ",",
    header: ["Id", "Nome", "Idade", "Peso", "Cidade", "Altura"],
  });

  //const writeStream = process.stdout;
  //const writeStream = fs.createWriteStream("/dev/null");
  const writeStream = fs.createWriteStream("final.ndjson");

  await pipeline(readStream, convertToCsvStream, writeStream);
})();
