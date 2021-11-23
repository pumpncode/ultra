import React from "https://esm.sh/react@18.0.0-alpha-bc9bb87c2-20210917"

export default function Spinner({ active = true }) {
  return (
    <div
      className={["spinner", active && "spinner--active"].join(" ")}
      role="progressbar"
      aria-busy={active ? "true" : "false"}
    />
  );
}
