'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { X, ExternalLink, Square } from 'lucide-react';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CaseStudyResponse } from '@/types';

interface CaseStudyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseStudy: CaseStudyResponse | null;
}

export function CaseStudyModal({ open, onOpenChange, caseStudy }: CaseStudyModalProps) {
  const handleOpenInNewWindow = () => {
    if (!caseStudy) return;

    const newWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    if (newWindow) {
      // Simple markdown to HTML conversion
      let html = caseStudy.content
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^- (.*$)/gm, '<li>$1</li>')
        .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

      // Wrap content in paragraphs and fix lists
      html = '<p>' + html + '</p>';
      html = html.replace(/<\/p><p>(<li>.*<\/li>)/g, '<ul>$1</ul><p>');
      html = html.replace(/(<li>.*<\/li>)<br><\/p><p>/g, '$1</ul><p>');
      html = html.replace(/<p><\/p>/g, '');

      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${caseStudy.name} - Case Study</title>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              background: white;
              color: #333;
            }
            h1, h2, h3 { color: #2563eb; }
            h1 { border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
            h2 { border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-top: 30px; }
            ul, ol { padding-left: 20px; }
            li { margin-bottom: 5px; }
            strong { color: #1f2937; }
            p { margin-bottom: 1em; }
          </style>
        </head>
        <body>
          ${html}
        </body>
        </html>
      `);
      newWindow.document.close();
    }

    // Close the modal
    onOpenChange(false);
  };

  if (!caseStudy) return null;

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-4xl max-h-[90vh] p-0">
        {/* Header */}
        <div className="relative p-6 border-b bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <div className="flex items-start justify-between">
            <div className="flex-1 mr-4">
              <button
                onClick={handleOpenInNewWindow}
                className="group flex items-center space-x-2 text-left hover:opacity-80 transition-opacity cursor-pointer"
                title="Click to open in new window"
              >
                <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 group-hover:underline">
                  {caseStudy.name}
                </h2>
                <ExternalLink className="h-4 w-4 text-blue-700 dark:text-blue-300 group-hover:text-blue-900 dark:group-hover:text-blue-100 transition-colors" />
              </button>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Case Study Reference
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-100 border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-semibold text-blue-800 dark:text-blue-200 border-b border-gray-100 dark:border-gray-800 pb-1 mt-6 mb-3">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-medium text-blue-700 dark:text-blue-300 mt-4 mb-2">
                    {children}
                  </h3>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-outside ml-6 space-y-1">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-outside ml-6 space-y-1">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-gray-700 dark:text-gray-300">
                    {children}
                  </li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-gray-900 dark:text-gray-100">
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-gray-800 dark:text-gray-200">
                    {children}
                  </em>
                ),
                p: ({ children }) => (
                  <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                    {children}
                  </p>
                ),
                code: ({ children }) => (
                  <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
                    {children}
                  </pre>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-blue-200 dark:border-blue-700 pl-4 italic text-gray-600 dark:text-gray-400">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {caseStudy.content}
            </ReactMarkdown>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}