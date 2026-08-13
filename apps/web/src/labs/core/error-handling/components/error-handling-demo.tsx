"use client";

import { Alert } from "@zomlab/ui/components/alert";
import { Button } from "@zomlab/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@zomlab/ui/components/card";
import { useState } from "react";
import { CoreDemoShell } from "~/labs/core/shared/core-demo-shell";
import { useHydrated } from "~/labs/core/shared/use-hydrated";

interface ExampleError {
  code: string;
  detail?: string;
  message: string;
  status: number;
}

const errors: Record<"internal" | "notFound" | "validation", ExampleError> = {
  validation: {
    code: "VALIDATION_ERROR",
    detail: "title: Enter a title.",
    message: "The request did not pass validation.",
    status: 422,
  },
  notFound: {
    code: "NOTE_NOT_FOUND",
    message: "The requested note was not found.",
    status: 404,
  },
  internal: {
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred.",
    status: 500,
  },
};

export function ErrorHandlingDemo() {
  const [selected, setSelected] = useState<ExampleError>();
  const hydrated = useHydrated();

  return (
    <CoreDemoShell
      description="Translate failures into stable public envelopes without leaking implementation details."
      title="Error Handling"
    >
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={!hydrated}
          onClick={() => setSelected(errors.validation)}
          type="button"
          variant="outline"
        >
          Show validation error
        </Button>
        <Button
          disabled={!hydrated}
          onClick={() => setSelected(errors.notFound)}
          type="button"
          variant="outline"
        >
          Show not found error
        </Button>
        <Button
          disabled={!hydrated}
          onClick={() => setSelected(errors.internal)}
          type="button"
          variant="outline"
        >
          Show internal error
        </Button>
      </div>

      {selected ? (
        <Alert className="mt-5" variant="destructive" role="alert">
          <p className="font-semibold">
            {selected.status} · {selected.code}
          </p>
          <p className="mt-1">{selected.message}</p>
          {selected.detail ? <p className="mt-1 text-sm">{selected.detail}</p> : null}
        </Alert>
      ) : (
        <Card className="mt-5">
          <CardHeader>
            <CardTitle>Choose a failure boundary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              The same envelope shape works for validation, expected domain errors, and masked
              server failures.
            </p>
          </CardContent>
        </Card>
      )}
    </CoreDemoShell>
  );
}
