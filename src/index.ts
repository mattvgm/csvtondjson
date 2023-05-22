// This code is an implementation of a Transform stream in TypeScript that converts CSV (Comma-Separated Values) data into NDJSON (Newline Delimited JSON) format. Here's a breakdown of the code:

// 1. The code imports necessary modules:
//    - `Transform` and `TransformOptions` from the `"node:stream"` module.
//    - `TransformCallback` from the `"stream"` module.

// 2. The code defines a type `CSVToNDJSONProps` representing the properties/configuration for the CSV to NDJSON conversion. It includes two properties:
//    - `delimiter`: The delimiter character used in the CSV file (default is comma).
//    - `header`: An array of strings representing the headers/column names in the CSV file.

// 3. Constants are defined:
//    - `BREAK_LINE_SYMBOL`: A constant representing the newline character ("\n").
//    - `INDEX_NOT_FOUND`: A constant representing the index not found (-1).

// 4. The code defines a class `CSVToNDJSON` that extends the `Transform` stream class. This class is responsible for converting CSV data to NDJSON format.

// 5. The class has a private property `buffer`, which is a buffer that holds the accumulated data until it forms complete lines.

// 6. The class constructor takes the `props` object of type `CSVToNDJSONProps` and optional `options` object for the Transform stream.

// 7. The class has a private generator function `updateBuffer` that takes a `chunk` of data and processes it. It updates the `buffer` with the incoming chunk and processes each complete line found in the buffer.

// 8. Within the `updateBuffer` function:
//    - The buffer is concatenated with the incoming chunk.
//    - The function enters a loop until there are no more complete lines found in the buffer.
//    - It searches for the index of the first occurrence of the `BREAK_LINE_SYMBOL` in the buffer.
//    - If no more occurrence is found, the loop breaks.
//    - The line data is extracted from the buffer based on the found index.
//    - The line data is converted to a string.
//    - The buffer is updated to remove the processed line data.
//    - If the line data is equal to `BREAK_LINE_SYMBOL` (empty line), the loop continues to the next iteration.
//    - Otherwise, the line data is processed to convert it into an NDJSON line.
//    - An empty array `NDJSONLine` is created, and a copy of the headers array is made.
//    - The line data is split by the CSV delimiter, and each item is processed.
//    - The first header is popped from the headers array, and the item value is obtained after removing any `BREAK_LINE_SYMBOL` occurrences.
//    - If the key and value are the same, indicating an empty field, the loop breaks.
//    - Otherwise, the key-value pair is formatted as a JSON string and added to the `NDJSONLine` array.
//    - If the `NDJSONLine` array is empty, the loop continues to the next iteration.
//    - The `NDJSONLine` array is joined with commas to form a string `NDJSONData`.
//    - The NDJSON data string is enclosed within curly braces, followed by `BREAK_LINE_SYMBOL`.
//    - The NDJSON data is yielded as a Buffer from the generator.

// 9. The `_transform` method is implemented as required by the Transform stream.
//    - It receives a `chunk` of data, an `encoding` parameter (not used in this code), and a `callback` function to signal the completion of processing.
//    - The `updateBuffer` generator is invoked with the chunk of data.
//    - The generated items are pushed to the Transform stream using `this.push`.
//    - Finally, the

//  callback is called to indicate the completion of the transformation.

// Overall, this code converts CSV data into NDJSON format by splitting the lines, mapping the CSV fields to JSON key-value pairs, and outputting each line as a separate NDJSON object.

import { Transform, TransformOptions } from "node:stream";
import { TransformCallback } from "stream";

type CSVToNDJSONProps = {
  delimiter: ",";
  header: string[];
};

const BREAK_LINE_SYMBOL = "\n";
const INDEX_NOT_FOUND = -1;
export class CSVToNDJSON extends Transform {
  private buffer: Buffer = Buffer.alloc(0);

  constructor(private props: CSVToNDJSONProps, options?: TransformOptions) {
    super(options);
  }

  //Async iterator responsible to get a buffer until it finds a break line
  //Then
  private *updateBuffer(chunk: any) {
    //Buffer is an array, as we are concatenating them we use Buffer.concat
    //Then we move it the concatenated value to this.buffer
    // Concatenate the incoming chunk with the buffer
    this.buffer = Buffer.concat([this.buffer, chunk]);
    let breakLineIndex = 0;
    // Continue the loop until no more complete lines are found in the buffer
    while (breakLineIndex !== INDEX_NOT_FOUND) {
      //To find the breakLineIndex, we search for the position in this.buffer,of where the breakline symbol is
      //As our breakline symbol is a string, we convert it to buffer before
      //This way 'indexOf' can find the buffer version of breakline symbol
      // Find the index of the next occurrence of the break line symbol in the buffer

      breakLineIndex = this.buffer.indexOf(Buffer.from(BREAK_LINE_SYMBOL));
      //If you find the breakline, stop processing
      // If no more occurrence is found, exit the loop

      if (breakLineIndex === INDEX_NOT_FOUND) break;

      const lineDataIndex = breakLineIndex + BREAK_LINE_SYMBOL.length;
      // Extract the line data from the buffer up to the line break
      const line = this.buffer.subarray(0, lineDataIndex);
      // Convert the line data to a string
      const lineData = line.toString();

      // Remove from the main buffer the data already processed line data
      this.buffer = this.buffer.subarray(lineDataIndex);

      // Skip the iteration if the line data is empty (contains only the break line symbol)
      if (lineData === BREAK_LINE_SYMBOL) continue;

      // Process the line data to convert it into an NDJSON line
      const NDJSONLine = [];
      // Create a copy of the headers array
      const headers = Array.from(this.props.header);

      // Split the line data by the CSV delimiter and process each item
      for (const item of lineData.split(this.props.delimiter)) {
        // Get the first header from the headers array
        const key = headers.shift();
        // Remove any occurrence of the break line symbol from the item value
        const value = item.replace(BREAK_LINE_SYMBOL, "");
        // If the key and value are the same, indicating an empty field, exit the loop
        if (key === value) break;
        // Format the key-value pair as a JSON string and add it to the NDJSONLine array
        NDJSONLine.push(`"${key}":"${value}"`);
      }
      // If the NDJSONLine array is empty, skip the iteration
      if (!NDJSONLine.length) continue;
      // Join the NDJSONLine array with commas to form the NDJSON data string
      const NDJSONData = NDJSONLine.join(",");
      // Enclose the NDJSON data string within curly braces and add the break line symbol
      yield Buffer.from(
        "{".concat(NDJSONData).concat("}").concat(BREAK_LINE_SYMBOL)
      );
    }
  }

  _transform(
    chunk: any,
    encoding: BufferEncoding,
    callback: TransformCallback
  ): void {
    // Process the chunk and push the generated items to the Transform stream
    for (const item of this.updateBuffer(chunk)) {
      this.push(item);
    }
    // Signal the completion of processing by calling the callback function

    return callback();
  }
}
