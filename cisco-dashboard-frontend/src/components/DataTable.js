import React, { useState, useMemo } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Paper,
  TextField,
  InputAdornment,
  Typography,
  Chip,
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";

export default function DataTable({
  columns,
  rows,
  title,
  defaultSort,
  defaultOrder = "asc",
  pageSize = 25,
  searchPlaceholder = "Search...",
  emptyMessage = "No data available.",
  dense = false,
  stickyHeader = true,
  maxHeight,
  renderCell,
}) {
  const [search, setSearch] = useState("");
  const [orderBy, setOrderBy] = useState(defaultSort || (columns[0] && columns[0].field));
  const [order, setOrder] = useState(defaultOrder);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);

  const filtered = useMemo(() => {
    if (!rows) return [];
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((row) =>
      columns.some((col) => {
        const val = row[col.field];
        return val !== undefined && val !== null && String(val).toLowerCase().includes(q);
      })
    );
  }, [rows, search, columns]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let aVal = a[orderBy];
      let bVal = b[orderBy];
      if (aVal === undefined || aVal === null) aVal = "";
      if (bVal === undefined || bVal === null) bVal = "";
      if (typeof aVal === "number" && typeof bVal === "number") {
        return order === "asc" ? aVal - bVal : bVal - aVal;
      }
      return order === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
    return arr;
  }, [filtered, orderBy, order]);

  const paged = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleSort = (field) => {
    const isAsc = orderBy === field && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(field);
  };

  return (
    <Paper variant="outlined" sx={{ overflow: "hidden" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5, flexWrap: "wrap", gap: 1 }}>
        {title && (
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {title}
            <Chip label={filtered.length} size="small" sx={{ ml: 1, fontWeight: 600 }} />
          </Typography>
        )}
        <TextField
          size="small"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          sx={{ minWidth: 240 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      <TableContainer sx={{ maxHeight: maxHeight || 600 }}>
        <Table size={dense ? "small" : "medium"} stickyHeader={stickyHeader}>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.field}
                  sortDirection={orderBy === col.field ? order : false}
                  sx={{ whiteSpace: "nowrap", minWidth: col.minWidth }}
                >
                  <TableSortLabel
                    active={orderBy === col.field}
                    direction={orderBy === col.field ? order : "asc"}
                    onClick={() => handleSort(col.field)}
                  >
                    {col.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paged.length > 0 ? (
              paged.map((row, i) => (
                <TableRow key={row._key || i} hover sx={row._rowSx}>
                  {columns.map((col) => (
                    <TableCell key={col.field} sx={{ whiteSpace: "nowrap", fontSize: "0.85rem" }}>
                      {renderCell ? renderCell(col.field, row[col.field], row) : (row[col.field] ?? "—")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {filtered.length > rowsPerPage && (
        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      )}
    </Paper>
  );
}
