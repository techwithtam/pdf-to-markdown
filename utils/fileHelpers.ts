import JSZip from 'jszip';
import mammoth from 'mammoth';

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the Data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const fileToArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = () => {
      resolve(reader.result as ArrayBuffer);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const convertDocxToHtml = async (file: File): Promise<string> => {
  const arrayBuffer = await fileToArrayBuffer(file);
  const result = await mammoth.convertToHtml({ arrayBuffer });
  return result.value;
};

export const downloadFile = (filename: string, content: string) => {
  const element = document.createElement('a');
  const file = new Blob([content], { type: 'text/markdown' });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

export type ExportFormat = 'md' | 'txt';

export const downloadAllAsZip = async (
  tabs: { fileName: string; markdownContent: string }[],
  format: ExportFormat = 'md'
) => {
  const zip = new JSZip();

  tabs.forEach((tab) => {
    // Replace .md extension with the desired format
    const fileName = tab.fileName.replace(/\.md$/, `.${format}`);
    zip.file(fileName, tab.markdownContent);
  });

  const content = await zip.generateAsync({ type: 'blob' });
  const element = document.createElement('a');
  element.href = URL.createObjectURL(content);
  element.download = `converted_tabs_${format}.zip`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};
