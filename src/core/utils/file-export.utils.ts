import { DownloadOptions } from "../types/file-download.types";
import { addTimestamp, getCurrentTimestamp } from "./date.utils";

export function downloadAsJson(data: any, options: DownloadOptions): void {
  const { filename, mimeType = 'application/json', addTimestamp = true } = options;
  const finalFilename = addTimestamp ? addTimestampToFilename(filename): filename;
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  a.href = url;
  a.download = finalFilename;
  document.body.appendChild(a);
  a.click();

  a.remove();
  URL.revokeObjectURL(url);
}

export function createJsonBlob(data: any, mimeType: string = 'application/json'): Blob {
  const json = JSON.stringify(data, null, 2);
  return new Blob([json], { type: mimeType });
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      resolve(text);
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsText(file);
  });
}

export async function readJsonFile<T = any>(file: File): Promise<T> {
  const text = await readFileAsText(file);
  return JSON.parse(text) as T;
}

export function addTimestampToFilename(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  
  if (lastDotIndex === -1) {
    return addTimestamp(filename);
  }
  
  const basename = filename.substring(0, lastDotIndex);
  const extension = filename.substring(lastDotIndex + 1);
  
  return generateFilenameWithTimestamp(basename, extension);
}

export function generateFilenameWithTimestamp(basename: string, extension: string): string {
  return `${basename}-${getCurrentTimestamp()}.${extension}`;
}


