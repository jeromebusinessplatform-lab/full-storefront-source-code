/**
 * Enforces strict uppercase and centers text into a fixed grid cell width.
 * This guarantees the native OS buttons maintain a fixed, unchanging footprint.
 */
export const enforceMatrixSize = (text: string, targetLength = 18): string => {
  const upper = text.toUpperCase().replace(/[^A-Z0-9 _//-]/g, '');
  if (upper.length >= targetLength) return upper.substring(0, targetLength);
  
  const totalPadding = targetLength - upper.length;
  const padLeft = Math.floor(totalPadding / 2);
  const padRight = totalPadding - padLeft;
  
  return ' '.repeat(padLeft) + upper + ' '.repeat(padRight);
};

/**
 * Generates an aligned ledger row matching a 36-character terminal width.
 * Left-aligns item tags, right-aligns financial values.
 */
export const formatLedgerRow = (leftText: string, numericValue: number): string => {
  const cleanLeft = `LN // ${leftText.toUpperCase().replace(/[^A-Z0-9 _-]/g, '')}`.substring(0, 24);
  const cleanRight = `$${numericValue.toFixed(2)}`;
  
  const spaceNeeded = 36 - cleanLeft.length - cleanRight.length;
  const padding = spaceNeeded > 0 ? ' '.repeat(spaceNeeded) : ' ';
  
  return `${cleanLeft}${padding}${cleanRight}`;
};