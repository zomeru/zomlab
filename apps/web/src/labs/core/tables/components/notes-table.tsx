"use client";

import { Link } from "@tanstack/react-router";
import {
  type ColumnDef,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import type { Note, NoteListQuery } from "@zomlab/contracts";
import { Button } from "@zomlab/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@zomlab/ui/components/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@zomlab/ui/components/table";
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  Columns3Icon,
  ExternalLinkIcon,
} from "lucide-react";
import { formatDate } from "~/labs/core/shared/formatters";

type SortBy = NonNullable<NoteListQuery["sortBy"]>;
type SortDirection = NonNullable<NoteListQuery["sortDirection"]>;

interface NotesTableProps {
  notes: Note[];
  onSortChange: (sortBy: SortBy, sortDirection: SortDirection) => void;
  page: number;
  pageSize: number;
  sortBy: SortBy;
  sortDirection: SortDirection;
  total: number;
}

const features = tableFeatures({
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSortingFeature,
});

const columnLabels: Record<string, string> = {
  content: "Content",
  createdAt: "Created",
  title: "Title",
  updatedAt: "Updated",
};

const columns: Array<ColumnDef<typeof features, Note>> = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <span className="block min-w-0 font-medium wrap-break-word text-foreground">
        {row.original.title}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => (
      <time className="text-muted-foreground" dateTime={row.original.createdAt}>
        {formatDate(row.original.createdAt)}
      </time>
    ),
  },
  {
    accessorKey: "updatedAt",
    header: "Updated",
    cell: ({ row }) => (
      <time className="text-muted-foreground" dateTime={row.original.updatedAt}>
        {formatDate(row.original.updatedAt)}
      </time>
    ),
  },
  {
    accessorKey: "content",
    header: "Content",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="block max-w-64 truncate text-muted-foreground">
        {row.original.content || "No content"}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Action",
    enableHiding: false,
    enableSorting: false,
    cell: ({ row }) => (
      <Button asChild size="sm" variant="outline">
        <Link params={{ id: row.original.id }} to="/core/crud-demo/$id">
          View
          <ExternalLinkIcon aria-hidden="true" />
        </Link>
      </Button>
    ),
  },
];

export function NotesTable({
  notes,
  onSortChange,
  page,
  pageSize,
  sortBy,
  sortDirection,
  total,
}: NotesTableProps) {
  const sorting = [{ id: sortBy, desc: sortDirection === "desc" }];
  const table = useTable({
    columns,
    data: notes,
    enableSortingRemoval: false,
    features,
    manualPagination: true,
    manualSorting: true,
    onSortingChange: (updater) => {
      const nextSorting = typeof updater === "function" ? updater(sorting) : updater;
      const next = nextSorting[0];
      if (next && next.id in columnLabels) {
        onSortChange(next.id as SortBy, next.desc ? "desc" : "asc");
      }
    },
    rowCount: total,
    state: {
      pagination: { pageIndex: page - 1, pageSize },
      sorting,
    },
  });

  return (
    <div className="overflow-x-auto rounded-xl bg-card shadow-[var(--surface-shadow)]">
      <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
        <p className="text-sm text-muted-foreground" role="status">
          Showing <span className="font-medium text-foreground">{notes.length}</span> of {total}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              <Columns3Icon aria-hidden="true" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllLeafColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  checked={column.getIsVisible()}
                  key={column.id}
                  onCheckedChange={(checked) => column.toggleVisibility(Boolean(checked))}
                >
                  {columnLabels[column.id] ?? column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Table aria-label="Notes table" className="min-w-3xl">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const sorted = header.column.getIsSorted();
                const label = columnLabels[header.column.id] ?? "Action";
                const nextDirection = sorted === "asc" ? "descending" : "ascending";
                return (
                  <TableHead
                    aria-sort={
                      sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none"
                    }
                    className={header.column.id === "actions" ? "text-end" : undefined}
                    key={header.id}
                    scope="col"
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <Button
                        aria-label={`Sort by ${label.toLowerCase()} ${nextDirection}`}
                        className="-ms-3"
                        onClick={header.column.getToggleSortingHandler()}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        {label}
                        {sorted === "asc" ? (
                          <ArrowUpIcon aria-hidden="true" />
                        ) : sorted === "desc" ? (
                          <ArrowDownIcon aria-hidden="true" />
                        ) : (
                          <ArrowUpDownIcon aria-hidden="true" />
                        )}
                      </Button>
                    ) : (
                      label
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  className={cell.column.id === "actions" ? "text-end" : undefined}
                  key={cell.id}
                >
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
