import * as esbuild from "https://deno.land/x/esbuild@v0.12.24/mod.js";
import { Parser as AcornParser } from "https://esm.sh/acorn";
import jsx from "https://esm.sh/acorn-jsx";
import { parse, print } from "https://raw.githubusercontent.com/pumpncode/recast/deno/main.ts";

import type {
  CallExpression,
  VariableDeclarator
} from "https://deno.land/x/swc@0.1.4/types/options.ts";
import { TransformOptions } from "./types.ts";

const isDev = Deno.env.get("mode") === "dev";
const serverStart = +new Date();

const transform = async (
  { source, importmap, root, loader = "tsx" }: TransformOptions,
) => {
  const { code } = await esbuild.transform(source, {
    loader,
    target: ["esnext"],
    minify: !isDev,
  });

  const ast = parse(code, {
    parser: {
      parse(source) {
        return AcornParser.extend(jsx()).parse(source, {
          ecmaVersion: "latest",
          sourceType: "module",
          locations: true
        })
      }
    }
  });

  ast.program.body = ast.program.body.map((node) => {
    const newNode = {...node};

    const {
      type
    } = newNode;

    if ([
      "ImportDeclaration",
      "ExportNamedDeclaration",
      "ExportAllDeclaration"
    ].includes(type)) {
      const {
        source: {
          value
        }
      } = newNode;

      // @ts-ignore ???
      newNode.source.value = importmap?.imports?.[value] || value.replace(
        /\.(j|t)sx?/gi,
        () => `.js?ts=${isDev ? Date.now() : serverStart}`,
      );
    }
    else if (type === "VariableDeclaration") {
      const {
        declarations
      } = newNode;

      const newDeclarations = declarations.map((declarator) => {
        const newDeclarator = {...declarator} as Omit<VariableDeclarator, "init"> & {
          init: CallExpression
        };

        const {
          init: {
            arguments: initArguments
          }
        } = newDeclarator;

        if (initArguments) {
          const newInitArguments = initArguments.map((argument) => {
            const newArgument = {...argument};
  
            const {
              expression: {
                body: {
                  arguments: bodyArguments,
                  callee: {
                    value
                  }
                }
              }
            } = newArgument;
  
            if (value.toLocaleLowerCase() === "import") {
              const newBodyArguments = bodyArguments.map((bodyArgument) => {
                const newBodyArgument = {
                  ...bodyArgument,
                  value: value.replace(
                    /\.(j|t)sx?/gi,
                    () => `.js?ts=${isDev ? Date.now() : serverStart}`,
                  )
                }
                return newBodyArgument;
              })
  
              newArgument.body.arguments = newBodyArguments;
            }
  
            return newArgument;
          });
          
          newDeclarator.init.arguments = newInitArguments;
        }

        return newDeclarator;
      })

      newNode.declarations = newDeclarations
    }

    return newNode;
  })

  return print(ast).code;
}

export default transform;
