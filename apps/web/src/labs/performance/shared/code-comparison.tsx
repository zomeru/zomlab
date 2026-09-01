import { CodeContainer } from "@zomlab/ui/components/docs";

export function CodeComparison({ after, before }: { after: string; before: string }) {
  return (
    <section aria-labelledby="code-comparison-heading">
      <h2 className="text-xl font-semibold tracking-tight" id="code-comparison-heading">
        Before and after code
      </h2>
      <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-2">
        <CodeContainer className="m-0 min-w-0" label="BEFORE">
          <pre className="max-h-[30rem] max-w-full overflow-auto overscroll-contain p-4 text-xs leading-relaxed">
            <code>{before}</code>
          </pre>
        </CodeContainer>
        <CodeContainer className="m-0 min-w-0" label="AFTER">
          <pre className="max-h-[30rem] max-w-full overflow-auto overscroll-contain p-4 text-xs leading-relaxed">
            <code>{after}</code>
          </pre>
        </CodeContainer>
      </div>
    </section>
  );
}
