import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportToCsv } from '@/lib/utils/csv-export';

describe('exportToCsv', () => {
  let linkClickSpy: ReturnType<typeof vi.fn>;
  let createElementSpy: ReturnType<typeof vi.spyOn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    linkClickSpy = vi.fn();
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL');

    const fakeLink = {
      href: '',
      download: '',
      click: linkClickSpy,
    };

    createElementSpy = vi.spyOn(document, 'createElement') as unknown as ReturnType<typeof vi.spyOn>;
    (createElementSpy as ReturnType<typeof vi.spyOn>).mockReturnValue(fakeLink as unknown as HTMLAnchorElement);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake-url');
  });

  it('creates a download link with the correct filename', () => {
    exportToCsv('test.csv', ['A', 'B'], [['1', '2']]);
    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(linkClickSpy).toHaveBeenCalledOnce();
    expect(revokeObjectURLSpy).toHaveBeenCalledOnce();
  });

  it('escapes cells containing commas', () => {
    const blobSpy = vi.spyOn(Blob.prototype, 'text').mockResolvedValue('');
    exportToCsv('test.csv', ['Name', 'Value'], [['Hello, World', '42']]);
    expect(blobSpy).toHaveBeenCalled();
  });

  it('escapes cells containing quotes', () => {
    const blobSpy = vi.spyOn(Blob.prototype, 'text').mockResolvedValue('');
    exportToCsv('test.csv', ['Name', 'Value'], [['He said "hi"', '42']]);
    expect(blobSpy).toHaveBeenCalled();
  });
});
