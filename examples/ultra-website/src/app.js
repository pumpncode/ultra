import React, { lazy, Suspense } from "https://esm.sh/react@18.0.0-alpha-67f38366a-20210830?no-check";
import { Helmet } from "https://esm.sh/react-helmet-async?deps=react@18.0.0-alpha-67f38366a-20210830&bundle&no-check";
import { Route } from "https://esm.sh/wouter?deps=react@18.0.0-alpha-67f38366a-20210830&bundle&no-check";
import { SWRConfig } from "https://esm.sh/swr@1.0.0?deps=react@18.0.0-alpha-67f38366a-20210830&bundle&no-check";
import ultraCache from "https://deno.land/x/ultra@v0.3/cache.js";
import Index from "./index.js?ts=1631917426826";
const options = (cache) => ({
  provider: () => ultraCache(cache),
  revalidateIfStale: false,
  revalidateOnMount: false,
  suspense: true
});
const Ultra = ({ cache }) => {
  return /* @__PURE__ */ React.createElement(SWRConfig, {
    value: options(cache)
  }, /* @__PURE__ */ React.createElement(Helmet, null, /* @__PURE__ */ React.createElement("meta", {
    name: "viewport",
    content: "width=device-width, initial-scale=1"
  }), /* @__PURE__ */ React.createElement("meta", {
    charset: "UTF-8"
  }), /* @__PURE__ */ React.createElement("link", {
    rel: "stylesheet",
    href: "/style.css?ultra"
  }), /* @__PURE__ */ React.createElement("title", null, "Ultra"), /* @__PURE__ */ React.createElement("meta", {
    name: "description",
    content: "Deno + React: No build, No bundle, All streaming"
  }), /* @__PURE__ */ React.createElement("link", {
    rel: "icon",
    type: "image/svg+xml",
    href: "https://ultrajs.dev/logo.svg"
  }), /* @__PURE__ */ React.createElement("meta", {
    property: "og:image",
    content: "https://ultrajs.dev/screen.jpg"
  }), /* @__PURE__ */ React.createElement("meta", {
    name: "twitter:card",
    content: "summary_large_image"
  })), /* @__PURE__ */ React.createElement(Suspense, {
    fallback: null
  }, /* @__PURE__ */ React.createElement(Route, {
    path: "/"
  }, /* @__PURE__ */ React.createElement(Index, null))));
};
export default Ultra;
