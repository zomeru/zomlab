"use client";

import { Button } from "@zomlab/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@zomlab/ui/components/card";
import { Checkbox } from "@zomlab/ui/components/checkbox";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateTitle,
} from "@zomlab/ui/components/empty-state";
import { Field, FieldLabel } from "@zomlab/ui/components/field";
import { Input } from "@zomlab/ui/components/input";
import { type FormEvent, useReducer, useState } from "react";
import { CoreDemoShell } from "~/labs/core/shared/core-demo-shell";
import { useHydrated } from "~/labs/core/shared/use-hydrated";

interface Task {
  complete: boolean;
  id: string;
  name: string;
}

type Action =
  | { name: string; type: "add" }
  | { id: string; type: "remove" }
  | { id: string; type: "toggle" };

function taskReducer(tasks: Task[], action: Action): Task[] {
  switch (action.type) {
    case "add":
      return [...tasks, { complete: false, id: crypto.randomUUID(), name: action.name }];
    case "remove":
      return tasks.filter((task) => task.id !== action.id);
    case "toggle":
      return tasks.map((task) =>
        task.id === action.id ? { ...task, complete: !task.complete } : task,
      );
  }
}

export function StateManagementDemo() {
  const [name, setName] = useState("");
  const [tasks, dispatch] = useReducer(taskReducer, []);
  const completed = tasks.filter((task) => task.complete).length;
  const hydrated = useHydrated();

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextName = name.trim();
    if (!nextName) return;
    dispatch({ name: nextName, type: "add" });
    setName("");
  }

  return (
    <CoreDemoShell
      description="Use a reducer for related transitions and derive progress instead of duplicating it."
      title="State Management"
    >
      <Card>
        <CardHeader>
          <CardTitle>Implementation tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addTask}>
            <fieldset className="contents" disabled={!hydrated}>
              <Field className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1 space-y-2">
                  <FieldLabel className="sr-only" htmlFor="task-name">
                    Task name
                  </FieldLabel>
                  <Input
                    autoComplete="off"
                    id="task-name"
                    name="task-name"
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Add a task"
                    value={name}
                  />
                </div>
                <Button type="submit">Add task</Button>
              </Field>
            </fieldset>
          </form>

          <p className="mt-4 text-sm text-muted-foreground" role="status">
            {completed} of {tasks.length} complete
          </p>

          {tasks.length ? (
            <ul className="mt-4 divide-y divide-border" aria-label="Implementation tasks">
              {tasks.map((task) => (
                <li className="flex items-center gap-3 py-3" key={task.id}>
                  <Checkbox
                    checked={task.complete}
                    id={`task-${task.id}`}
                    onCheckedChange={() => dispatch({ id: task.id, type: "toggle" })}
                  />
                  <FieldLabel
                    className="min-w-0 flex-1 cursor-pointer text-sm font-normal"
                    htmlFor={`task-${task.id}`}
                  >
                    {task.name}
                  </FieldLabel>
                  <Button
                    aria-label={`Remove ${task.name}`}
                    onClick={() => dispatch({ id: task.id, type: "remove" })}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState className="mt-4 px-4 py-8 text-left">
              <EmptyStateTitle>No tasks yet</EmptyStateTitle>
              <EmptyStateDescription>
                Add a task to create the first reducer transition.
              </EmptyStateDescription>
            </EmptyState>
          )}
        </CardContent>
      </Card>
    </CoreDemoShell>
  );
}
