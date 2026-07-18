'use client';

import { Card } from '@/components/ui/card';
import { Heading6, Paragraph } from '@/components/typography';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { dash } from 'radash';
import dayjs from 'dayjs';
import { CertificateStatusBadge } from '@/app/[locale]/(private)/module/certificates/components/certificate-status-badge';
import { CertificateStatus } from '@/types/models/certificate/status';
import { Button } from '@/components/ui/button';
import { Show } from '@/components/utils/show';
import { PaginationWithLinks } from '@/components/ui/pagination-with-links';
import { useTranslations } from 'next-intl';
import { getCertificatePDF } from '@/actions/certificates.actions';
import { usePagination } from '@/hooks/use-pagination';
import { Certificate } from '@/types/models/certificate/certificate';
import saveAs from 'file-saver';
import { PAGE_SIZE_SMALL } from '@/lib/constants/page-size';
import { exportToCsv } from '@/lib/utils/csv-export';
import { Download } from 'lucide-react';

interface Props {
  certificates: Certificate[];
}

export function HistoryTable({ certificates }: Props) {
  const tTable = useTranslations('public.verification.result.table');
  const tEnums = useTranslations('global.enums.certificate-type');

  const { paginatedItems: paginatedCertificates, page } = usePagination(PAGE_SIZE_SMALL, certificates);

  const handleDownload = async (id: number) => {
    const { filename, blob } = await getCertificatePDF(id);

    saveAs(blob, filename);
  };

  const handleExportCsv = () => {
    exportToCsv(
      'certificates.csv',
      [tTable('type'), tTable('date'), tTable('status')],
      certificates.map((c) => [
        tEnums(dash(c.type)),
        dayjs(c.created).format('DD.MM.YYYY'),
        c.status,
      ]),
    );
  };

  return (
    <Card className="rounded-b-6 col-span-full flex w-full flex-[2] basis-4/7 flex-col gap-4 bg-card p-4 text-card-foreground sm:gap-6 sm:p-6 md:p-9 xl:col-span-5">
      <div className="flex items-center justify-between">
        <Heading6>{tTable('title')}</Heading6>
        <Button variant="tertiary" size="small" onClick={handleExportCsv}>
          <Download className="h-4 w-4" />
          CSV
        </Button>
      </div>
      {certificates.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm">{tTable('empty')}</p>
      ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tTable('type')}</TableHead>
            <TableHead>{tTable('date')}</TableHead>
            <TableHead>{tTable('status')}</TableHead>
            <TableHead>{tTable('actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedCertificates.map((certificate) => {
            const shouldShowDownloadButton =
              certificate.status === CertificateStatus.Processed || certificate.status === CertificateStatus.Signed;

            return (
              <TableRow key={certificate.id}>
                <TableCell className="w-[140px]">
                  <Paragraph className="m-0 text-sm font-normal">{tEnums(dash(certificate.type))}</Paragraph>
                  <Paragraph className="m-0 text-sm font-normal text-neutral-600">{certificate.purpose}</Paragraph>
                </TableCell>
                <TableCell className="w-[100px]">{dayjs(certificate.created).format('DD.MM.YYYY')}</TableCell>
                <TableCell className="w-[100px]">
                  <CertificateStatusBadge certificate={certificate} />
                </TableCell>
                <TableCell className="w-[100px]">
                  {shouldShowDownloadButton && (
                    <Button variant="secondary" onClick={() => handleDownload(certificate.id)}>
                      {tTable('download')}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      )}
      <Show when={certificates.length > PAGE_SIZE_SMALL}>
        <PaginationWithLinks page={page} pageSize={PAGE_SIZE_SMALL} totalCount={certificates.length} />
      </Show>
    </Card>
  );
}
