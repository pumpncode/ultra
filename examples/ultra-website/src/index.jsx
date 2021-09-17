import React, { Suspense } from "react";
import useSWR from "swr";

const fetcher = (url) => fetch(url).then((r) => r.json());

const link =
  "https://github.com/exhibitionist-digital/ultra/tree/master/examples";



const Index = () => {
  return (
    <main>
      <img
        className="logo"
        alt="ultra"
        src="/logo.svg"
        height="350"
      />
      <h1>Ultra</h1>
      <h2>Deno + React: No&nbsp;build, no&nbsp;bundle, all&nbsp;streaming</h2>
      <a
        className="gh"
        target="_blank"
        href="https://github.com/exhibitionist-digital/ultra"
        rel="noopener"
      >
        View on GitHub
      </a>
      
    </main>
  );
};

export default Index;
