'use client';

// Dynamic imports for browser-only libraries
let pdfParse: any, getDocument: any, GlobalWorkerOptions: any, Tesseract: any;
let pdfjsConfig: any = {};
let librariesLoaded = false;

async function loadLibraries() {
  if (librariesLoaded || typeof window === 'undefined') return;
  
  try {
    // Import pdf-parse
    const pdfParseModule = await import('pdf-parse');
    pdfParse = pdfParseModule;
    
    // Import PDF.js
    const pdfjsDist = await import('pdfjs-dist');
    getDocument = pdfjsDist.getDocument;
    GlobalWorkerOptions = pdfjsDist.GlobalWorkerOptions;
    
    // Import Tesseract
    const tesseractModule = await import('tesseract.js');
    Tesseract = tesseractModule.default || tesseractModule;
    
    // Configure PDF.js worker for better Unicode support
    GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

    // Configure PDF.js for better international language support
    pdfjsConfig = {
      cMapUrl: '/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: '/standard_fonts/',
      useSystemFonts: true,
      useWorkerFetch: true,
      isEvalSupported: false,
      disableFontFace: false,
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
  
  if (!pdfParse) {
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

    // Extract text using pdf-parse with enhanced options
    const pdfData = await pdfParse(arrayBuffer, {
      // Enable better Unicode support
      normalizeWhitespace: false,
      disableCombineTextItems: false,
    });
    let text = pdfData.text || '';

    // Extract images using improved PDF.js method
    const images = await extractImagesFromPDF(arrayBuffer);
    
    // Perform OCR on images if text extraction is poor or no text found
    let ocrText = '';
    const isScanned = !text.trim() || text.trim().length < 10;
    
    if (isScanned && images.length > 0) {
      console.log('Performing OCR on PDF images...');
      ocrText = await performOCR(images);
    }

    // Detect language from combined text
    const combinedText = (text + ' ' + ocrText).trim();
    const language = detectLanguage(combinedText);

    // Extract metadata
    const metadata = {
      pages: pdfData.numpages || 0,
      title: pdfData.info?.Title,
      author: pdfData.info?.Author,
      language,
      hasImages: images.length > 0,
      isScanned
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
 * Extract images from PDF using improved PDF.js method
 */
async function extractImagesFromPDF(arrayBuffer: ArrayBuffer): Promise<string[]> {
  const images: string[] = [];

  // Check if running in browser
  if (typeof window === 'undefined' || !getDocument) {
    console.warn('PDF image extraction is not available in this environment');
    return images;
  }

  try {
    const loadingTask = getDocument({ 
      data: arrayBuffer,
      ...pdfjsConfig
    });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        
        // Get viewport and render page to canvas for image extraction
        const viewport = page.getViewport({ scale: 1.5 });
        
        // Use OffscreenCanvas if available, otherwise fallback to regular canvas
        let canvas: any;
        let context: any;
        
        if (typeof OffscreenCanvas !== 'undefined') {
          canvas = new OffscreenCanvas(viewport.width, viewport.height);
          context = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
        } else {
          // Fallback for environments without OffscreenCanvas
          canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          context = canvas.getContext('2d');
        }
        
        if (!context) continue;
        
        // Render page to canvas
        await page.render({
          canvas: canvas,
          viewport: viewport
        }).promise;
        
        // Convert to base64
        let base64Image: string;
        
        if (canvas instanceof OffscreenCanvas) {
          const blob = await canvas.convertToBlob({ type: 'image/png' });
          base64Image = await blobToBase64(blob);
        } else {
          // Fallback for regular canvas
          base64Image = (canvas as HTMLCanvasElement).toDataURL('image/png').split(',')[1];
        }
        
        images.push(`data:image/png;base64,${base64Image}`);
        
      } catch (pageError) {
        console.warn(`Failed to extract image from page ${pageNum}:`, pageError);
        // Continue with next page
      }
    }
    
    // Clean up
    await loadingTask.destroy();
    
  } catch (error) {
    console.error('Error extracting images from PDF:', error);
  }

  return images;
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

/**
 * Perform OCR on extracted images using Tesseract.js
 */
async function performOCR(images: string[]): Promise<string> {
  // Check if running in browser
  if (typeof window === 'undefined' || !Tesseract) {
    console.warn('OCR is not available in this environment');
    return '';
  }
  
  const ocrResults: string[] = [];
  
  try {
    // Default to English for OCR, language detection will be handled separately
    const languages = 'eng+tel+hin+ara+chi_sim+chi_tra+jpn+kor+rus+spa+fra+deu';
    
    // Process each image
    for (const imageData of images) {
      try {
        const { data: { text } } = await Tesseract.recognize(
          imageData, 
          languages,
          {
            logger: (m) => {
              if (m.status === 'recognizing text') {
                console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
              }
            }
          }
        );
        
        if (text && text.trim()) {
          ocrResults.push(text.trim());
        }
      } catch (ocrError) {
        console.warn('OCR failed for image:', ocrError);
      }
    }
  } catch (error) {
    console.error('OCR initialization failed:', error);
  }
  
  return ocrResults.join('\n\n');
}

/**
 * Get appropriate OCR languages based on detected language
 */
function getOCRLanguages(detectedLang?: string): string {
  const langMap: Record<string, string> = {
    'te': 'tel', // Telugu
    'hi': 'hin', // Hindi
    'ar': 'ara', // Arabic
    'zh': 'chi_sim+chi_tra', // Chinese (Simplified + Traditional)
    'ja': 'jpn', // Japanese
    'ko': 'kor', // Korean
    'ru': 'rus', // Russian
    'es': 'spa', // Spanish
    'fr': 'fra', // French
    'de': 'deu', // German
    'en': 'eng', // English
  };
  
  return langMap[detectedLang || 'en'] || 'eng';
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Blob to base64 string
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // Remove data URL prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
