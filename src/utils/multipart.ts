/**
  MIT License

  Copyright (c) 2021 The Free Software Factory

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.

  https://github.com/nachomazzara/parse-multipart-data
  https://github.com/freesoftwarefactory/parse-multipart
 */

type Part = {
  contentDispositionHeader: string;
  contentTypeHeader: string;
  part: number[];
};

type Input = {
  filename?: string;
  name?: string;
  type: string;
  data: Buffer;
};

enum ParsingState {
  INIT,
  READING_HEADERS,
  READING_DATA,
  READING_PART_SEPARATOR,
}

export function parse(multipartBodyBuffer: Buffer, boundary: string): Input[] {
  let lastline = "";
  let contentDispositionHeader = "";
  let contentTypeHeader = "";
  let state: ParsingState = ParsingState.INIT;
  let buffer: number[] = [];
  const allParts: Input[] = [];

  let currentPartHeaders: string[] = [];

  for (let i = 0; i < multipartBodyBuffer.length; i++) {
    const oneByte: number = multipartBodyBuffer[i];
    const prevByte: number | null = i > 0 ? multipartBodyBuffer[i - 1] : null;
    // 0x0a => \n
    // 0x0d => \r
    const newLineDetected: boolean = oneByte === 0x0a && prevByte === 0x0d;
    const newLineChar: boolean = oneByte === 0x0a || oneByte === 0x0d;

    if (!newLineChar) {
      lastline += String.fromCodePoint(oneByte);
    }
    if (ParsingState.INIT === state && newLineDetected) {
      // searching for boundary
      if ("--" + boundary === lastline) {
        state = ParsingState.READING_HEADERS; // found boundary. start reading headers
      }
      lastline = "";
    } else if (ParsingState.READING_HEADERS === state && newLineDetected) {
      // parsing headers. Headers are separated by an empty line from the content. Stop reading headers when the line is empty
      if (lastline.length > 0) {
        currentPartHeaders.push(lastline);
      } else {
        // found empty line. search for the headers we want and set the values
        for (const h of currentPartHeaders) {
          if (h.toLowerCase().startsWith("content-disposition:")) {
            contentDispositionHeader = h;
          } else if (h.toLowerCase().startsWith("content-type:")) {
            contentTypeHeader = h;
          }
        }
        state = ParsingState.READING_DATA;
        buffer = [];
      }
      lastline = "";
    } else if (ParsingState.READING_DATA === state) {
      // parsing data
      if (lastline.length > boundary.length + 4) {
        lastline = ""; // mem save
      }
      if ("--" + boundary === lastline) {
        const j = buffer.length - lastline.length;
        const part = buffer.slice(0, j - 1);

        allParts.push(
          process({ contentDispositionHeader, contentTypeHeader, part })
        );
        buffer = [];
        currentPartHeaders = [];
        lastline = "";
        state = ParsingState.READING_PART_SEPARATOR;
        contentDispositionHeader = "";
        contentTypeHeader = "";
      } else {
        buffer.push(oneByte);
      }
      if (newLineDetected) {
        lastline = "";
      }
    } else if (
      ParsingState.READING_PART_SEPARATOR === state &&
      newLineDetected
    ) {
      state = ParsingState.READING_HEADERS;
    }
  }
  return allParts;
}

//  read the boundary from the content-type header sent by the http client
//  this value may be similar to:
//  'multipart/form-data; boundary=----WebKitFormBoundaryvm5A9tzU1ONaGP5B',
export function getBoundary(header: string): string {
  const items = header.split(";");
  if (items) {
    for (const item_ of items) {
      const item = String(item_).trim();
      if (item.includes("boundary")) {
        const k = item.split("=");
        return String(k[1])
          .trim()
          .replace(/^["']|["']$/g, "");
      }
    }
  }
  return "";
}

function process(part: Part): Input {
  // will transform this object:
  // { header: 'Content-Disposition: form-data; name="uploads[]"; filename="A.txt"',
  // info: 'Content-Type: text/plain',
  // part: 'AAAABBBB' }
  // into this one:
  // { filename: 'A.txt', type: 'text/plain', data: <Buffer 41 41 41 41 42 42 42 42> }
  const obj = function (str: string) {
    const k = str.split("=");
    const a = k[0].trim();

    const b = JSON.parse(k[1].trim());
    const o = {};
    Object.defineProperty(o, a, {
      value: b,
      writable: true,
      enumerable: true,
      configurable: true,
    });
    return o;
  };
  const header = part.contentDispositionHeader.split(";");

  const filenameData = header[2];
  let input = {};
  if (filenameData) {
    input = obj(filenameData);
    const contentType = part.contentTypeHeader.split(":")[1].trim();
    Object.defineProperty(input, "type", {
      value: contentType,
      writable: true,
      enumerable: true,
      configurable: true,
    });
  }
  // always process the name field
  Object.defineProperty(input, "name", {
    value: header[1].split("=")[1].replace(/"/g, ""),
    writable: true,
    enumerable: true,
    configurable: true,
  });

  Object.defineProperty(input, "data", {
    value: Buffer.from(part.part),
    writable: true,
    enumerable: true,
    configurable: true,
  });
  return input as Input;
}
