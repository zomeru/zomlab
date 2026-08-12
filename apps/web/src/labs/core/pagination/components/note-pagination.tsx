import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@zomlab/ui/components/pagination";

type PageItem = number | "ellipsis-start" | "ellipsis-end";

function getPageItems(currentPage: number, pageCount: number): PageItem[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1);
  if (currentPage <= 4) return [1, 2, 3, 4, 5, "ellipsis-end", pageCount];
  if (currentPage >= pageCount - 3) {
    return [
      1,
      "ellipsis-start",
      pageCount - 4,
      pageCount - 3,
      pageCount - 2,
      pageCount - 1,
      pageCount,
    ];
  }
  return [
    1,
    "ellipsis-start",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis-end",
    pageCount,
  ];
}

interface NotePaginationProps {
  basePath: string;
  page: number;
  pageCount: number;
  search: Record<string, number | string | undefined>;
}

export function NotePagination({ basePath, page, pageCount, search }: NotePaginationProps) {
  function getHref(nextPage: number) {
    const parameters = new URLSearchParams({ page: String(nextPage) });
    for (const [key, value] of Object.entries(search)) {
      if (key === "page") continue;
      if (value !== undefined) parameters.set(key, String(value));
    }
    return `${basePath}?${parameters.toString()}`;
  }

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            aria-disabled={page <= 1}
            href={page > 1 ? getHref(page - 1) : undefined}
          />
        </PaginationItem>

        {getPageItems(page, pageCount).map((item) => (
          <PaginationItem key={item}>
            {typeof item === "number" ? (
              <PaginationLink
                aria-label={`Page ${item}`}
                href={getHref(item)}
                isActive={item === page}
              >
                {item}
              </PaginationLink>
            ) : (
              <PaginationEllipsis />
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            aria-disabled={page >= pageCount}
            href={page < pageCount ? getHref(page + 1) : undefined}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
