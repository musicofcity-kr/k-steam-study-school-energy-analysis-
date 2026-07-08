export type DecodedCsv = {
  text: string;
  encoding: 'utf-8' | 'euc-kr';
};

const stripBom = (text: string) => text.replace(/^\uFEFF/, '');

export function decodeCsvBytes(buffer: ArrayBuffer): DecodedCsv {
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    return { text: stripBom(text), encoding: 'utf-8' };
  } catch {
    const text = new TextDecoder('euc-kr').decode(buffer);
    return { text: stripBom(text), encoding: 'euc-kr' };
  }
}
