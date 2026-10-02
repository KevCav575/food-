import type { Allergen, ScanType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

interface RecordScanInput {
  userId: string;
  type: ScanType;
  barcode?: string;
  query?: string;
  productName?: string;
  isSafe?: boolean | null;
  matchedAllergens?: Allergen[];
}

// El descuento del cupo freemium vive en quota.service (consumeScan)
export async function recordScan(input: RecordScanInput): Promise<string> {
  const { id } = await prisma.scanHistory.create({
    data: {
      userId: input.userId,
      type: input.type,
      barcode: input.barcode,
      query: input.query,
      productName: input.productName?.slice(0, 255),
      isSafe: input.isSafe ?? null,
      matchedAllergens: input.matchedAllergens ?? [],
    },
    select: { id: true },
  });
  return id;
}
