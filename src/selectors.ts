export function normalizeHex(value: string): string {
  return value.toLowerCase();
}

export function normalizeList(values: string[] | undefined): Set<string> {
  return new Set((values ?? []).map(normalizeHex));
}

export function isNativeTransfer(data: string): boolean {
  return data === "0x" || data === "0X";
}

export function extractSelector(data: string): string | null {
  if (isNativeTransfer(data)) {
    return null;
  }

  const normalized = normalizeHex(data);
  if (!/^0x[0-9a-f]+$/.test(normalized) || normalized.length < 10) {
    return null;
  }

  return normalized.slice(0, 10);
}
