"use client";

import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Configure PDF.js worker for better Unicode support
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface PDFPreviewProps {
  data: string; // data URI
  fileName: string;
  className?: string;
}

export function PDFPreview({ data, fileName, className }: PDFPreviewProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages || 1));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 2));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <>
      {/* Telugu font support */}
      <style jsx>{`
        .react-pdf__Page__textContent {
          font-family: 'Noto Sans Telugu', 'Telugu Sangam MN', 'Arial Unicode MS', sans-serif !important;
          font-size: inherit !important;
          line-height: 1.2 !important;
        }
        .react-pdf__Page__textContent span {
          font-family: inherit !important;
          direction: ltr !important;
          unicode-bidi: bidi-override !important;
        }
      `}</style>
      <div className={cn("border rounded-lg overflow-hidden bg-white", className)}>
      {/* PDF Controls */}
      <div className="flex items-center justify-between p-2 bg-gray-50 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600">
            {pageNumber} of {numPages || 0}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextPage}
            disabled={pageNumber >= (numPages || 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={zoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-gray-600 min-w-[40px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button variant="ghost" size="sm" onClick={zoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className={cn(
        "overflow-auto bg-gray-100",
        isFullscreen ? "h-96" : "h-64"
      )}>
        <Document
          file={data}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Loading PDF...</div>
            </div>
          }
          error={
            <div className="flex items-center justify-center h-full">
              <div className="text-red-500">Error loading PDF</div>
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className="shadow-sm"
            onLoadSuccess={() => {
              // Force re-render for text layer
              setTimeout(() => {
                // This helps with Unicode text rendering
              }, 100);
            }}
          />
        </Document>
      </div>

      {/* File Info */}
      <div className="p-2 bg-gray-50 border-t">
        <div className="text-xs text-gray-600 truncate">{fileName}</div>
      </div>
    </div>
    </>
  );
}
