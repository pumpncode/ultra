import e,{Suspense as n}from"https://esm.sh/react@18.0.0-alpha-67f38366a-20210830?no-check";import r from"https://esm.sh/swr@1.0.0?deps=react@18.0.0-alpha-67f38366a-20210830&bundle&no-check";const i=o=>fetch(o).then(t=>t.json()),l="https://github.com/exhibitionist-digital/ultra/tree/master/examples",h=()=>{const{data:o}=r("https://ultra.deno.dev/data.json",i),{examples:t}=o;return e.createElement(e.Fragment,null,e.createElement("h3",null,"Check out these examples"),e.createElement("section",null,t.map(s=>e.createElement("a",{target:"_blank",href:s.url,className:"ex",rel:"noopener"},e.createElement("div",{className:"emoji"},s.emoji),e.createElement("strong",null,s.title),e.createElement("p",null,s.description)))),e.createElement("p",null,"Source code for these can be found on\xA0",e.createElement("a",{href:l,target:"_blank",rel:"noopener"},"GitHub")),e.createElement("h4",null,"Go ahead, run Lighthouse, we dare you"),e.createElement("img",{className:"lighthouse",width:"100%",height:"auto",alt:"perfect lighthouse score",src:"/lighthouse.png"}))},a=()=>e.createElement("main",null,e.createElement("img",{className:"logo",alt:"ultra",src:"/logo.svg",height:"350"}),e.createElement("h1",null,"Ultra"),e.createElement("h2",null,"Deno + React: No\xA0build, no\xA0bundle, all\xA0streaming"),e.createElement("a",{className:"gh",target:"_blank",href:"https://github.com/exhibitionist-digital/ultra",rel:"noopener"},"View on GitHub"),e.createElement(n,{fallback:null},e.createElement(h,null)));export default a;
