import React, { useRef } from 'react';
import type { ReactNode } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Download, FileImage } from 'lucide-react';
import html2canvas from 'html2canvas';

interface ChartWrapperProps {
  title: ReactNode;
  children: ReactNode;
  className?: string; // Class for the outer Card
  contentClassName?: string; // Class for the CardContent
  actionElement?: ReactNode; // Optional extra action (like loading spinner or filters)
}

export const ChartWrapper: React.FC<ChartWrapperProps> = ({
  title,
  children,
  className,
  contentClassName,
  actionElement,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const downloadPng = async () => {
    if (!contentRef.current) return;
    try {
      const canvas = await html2canvas(contentRef.current, {
        backgroundColor: null, // Transparent background if possible, or theme bg
        scale: 2, // 2x resolution
        logging: false,
      });
      const link = document.createElement('a');
      link.download = 'chart-export.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to export PNG', err);
    }
  };

  const downloadSvg = () => {
    if (!contentRef.current) return;
    const svgElement = contentRef.current.querySelector('svg');
    if (!svgElement) {
      console.error('No SVG found to export');
      return;
    }

    // Serialize
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgElement);

    // Add namespaces if missing (often needed for standalone SVG)
    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(
        /^<svg/,
        '<svg xmlns="http://www.w3.org/2000/svg"',
      );
    }
    if (!source.match(/^<svg[^>]+xmlns:xlink/)) {
      source = source.replace(
        /^<svg/,
        '<svg xmlns:xlink="http://www.w3.org/1999/xlink"',
      );
    }

    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const link = document.createElement('a');
    link.download = 'chart-export.svg';
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  return (
    <Card
      className={`flex flex-col border-white/10 backdrop-blur-sm shadow-sm ${className || ''}`}
    >
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center text-lg font-semibold text-foreground truncate w-full">
          {title}
        </div>
        <div className="flex items-center space-x-2">
          {actionElement}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={downloadPng}>
                <FileImage className="mr-2 h-4 w-4" />
                Download PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={downloadSvg}>
                <Download className="mr-2 h-4 w-4" />
                Download SVG
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent
        className={`flex-1 min-h-0 relative p-0 overflow-hidden rounded-b-lg ${contentClassName || ''}`}
      >
        <div ref={contentRef} className="h-full w-full">
          {children}
        </div>
      </CardContent>
    </Card>
  );
};
