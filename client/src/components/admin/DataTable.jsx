import React from "react";
import { Inbox } from "lucide-react";

const DataTable = ({
  columns = [],
  data = [],
  emptyMessage = "No records found.",
  rowKey = "_id",
  onRowClick,
}) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0a1222]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/40">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/80">
            {data.length > 0 ? (
              data.map((row, index) => (
                <tr
                  key={row[rowKey] || index}
                  onClick={() => onRowClick?.(row)}
                  className={`transition ${
                    onRowClick
                      ? "cursor-pointer hover:bg-slate-900/50"
                      : "hover:bg-slate-900/30"
                  }`}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-5 py-4 text-sm text-slate-300"
                    >
                      {column.render
                        ? column.render(row, index)
                        : (row[column.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length || 1}
                  className="px-5 py-14 text-center"
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-slate-600">
                      <Inbox size={22} />
                    </div>

                    <p className="mt-3 text-sm font-medium text-slate-400">
                      {emptyMessage}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
