"use client";

import { Button } from "@zomlab/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@zomlab/ui/components/card";
import { Field, FieldGroup, FieldLabel } from "@zomlab/ui/components/field";
import { Input } from "@zomlab/ui/components/input";
import { Textarea } from "@zomlab/ui/components/textarea";
import { type FormEvent, useState } from "react";
import { CoreDemoShell } from "~/labs/core/shared/core-demo-shell";
import { useHydrated } from "~/labs/core/shared/use-hydrated";

interface ProjectDraft {
  name: string;
  summary: string;
}

export function FormsDemo() {
  const [draft, setDraft] = useState<ProjectDraft>({ name: "", summary: "" });
  const [submitted, setSubmitted] = useState<ProjectDraft>();
  const hydrated = useHydrated();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted({ ...draft });
  }

  return (
    <CoreDemoShell
      description="Keep input state explicit, submit through the form element, and show a stable result."
      title="Forms"
    >
      <Card>
        <CardHeader>
          <CardTitle>Project brief</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <fieldset className="contents" disabled={!hydrated}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="project-name">Project name</FieldLabel>
                  <Input
                    id="project-name"
                    maxLength={80}
                    name="name"
                    onChange={(event) =>
                      setDraft((value) => ({ ...value, name: event.target.value }))
                    }
                    required
                    value={draft.name}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="project-summary">Summary</FieldLabel>
                  <Textarea
                    id="project-summary"
                    maxLength={240}
                    name="summary"
                    onChange={(event) =>
                      setDraft((value) => ({ ...value, summary: event.target.value }))
                    }
                    required
                    rows={4}
                    value={draft.summary}
                  />
                </Field>
              </FieldGroup>
              <div className="mt-6">
                <Button type="submit">Submit project</Button>
              </div>
            </fieldset>
          </form>
        </CardContent>
      </Card>

      {submitted ? (
        <Card className="mt-5">
          <CardHeader>
            <CardTitle>Submitted value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground" role="status">
              {submitted.name} was submitted.
            </p>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-muted p-4 font-mono text-sm">
              {JSON.stringify(submitted, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ) : null}
    </CoreDemoShell>
  );
}
