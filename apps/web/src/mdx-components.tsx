import { Callout, CodeContainer, TableWrapper } from "@zomlab/ui/components/docs";
import { cn } from "@zomlab/ui/lib/utils";
import type { MDXComponents } from "mdx/types";
import { Mermaid } from "./components/mdx/mermaid";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Mermaid,
    Callout,
    h1: (props) => (
      <h1
        className="text-balance text-3xl font-semibold tracking-[-0.035em] sm:text-4xl"
        {...props}
      />
    ),
    h2: (props) => (
      <h2
        className="mt-12 scroll-mt-24 border-b border-border-subtle pb-3 text-balance text-2xl font-semibold tracking-[-0.025em]"
        {...props}
      />
    ),
    h3: (props) => (
      <h3 className="mt-9 scroll-mt-24 text-xl font-semibold tracking-tight" {...props} />
    ),
    h4: (props) => <h4 className="mt-6 text-base font-semibold" {...props} />,
    p: (props) => <p className="mt-4 max-w-[72ch] leading-7 text-muted-foreground" {...props} />,
    a: (props) => (
      <a
        className="font-medium text-link underline underline-offset-4 hover:opacity-80"
        {...props}
      />
    ),
    code: ({ className, ...props }) => (
      <code
        className={cn(
          "rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground",
          className,
        )}
        {...props}
      />
    ),
    pre: ({ className, ...props }) => (
      <CodeContainer>
        <pre
          className={cn("m-0 overflow-x-auto p-4 font-mono text-sm leading-6", className)}
          {...props}
        />
      </CodeContainer>
    ),
    ul: (props) => (
      <ul className="my-5 list-disc space-y-2 pl-6 marker:text-muted-foreground" {...props} />
    ),
    ol: (props) => (
      <ol className="my-5 list-decimal space-y-2 pl-6 marker:text-muted-foreground" {...props} />
    ),
    li: (props) => <li className="leading-7" {...props} />,
    table: (props) => (
      <TableWrapper>
        <table className="w-full border-collapse text-sm" {...props} />
      </TableWrapper>
    ),
    th: (props) => (
      <th
        className="border-b border-border bg-surface-muted px-4 py-2.5 text-left font-medium text-foreground"
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
    img: ({ alt, ...props }) => (
      <img
        alt={alt ?? ""}
        className="my-6 h-auto max-w-full rounded-xl bg-surface-muted shadow-surface"
        loading="lazy"
        {...props}
      />
    ),
    strong: (props) => <strong className="font-semibold text-foreground" {...props} />,
    ...components,
  };
}
