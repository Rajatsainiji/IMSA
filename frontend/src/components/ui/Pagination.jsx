import React from 'react';

export default function Pagination({ meta, onPageChange }) {
  if (!meta) return null;
  const { page, totalPages, total, limit } = meta.pagination;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-gray-500">
        Showing {start}–{end} of {total} results
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!meta.pagination.hasPrev}
          className="btn btn-secondary btn-sm disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-sm text-gray-700 px-2">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!meta.pagination.hasNext}
          className="btn btn-secondary btn-sm disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
