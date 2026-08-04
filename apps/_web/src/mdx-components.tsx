import type { MDXComponents } from "mdx/types";
import { Mermaid } from "./components/mdx/mermaid";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Mermaid,
    h1: (props) => <h1 className="text-3xl font-semibold tracking-tight text-balance" {...props} />,
    h2: (props) => (
      <h2
        className="mt-10 border-b border-border pb-2 text-2xl font-semibold tracking-tight text-balance"
        {...props}
      />
    ),
    h3: (props) => <h3 className="mt-8 text-xl font-semibold tracking-tight" {...props} />,
    h4: (props) => <h4 className="mt-6 text-base font-semibold" {...props} />,
    p: (props) => <p className="mt-4 leading-7" {...props} />,
    a: (props) => (
      <a
        className="font-medium text-link underline underline-offset-4 hover:opacity-80"
        {...props}
      />
    ),
    code: (props) => (
      <code
        className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground"
        {...props}
      />
    ),
    pre: (props) => (
      <pre
        className="my-5 overflow-x-auto rounded-lg border border-border bg-muted p-4 font-mono text-sm leading-6"
        {...props}
      />
    ),
    ul: (props) => (
      <ul className="my-5 list-disc space-y-2 pl-6 marker:text-muted-foreground" {...props} />
    ),
    ol: (props) => (
      <ol className="my-5 list-decimal space-y-2 pl-6 marker:text-muted-foreground" {...props} />
    ),
    li: (props) => <li className="leading-7" {...props} />,
    table: (props) => (
      <div className="my-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-sm" {...props} />
      </div>
    ),
    th: (props) => (
      <th
        className="border-b border-border bg-muted px-4 py-2.5 text-left font-medium text-foreground"
        {...props}
      />
    ),
    td: (props) => <td className="border-b border-border/60 px-4 py-2.5 align-top" {...props} />,
    blockquote: (props) => (
      <blockquote
        className="my-5 border-l-2 border-primary pl-4 italic text-muted-foreground"
        {...props}
      />
    ),
    hr: (props) => <hr className="my-10 border-border" {...props} />,
    strong: (props) => <strong className="font-semibold text-foreground" {...props} />,
    ...components,
  };
}
