import React, {
  Suspense,
} from "https://esm.sh/react@18.0.0-alpha-67f38366a-20210830?no-check";
import useSWR from "https://esm.sh/swr@1.0.0?deps=react@18.0.0-alpha-67f38366a-20210830&bundle&no-check";
const fetcher = (url) => fetch(url).then((r) => r.json());
const link =
  "https://github.com/exhibitionist-digital/ultra/tree/master/examples";
const Examples = () => {
  const { data } = useSWR(`http://localhost:8080/data.json`, fetcher);
  const { examples } = data;
  return /* @__PURE__ */ React.createElement(
    React.Fragment,
    null,
    /* @__PURE__ */ React.createElement("h3", null, "Check out these examples"),
    /* @__PURE__ */ React.createElement(
      "section",
      null,
      examples.map((ex) =>
        /* @__PURE__ */ React.createElement(
          "a",
          {
            target: "_blank",
            href: ex.url,
            className: "ex",
            rel: "noopener",
          },
          /* @__PURE__ */ React.createElement("div", {
            className: "emoji",
          }, ex.emoji),
          /* @__PURE__ */ React.createElement("strong", null, ex.title),
          /* @__PURE__ */ React.createElement("p", null, ex.description),
        )
      ),
    ),
    /* @__PURE__ */ React.createElement(
      "p",
      null,
      "Source code for these can be found on\xA0",
      /* @__PURE__ */ React.createElement("a", {
        href: link,
        target: "_blank",
        rel: "noopener",
      }, "GitHub"),
    ),
    /* @__PURE__ */ React.createElement(
      "h4",
      null,
      "Go ahead, run Lighthouse, we dare you",
    ),
    /* @__PURE__ */ React.createElement("img", {
      className: "lighthouse",
      width: "100%",
      height: "auto",
      alt: "perfect lighthouse score",
      src: "/lighthouse.png",
    }),
  );
};
const Index = () => {
  return /* @__PURE__ */ React.createElement(
    "main",
    null,
    /* @__PURE__ */ React.createElement("img", {
      className: "logo",
      alt: "ultra",
      src: "/logo.svg",
      height: "350",
    }),
    /* @__PURE__ */ React.createElement("h1", null, "Ultra"),
    /* @__PURE__ */ React.createElement(
      "h2",
      null,
      "Deno + React: No\xA0build, no\xA0bundle, all\xA0streaming",
    ),
    /* @__PURE__ */ React.createElement("a", {
      className: "gh",
      target: "_blank",
      href: "https://github.com/exhibitionist-digital/ultra",
      rel: "noopener",
    }, "View on GitHub"),
    /* @__PURE__ */ React.createElement(Suspense, {
      fallback: null,
    }, /* @__PURE__ */ React.createElement(Examples, null)),
  );
};
export default Index;
