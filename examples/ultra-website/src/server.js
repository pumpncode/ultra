import app from "./app.js";
import React from "https://esm.sh/react@18.0.0-alpha-67f38366a-20210830?no-check";
import ReactDOM from "https://esm.sh/react-dom@18.0.0-alpha-67f38366a-20210830/server?no-check";
import { Router } from "https://esm.sh/wouter?deps=react@18.0.0-alpha-67f38366a-20210830&bundle&no-check";
import { HelmetProvider } from "https://esm.sh/react-helmet-async?deps=react@18.0.0-alpha-67f38366a-20210830&bundle&no-check";
import { lookup } from "https://deno.land/x/media_types/mod.ts";

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
    "react": "https://esm.sh/react@18.0.0-alpha-67f38366a-20210830?no-check",
    "react-dom":
      "https://esm.sh/react-dom@18.0.0-alpha-67f38366a-20210830?no-check",
    "react-dom/server":
      "https://esm.sh/react-dom@18.0.0-alpha-67f38366a-20210830/server?no-check",
    "helmet":
      "https://esm.sh/react-helmet-async?deps=react@18.0.0-alpha-67f38366a-20210830&bundle&no-check",
    "wouter":
      "https://esm.sh/wouter?deps=react@18.0.0-alpha-67f38366a-20210830&bundle&no-check",
    "swr":
      "https://esm.sh/swr@1.0.0?deps=react@18.0.0-alpha-67f38366a-20210830&bundle&no-check",
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

const render = async ({ pathname, importmap, lang }) => {
  console.log({pathname})
  const ts = +new Date();
  const helmetContext = { helmet: {} };
  const cache = new Map();
  const body = ReactDOM.renderToReadableStream(
    React.createElement(
      Router,
      { hook: staticLocationHook(pathname) },
      React.createElement(
        HelmetProvider,
        { context: helmetContext },
        React.createElement(app, { cache }, null),
      ),
    ),
  );
  const { helmet } = helmetContext;
  console.log({ helmet });
  const head = `<!DOCTYPE html><html lang="${lang}"><head>${
    Object.keys(helmet).map((i) => helmet[i].toString()).join("")
  }<script type="module" defer>import { createElement } from "${
    importmap.imports["react"]
  }";import { hydrateRoot } from "${
    importmap.imports["react-dom"]
  }";import { Router } from "${
    importmap.imports["wouter"]
  }";import { HelmetProvider } from "${
    importmap.imports["helmet"]
  }";import App from "/app.js";const root = hydrateRoot(document.getElementById('ultra'),createElement(Router, null, createElement(HelmetProvider, null, createElement(App))))<\/script></head><body><div id="ultra">`;
  console.log({ head });
  return head
  return new ReadableStream({
    start(controller) {
      function pushStream(stream) {
        const reader = stream.getReader();
        return reader.read().then(
          function process(result) {
            if (result.done) return;
            try {
              controller.enqueue(result.value);
              return reader.read().then(process);
            } catch (_e) {
              return;
            }
          },
        );
      }
      const queue = (part) => Promise.resolve(controller.enqueue(part));

      queue(head)
        .then(() => controller.close());
    },
  });
};

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
