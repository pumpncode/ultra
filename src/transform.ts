import * as esbuild from "https://deno.land/x/esbuild@v0.14.14/mod.js";
import { Parser as AcornParser } from "https://esm.sh/acorn";
import jsx from "https://esm.sh/acorn-jsx";
import { parse, print, visit } from "https://cdn.jsdelivr.net/gh/pumpncode/recast@0.20.6-alpha/main.ts";

import {builders} from "https://esm.sh/ast-types";

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
        const comments: any[] = [];
        const tokens: any[] = [];
        
        const ast = AcornParser.extend(jsx()).parse(source, {
          ecmaVersion: "latest",
          sourceType: "module",
          locations: true,
          allowHashBang: true,
          allowImportExportEverywhere: true,
          allowReturnOutsideFunction: true,
          onComment: [],
          onToken: []
        })

        if (!ast.comments) {
          ast.comments = comments;
        }
      
        if (!ast.tokens) {
          ast.tokens = tokens;
        }

        return ast;
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
      if (newNode?.source?.value) {
        const {
          source: {
            value
          }
        } = newNode;
  
        // @ts-ignore ???
        newNode.source.value = importmap?.imports?.[value] || value.replace(
          /\.(j|t)sx?$/gi,
          () => `.js?ts=${isDev ? Date.now() : serverStart}`,
        );
      }
      
    }
    else if (type === "VariableDeclaration") {
      const {
        declarations
      } = newNode;

      const newDeclarations = declarations.map((declarator) => {
        const newDeclarator = {...declarator} as Omit<VariableDeclarator, "init"> & {
          init: CallExpression
        };

        if (newDeclarator?.init?.arguments) {
          const {
            init: {
              arguments: initArguments
            }
          } = newDeclarator;
  
          if (initArguments) {
            const newInitArguments = initArguments.map((argument) => {
              const newArgument = {...argument};
  
              if (newArgument?.expression?.body) {
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
                      value: importmap?.imports?.[value] || value.replace(
                        /\.(j|t)sx?$/gi,
                        () => `.js?ts=${isDev ? Date.now() : serverStart}`,
                      )
                    }
                    return newBodyArgument;
                  })
      
                  newArgument.body.arguments = newBodyArguments;
                }
              }
  
              return newArgument;
            });
            
            newDeclarator.init.arguments = newInitArguments;
          }
  
          
        }

        return newDeclarator;
      })

      newNode.declarations = newDeclarations
    }

    return newNode;
  })

  try {
    visit(
      ast,
      {
        visitImportExpression(path) {
          const source = path.get("source");

          const {
            node: {
              type: childType
            }
          } = source;

          if (childType === "TemplateLiteral") {
            const quasis = source.get("quasis");
  
            const lastPart = quasis.get(quasis.value.length - 1);
    
            const {
              value: {
                value: {
                  raw,
                  cooked
                },
                tail
              }
            } = lastPart;
    
            lastPart.replace(
              builders.templateElement(
                {
                  raw: importmap?.imports?.[raw] || raw.replace(
                    /\.(j|t)sx?$/gi,
                    () => `.js?ts=${isDev ? Date.now() : serverStart}`
                  ),
                  cooked: importmap?.imports?.[cooked] || cooked.replace(
                    /\.(j|t)sx?$/gi,
                    () => `.js?ts=${isDev ? Date.now() : serverStart}`
                  )
                },
                tail
              )
            )
    
          }
          else if (childType === "Literal") {
            const {
              value
            } = source.get("value");

            source.replace(
              builders.literal(
                importmap?.imports?.[value] || value.replace(
                  /\.(j|t)sx?$/gi,
                  () => `.js?ts=${isDev ? Date.now() : serverStart}`
                )
              )
            ) 
          }
  
          this.traverse(path);
        }
      }
    );
  } catch {
    // no catch
  }

  return print(ast).code;
}

export default transform;
