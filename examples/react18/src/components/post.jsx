import React from "https://esm.sh/react@18.0.0-alpha-bc9bb87c2-20210917"

export default function Post() {
  return (
    <>
      <h1>Hello world</h1>
      <p>
        This demo is <b>artificially slowed down</b>. Open{" "}
        <code>components/comments.js</code>{" "}
        to adjust how much different things are slowed down.
      </p>
      <p>
        Notice how HTML for comments "streams in" before the JS (or React) has
        loaded on the page.
      </p>
      <p>
        Also notice that the JS for comments and sidebar has been code-split,
        but HTML for it is still included in the server output.
      </p>
    </>
  );
}
