'use client';

import { Database, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { getDbStats, getDbTableData } from '@/actions/admin.actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TABLES = ['users', 'courses', 'attendance', 'notifications'] as const;
type TableName = (typeof TABLES)[number];
type Row = Record<string, unknown>;

interface Props {
  initialStats: {
    users: number;
    courses: number;
    attendance: number;
    notifications: number;
  };
}

const formatValue = (value: unknown) => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const getColumns = (rows: Row[]) => {
  const keys = new Set<string>();
  rows.forEach((row) => Object.keys(row).forEach((key) => keys.add(key)));
  return [...keys].filter((key) => !['passwordHash', 'userId', 'senderId'].includes(key)).slice(0, 8);
};

export const AdminDbViewer = ({ initialStats }: Props) => {
  const t = useTranslations('private.admin.database');
  const [activeTable, setActiveTable] = useState<TableName>('users');
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(false);
  const pageSize = 12;

  const loadTable = async (table: TableName, nextPage: number) => {
    setLoading(true);
    try {
      const result = await getDbTableData(table, nextPage, pageSize);
      setRows(result.items as Row[]);
      setTotal(result.total);
      setPage(nextPage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTable(activeTable, 1);
  }, [activeTable]);

  const refresh = async () => {
    setLoading(true);
    try {
      const [nextStats] = await Promise.all([getDbStats(), loadTable(activeTable, page)]);
      setStats(nextStats);
    } finally {
      setLoading(false);
    }
  };

  const columns = getColumns(rows);
  const maxPage = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Database size={20} />
          {t('title')}
        </CardTitle>
        <Button variant="tertiary" size="small" onClick={refresh} loading={loading}>
          <RefreshCw size={16} />
          {t('refresh')}
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTable} onValueChange={(value) => setActiveTable(value as TableName)}>
          <TabsList className="mb-4 flex h-auto flex-wrap justify-start gap-1" size="small">
            {TABLES.map((table) => (
              <TabsTrigger key={table} value={table}>
                {t(`tables.${table}`)}
                <Badge variant="neutral" className="ml-2">
                  {stats[table]}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {TABLES.map((table) => (
            <TabsContent key={table} value={table}>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((column) => <TableHead key={column}>{column}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow><TableCell colSpan={Math.max(columns.length, 1)} className="py-8 text-center">{t('empty')}</TableCell></TableRow>
                    ) : rows.map((row, index) => (
                      <TableRow key={String(row.id ?? index)}>
                        {columns.map((column) => <TableCell key={column} className="max-w-[240px] truncate text-xs">{formatValue(row[column])}</TableCell>)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-neutral-500">
                <span>{t('showing', { total })}</span>
                <div className="flex gap-2">
                  <Button variant="tertiary" size="small" disabled={page <= 1 || loading} onClick={() => loadTable(activeTable, page - 1)}>{t('previous')}</Button>
                  <span className="px-2 py-2">{page} / {maxPage}</span>
                  <Button variant="tertiary" size="small" disabled={page >= maxPage || loading} onClick={() => loadTable(activeTable, page + 1)}>{t('next')}</Button>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};
