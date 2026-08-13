"use client";

import { Button } from "@zomlab/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@zomlab/ui/components/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@zomlab/ui/components/field";
import { Input } from "@zomlab/ui/components/input";
import { Textarea } from "@zomlab/ui/components/textarea";
import { type FormEvent, useRef, useState } from "react";
import { CoreDemoShell } from "~/labs/core/shared/core-demo-shell";
import { useHydrated } from "~/labs/core/shared/use-hydrated";
import { validationNoteSchema } from "../validation-schema";

interface ValidationErrors {
  content?: string;
  title?: string;
}

export function ValidationDemo() {
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [success, setSuccess] = useState(false);
  const [title, setTitle] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const hydrated = useHydrated();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validationNoteSchema.safeParse({ content, title });

    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      setErrors({ content: fields.content?.[0], title: fields.title?.[0] });
      setSuccess(false);
      if (fields.title?.[0]) {
        titleRef.current?.focus();
      } else if (fields.content?.[0]) {
        contentRef.current?.focus();
      }
      return;
    }

    setErrors({});
    setSuccess(true);
  }

  return (
    <CoreDemoShell
      description="Turn one Zod schema into typed values and field-specific, accessible feedback."
      title="Validation"
    >
      <Card>
        <CardHeader>
          <CardTitle>Validate a note draft</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" noValidate onSubmit={handleSubmit}>
            <fieldset className="contents" disabled={!hydrated}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="validated-title">Validated title</FieldLabel>
                  <Input
                    aria-describedby={errors.title ? "validated-title-error" : undefined}
                    aria-invalid={errors.title ? true : undefined}
                    autoComplete="off"
                    id="validated-title"
                    name="title"
                    onChange={(event) => {
                      setTitle(event.target.value);
                      setSuccess(false);
                    }}
                    ref={titleRef}
                    value={title}
                  />
                  {errors.title ? (
                    <FieldError id="validated-title-error">{errors.title}</FieldError>
                  ) : null}
                </Field>
                <Field>
                  <FieldLabel htmlFor="validated-content">Validated content</FieldLabel>
                  <Textarea
                    aria-describedby={errors.content ? "validated-content-error" : undefined}
                    aria-invalid={errors.content ? true : undefined}
                    autoComplete="off"
                    id="validated-content"
                    name="content"
                    onChange={(event) => {
                      setContent(event.target.value);
                      setSuccess(false);
                    }}
                    ref={contentRef}
                    rows={4}
                    value={content}
                  />
                  {errors.content ? (
                    <FieldError id="validated-content-error">{errors.content}</FieldError>
                  ) : null}
                </Field>
              </FieldGroup>
              <div className="mt-6">
                <Button type="submit">Validate note</Button>
              </div>
              <p className="text-sm text-success" role="status">
                {success ? "Validation passed. The typed value is ready to submit." : ""}
              </p>
            </fieldset>
          </form>
        </CardContent>
      </Card>
    </CoreDemoShell>
  );
}
