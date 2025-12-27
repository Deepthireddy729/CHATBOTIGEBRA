'use client';

// Dynamic imports for browser-only libraries
let getDocument: any, GlobalWorkerOptions: any, Tesseract: any;
let pdfjsConfig: any = {};
let librariesLoaded = false;

async function loadLibraries() {
  if (librariesLoaded || typeof window === 'undefined') return;

  try {
    // Import PDF.js
    const pdfjsDist = await import('pdfjs-dist');
    getDocument = pdfjsDist.getDocument;
    GlobalWorkerOptions = pdfjsDist.GlobalWorkerOptions;

    // Import Tesseract
    const tesseractModule = await import('tesseract.js');
    Tesseract = tesseractModule.default || tesseractModule;

    // Configure PDF.js worker
    // Note: You might need to serve this file publicly from your /public folder
    GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsDist.version}/pdf.worker.min.js`;

    pdfjsConfig = {
      cMapUrl: `//cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsDist.version}/cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `//cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsDist.version}/standard_fonts/`,
    };

    librariesLoaded = true;
  } catch (error) {
    console.error('Failed to load PDF processing libraries:', error);
  }
}

export interface PDFContent {
  text: string;
  images: string[]; // Base64 encoded images
  ocrText?: string; // OCR extracted text from images
  metadata: {
    pages: number;
    title?: string;
    author?: string;
    language?: string;
    hasImages: boolean;
    isScanned: boolean;
  };
}


async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<{ text: string; metadata: any, numPages: number }> {
  if (typeof window === 'undefined' || !getDocument) {
    throw new Error('PDF processing is not available in this environment');
  }

  const loadingTask = getDocument({
    data: arrayBuffer,
    ...pdfjsConfig
  });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  let fullText = '';
  
  const metadata = await pdf.getMetadata();

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n';
  }
  
  await loadingTask.destroy();

  return { text: fullText.trim(), metadata: metadata.info, numPages };
}

/**
 * Extract text and images from a PDF data URI
 */
export async function extractPDFContent(dataUri: string): Promise<PDFContent> {
  // Check if running in browser
  if (typeof window === 'undefined') {
    throw new Error('PDF processing is only available in the browser');
  }

  // Load libraries if not already loaded
  await loadLibraries();

  if (!getDocument) {
    throw new Error('PDF parsing library is not available');
  }

  try {
    // Convert data URI to ArrayBuffer
    const base64Data = dataUri.split(',')[1];
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const arrayBuffer = bytes.buffer;

    // Extract text using pdf.js
    const { text, metadata: pdfInfo, numPages } = await extractTextFromPDF(arrayBuffer);

    // For now, we are not extracting images or doing OCR to simplify and fix the build.
    // This can be added back later if needed.
    const images: string[] = [];
    let ocrText = '';
    
    // Detect language from combined text
    const language = detectLanguage(text);

    // Extract metadata
    const metadata = {
      pages: numPages || 0,
      title: pdfInfo?.Title,
      author: pdfInfo?.Author,
      language,
      hasImages: images.length > 0,
      isScanned: !text.trim() && images.length > 0
    };

    return {
      text: text.trim(),
      images,
      ocrText: ocrText.trim() || undefined,
      metadata
    };
  } catch (error) {
    console.error('Error extracting PDF content:', error);
    throw new Error(`Failed to extract PDF content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Detect language from text using simple heuristics
 */
function detectLanguage(text: string): string {
  // Simple language detection based on common characters
  const sample = text.slice(0, 1000).toLowerCase();

  // Telugu detection
  if (/[ఀ-౿]/.test(sample)) return 'te';

  // Hindi/Devanagari
  if (/[ऀ-ॿ]/.test(sample)) return 'hi';

  // Arabic
  if (/[؀-ۿ]/.test(sample)) return 'ar';

  // Chinese
  if (/[\u4e00-\u9fff]/.test(sample)) return 'zh';

  // Japanese
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(sample)) return 'ja';

  // Korean
  if (/[\uac00-\ud7af]/.test(sample)) return 'ko';

  // Russian/Cyrillic
  if (/[а-яё]/i.test(sample)) return 'ru';

  // Spanish
  if (/\b(el|la|los|las|de|que|en|y|es|son|está|están)\b/i.test(sample)) return 'es';

  // French
  if (/\b(le|la|les|de|que|et|est|sont|dans|pour)\b/i.test(sample)) return 'fr';

  // German
  if (/\b(der|die|das|und|ist|sind|in|auf|für)\b/i.test(sample)) return 'de';

  // Default to English
  return 'en';
}
