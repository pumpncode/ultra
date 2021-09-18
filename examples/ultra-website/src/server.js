// example of a build script for deno deploy...
// to run => $ deployctl run server.js

import app from "./app.js";
import React from "https://esm.sh/react@18.0.0-alpha-bc9bb87c2-20210917?no-check";
import ReactDOM from "https://esm.sh/react-dom@18.0.0-alpha-bc9bb87c2-20210917/server?no-check";
import { Router } from "https://esm.sh/wouter?deps=react@18.0.0-alpha-bc9bb87c2-20210917&bundle&no-check";
import { HelmetProvider } from "https://esm.sh/react-helmet-async?deps=react@18.0.0-alpha-bc9bb87c2-20210917&bundle&no-check";
import { lookup } from "https://deno.land/x/media_types/mod.ts";
import { Buffer } from "https://deno.land/std@0.107.0/io/mod.ts";
import { concat } from "https://deno.land/std@0.107.0/bytes/mod.ts";

const defaultBufferSize = 8 * 1024;
const defaultChunkSize = 8 * 1024;

// build log from pages
const buildFiles = [
  "/app.js",
  "/app.jsx",
  "/data.json",
  "/index.js",
  "/index.jsx",
  "/lighthouse.png",
  "/logo.svg",
  "/robots.txt",
  "/screen.jpg",
  "/style.css",
];

// import map (from pages?)
const importmap = {
  "imports": {
    "react": "https://esm.sh/react@18.0.0-alpha-bc9bb87c2-20210917?no-check",
    "react-dom":
      "https://esm.sh/react-dom@18.0.0-alpha-bc9bb87c2-20210917?no-check",
    "react-dom/server":
      "https://esm.sh/react-dom@18.0.0-alpha-bc9bb87c2-20210917/server?no-check",
    "helmet":
      "https://esm.sh/react-helmet-async?deps=react@18.0.0-alpha-bc9bb87c2-20210917&bundle&no-check",
    "wouter":
      "https://esm.sh/wouter?deps=react@18.0.0-alpha-bc9bb87c2-20210917&bundle&no-check",
    "swr":
      "https://esm.sh/swr@1.0.0?deps=react@18.0.0-alpha-bc9bb87c2-20210917&bundle&no-check",
    "ultra/cache": "https://deno.land/x/ultra@v0.3/cache.js",
  },
};

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event));
});

async function handleRequest(event) {
  const url = new URL(event.request.url);

  // static files in pages
  if (buildFiles.indexOf(url.pathname) >= 0) {
    const file = await fetch(`https://ultra.pages.dev${url.pathname}`);
    return new Response(await file.text(), {
      headers: {
        "content-type": lookup(url.pathname),
      },
    });
  } else {
    return new Response(
      await render({
        pathname: url.pathname,
        importmap,
        lang: "en",
      }),
      {
        headers: {
          "content-type": lookup(".html"),
        },
      },
    );
  }
}

const render = async (
  {
    pathname,
    importmap,
    lang,
    bufferSize = defaultBufferSize,
    chunkSize = defaultChunkSize,
  },
) => {
  chunkSize = chunkSize ?? defaultChunkSize;

  const ts = +new Date();

  const helmetContext = { helmet: {} };
  const cache = new Map();

  // @ts-ignore there's no types for toreadablestream yet
  const body = ReactDOM.renderToReadableStream(
    React.createElement(
      Router,
      { hook: staticLocationHook(pathname) },
      React.createElement(
        HelmetProvider,
        { context: helmetContext },
        React.createElement(
          app,
          { cache },
          null,
        ),
      ),
    ),
  );

  const { helmet } = helmetContext;

  const head = `<!DOCTYPE html><html lang="${lang}"><head>${
    Object.keys(helmet)
      .map((i) => helmet[i].toString())
      .join("")
  }<script type="module" defer>import { createElement } from "${
    importmap.imports["react"]
  }";import { hydrateRoot } from "${
    importmap.imports["react-dom"]
  }";import { Router } from "${
    importmap.imports["wouter"]
  }";import { HelmetProvider } from "${
    importmap.imports["helmet"]
  }";import App from "/app.js";` +
    `const root = hydrateRoot(document.getElementById('ultra'),` +
    `createElement(Router, null, createElement(HelmetProvider, null, createElement(App))))` +
    `</script></head><body><div id="ultra">`;

  const tail = () =>
    `</div></body><script>self.__ultra = ${
      JSON.stringify(Array.from(cache.entries()))
    }</script></html>`;

  // body.getReader() can emit Uint8Arrays() or strings; our chunking expects
  // UTF-8 encoded Uint8Arrays at present, so this stream ensures everything
  // is encoded that way:
  const encodedStream = encodeStream(body);

  const bodyReader = encodedStream.getReader();

  // Buffer the first portion of the response before streaming; this allows
  // us to respond with correct server codes if the component contains errors,
  // but only if those errors occur within the buffered portion:
  const buffer = new Buffer();
  while (buffer.length < (bufferSize ?? defaultBufferSize)) {
    const read = await bodyReader.read();
    if (read.done) break;
    buffer.writeSync(read.value);
  }

  const combined = new ReadableStream({
    start(controller) {
      const queue = (part) => Promise.resolve(controller.enqueue(part));

      queue(head)
        .then(() => queue(buffer.bytes({ copy: false })))
        .then(() => pushBody(bodyReader, controller, chunkSize))
        .catch(async (e) => {
          console.error("readable stream error", e);

          // Might be possible to push something to the client that renders
          // an error if in 'dev mode' here, but the markup that precedes it
          // could very well be broken:
          await queue("Error");
        })
        .then(() => controller.enqueue(tail()))
        .then(() => controller.close());
    },
  });
  return encodeStream(combined);
};

const encodeStream = (readable) =>
  new ReadableStream({
    start(controller) {
      return (async () => {
        const enc = new TextEncoder();
        const rdr = readable.getReader();
        try {
          while (true) {
            const { value, done } = await rdr.read();
            if (done) break;

            if (typeof value === "string") {
              controller.enqueue(enc.encode(value));
            } else if (value instanceof Uint8Array) {
              controller.enqueue(value);
            } else {
              throw new TypeError();
            }
          }
        } finally {
          controller.close();
        }
      })();
    },
  });

async function pushBody(reader, controller, chunkSize) {
  let parts = [];
  let partsSize = 0;

  while (true) {
    const read = await reader.read();
    if (read.done) break;
    partsSize += read.value.length;
    parts.push(read.value);
    if (partsSize >= chunkSize) {
      const write = concat(...parts);
      parts = [];
      partsSize = 0;
      if (write.length > chunkSize) {
        parts.push(write.slice(chunkSize));
      }
     
      controller.enqueue(write.slice(0, chunkSize));
    }
  }
  
  controller.enqueue(concat(...parts));
}

const staticLocationHook = (path = "/", { record = false } = {}) => {
  let hook;
  const navigate = (to, { replace } = {}) => {
    if (record) {
      if (replace) {
        hook.history?.pop();
      }
      hook.history?.push(to);
    }
  };
  hook = () => [path, navigate];
  hook.history = [path];
  return hook;
};
