/*
Implementation based on:
  - https://github.com/nachomazzara/parse-multipart-data - Ref: a44c95319d09fd7d7ba51e01512567c444b90e14
  - https://github.com/freesoftwarefactory/parse-multipart

By:
  - Cristian Salazar (christiansalazarh@gmail.com) www.chileshift.cl - Twitter: @AmazonAwsChile
  - Ignacio Mazzara - https://imazzara.com - Twitter: @nachomazzara

---

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
**/

export interface MultiPartData {
  data: Buffer;
  name?: string;
  filename?: string;
  type?: string;
}

enum ParsingState {
  INIT,
  READING_HEADERS,
  READING_DATA,
  READING_PART_SEPARATOR,
}

export function parse(
  multipartBodyBuffer: Buffer,
  boundary: string
): MultiPartData[] {
  let lastline = "";
  let state: ParsingState = ParsingState.INIT;
  let buffer: number[] = [];
  const allParts: MultiPartData[] = [];

  let currentPartHeaders: [string, string][] = [];

  for (let i = 0; i < multipartBodyBuffer.length; i++) {
    const prevByte: number | null = i > 0 ? multipartBodyBuffer[i - 1] : null;
    const currByte: number = multipartBodyBuffer[i];

    // 0x0a => \n | 0x0d => \r
    const newLineChar: boolean = currByte === 0x0a || currByte === 0x0d;
    if (!newLineChar) {
      lastline += String.fromCodePoint(currByte);
    }

    const newLineDetected: boolean = currByte === 0x0a && prevByte === 0x0d;
    if (ParsingState.INIT === state && newLineDetected) {
      // Searching for boundary
      if ("--" + boundary === lastline) {
        state = ParsingState.READING_HEADERS; // Found boundary. start reading headers
      }
      lastline = "";
    } else if (ParsingState.READING_HEADERS === state && newLineDetected) {
      // Parsing headers.
      // Headers are separated by an empty line from the content.
      // Stop reading headers when the line is empty
      if (lastline.length > 0) {
        const i = lastline.indexOf(":");
        if (i > 0) {
          const name = lastline.slice(0, i).toLowerCase();
          const value = lastline.slice(i + 1).trim();
          currentPartHeaders.push([name, value]);
        }
      } else {
        // Found empty line.
        // Reading headers is finished.
        state = ParsingState.READING_DATA;
        buffer = [];
      }
      lastline = "";
    } else if (ParsingState.READING_DATA === state) {
      // Parsing data
      if (lastline.length > boundary.length + 4) {
        lastline = ""; // Free memory
      }
      if ("--" + boundary === lastline) {
        const j = buffer.length - lastline.length;
        const part = buffer.slice(0, j - 1);
        allParts.push(process(part, currentPartHeaders));
        buffer = [];
        currentPartHeaders = [];
        lastline = "";
        state = ParsingState.READING_PART_SEPARATOR;
      } else {
        buffer.push(currByte);
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

function process(data: number[], headers: [string, string][]): MultiPartData {
  const dataObj: Partial<MultiPartData> = {};

  // Meta
  const contentDispositionHeader =
    headers.find((h) => h[0] === "content-disposition")?.[1] || "";
  for (const i of contentDispositionHeader.split(";")) {
    const s = i.split("=");
    if (s.length !== 2) {
      continue;
    }
    const key = (s[0] || "").trim();
    if (key === "name" || key === "filename") {
      const _value = (s[1] || "").trim().replace(/"/g, "");
      dataObj[key] = Buffer.from(_value, "latin1").toString("utf8");
    }
  }

  // Type
  const contentType = headers.find((h) => h[0] === "content-type")?.[1] || "";
  if (contentType) {
    dataObj.type = contentType;
  }

  // Data
  dataObj.data = Buffer.from(data);

  return dataObj as MultiPartData;
}
