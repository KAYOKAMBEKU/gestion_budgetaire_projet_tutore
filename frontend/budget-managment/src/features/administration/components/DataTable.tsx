import type { ReactNode } from "react";

export interface DataTableColumn<T> {
  key: string;
  label: string;
  render: (item: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowKey: (item: T) => string | number;
  actions?: (item: T) => ReactNode;
  emptyMessage?: string;
}

export function DataTable<T>({ columns, data, getRowKey, actions, emptyMessage = "Aucun element a afficher." }: DataTableProps<T>) {
  return (
    <div className="overflow-hidden bg-white/30">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm">
          <thead className="bg-[#F9FAFB] text-xs uppercase tracking-wide text-[#374151]">
            <tr>
              {columns.map((column) => (
                <th className="px-4 py-3 font-semibold" key={column.key}>
                  {column.label}
                </th>
              ))}
              {actions ? <th className="px-4 py-3 text-right font-semibold">Actions</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB] text-[#1F2937]">
            {data.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-[#6B7280]" colSpan={columns.length + (actions ? 1 : 0)}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr className="hover:bg-[#F4F7FA]" key={getRowKey(item)}>
                  {columns.map((column) => (
                    <td className="px-4 py-3 align-top" key={column.key}>
                      {column.render(item)}
                    </td>
                  ))}
                  {actions ? <td className="px-4 py-3 text-right align-top">{actions(item)}</td> : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
