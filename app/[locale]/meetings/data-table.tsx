"use client"

import React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  filterValue: string
}

export default function MeetingDataTable<TData, TValue>({
  columns,
  data,
  filterValue,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  return (
    <>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
      
      {/* Search */}
      <div className="flex w-1/2 items-center py-4 gap-2 animate-slide-in">
        <Input
          placeholder="Search Meeting..."
          value={(table.getColumn(filterValue)?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn(filterValue)?.setFilterValue(event.target.value)
          }
          className="h-12 bg-gradient-to-br from-violet-900/20 to-purple-900/20 border border-violet-500/30 rounded-2xl placeholder:text-violet-400/50 focus:border-violet-500/60"
        />
      </div>

      {/* Table */}
      <div className="border border-violet-500/30 bg-gradient-to-br from-violet-900/10 to-purple-900/10 rounded-2xl backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="border-b border-violet-500/20 hover:bg-transparent">
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="text-violet-300 font-semibold">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="border-b border-violet-500/10 hover:bg-violet-900/20 transition-colors duration-200 animate-slide-in">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-gray-100">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center h-24 text-gray-400">
                  No meetings found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-2 mt-6 animate-slide-in">
        <div className="text-sm text-gray-400">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0 rounded-lg shadow-lg hover:shadow-violet-500/40 transition-all duration-300"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft size={16} className="mr-1" />
            Previous
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0 rounded-lg shadow-lg hover:shadow-violet-500/40 transition-all duration-300"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>
      </div>
    </>
  )
}
