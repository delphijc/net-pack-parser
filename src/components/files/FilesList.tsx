import React, { useState } from 'react';
import database from '../../services/database';
import { Download, File, FileText, FileImage, FileSpreadsheet, File as FilePdf, FileArchive, FileCode, ExternalLink, AlertCircle } from 'lucide-react';

const FilesList: React.FC = () => {
  const files = database.getAllFiles();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [viewingFile, setViewingFile] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';

    switch (extension) {
      case 'pdf':
        return <FilePdf size={20} className="text-red-400" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileImage size={20} className="text-purple-400" />;
      case 'doc':
      case 'docx':
      case 'txt':
        return <FileText size={20} className="text-blue-400" />;
      case 'xls':
      case 'xlsx':
      case 'csv':
        return <FileSpreadsheet size={20} className="text-green-400" />;
      case 'zip':
      case 'rar':
      case 'tar':
      case 'gz':
        return <FileArchive size={20} className="text-amber-400" />;
      case 'html':
      case 'js':
      case 'css':
      case 'xml':
      case 'json':
        return <FileCode size={20} className="text-teal-400" />;
      default:
        return <File size={20} className="text-gray-400" />;
    }
  };

  // Retry with exponential backoff
  const retryWithBackoff = async (
    fn: () => Promise<any>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<any> => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  const handleDownload = async (file: any) => {
    try {
      setDownloadError(null);
      setIsRetrying(false);

      // Basic validation
      if (!file?.uri) {
        throw new Error('Invalid file URL');
      }

      // Ensure URI is properly formatted
      let fileUrl: URL;
      let uri = file.uri.trim();

      // Add protocol if missing
      if (!uri.startsWith('http://') && !uri.startsWith('https://') && !uri.startsWith('data:')) {
        // Default to https if no protocol is specified
        uri = `https://${uri}`;
      }

      try {
        fileUrl = new URL(uri);
      } catch (error) {
        console.error('URL parsing error:', error);
        throw new Error('Invalid file URL format. Please check that the URL is correct.');
      }

      // Prepare request options with potential authentication
      const requestOptions: RequestInit = {
        method: 'GET',
        mode: 'cors', // Explicitly set CORS mode
        credentials: 'include', // Include credentials if same-origin
        headers: {
          // Add any required authentication headers here
        },
      };

      // If cross-origin, adjust credentials mode
      if (fileUrl.origin !== window.location.origin) {
        requestOptions.credentials = 'omit';
        // For cross-origin requests, we might need to adjust the mode
        requestOptions.mode = 'cors';
      }

      const fetchFile = async () => {
        try {
          const response = await fetch(uri, requestOptions);

          if (!response.ok) {
            if (response.status === 403) {
              throw new Error('Access denied. You may need to log in or request access to this file.');
            } else if (response.status === 404) {
              throw new Error('File not found. It may have been moved or deleted.');
            } else if (response.status === 429) {
              throw new Error('Too many requests. Please try again later.');
            } else {
              throw new Error(`Server error (HTTP ${response.status}). Please try again later.`);
            }
          }

          return response;
        } catch (fetchError) {
          // Handle specific network errors
          if (fetchError instanceof TypeError && fetchError.message.includes('Failed to fetch')) {
            // Enhanced error for network issues
            console.error('Network error details:', fetchError);
            throw new Error('Network error: Unable to connect to the server. Check your internet connection or try again later.');
          }

          if (fetchError.message.includes('NetworkError')) {
            throw new Error('Network error: The request was blocked due to CORS restrictions. This file may not be accessible from your current location.');
          }

          // Rethrow any other errors
          throw fetchError;
        }
      };

      setIsRetrying(true);
      console.log('Attempting to download file from:', uri);
      const response = await retryWithBackoff(fetchFile);
      setIsRetrying(false);

      // Check if we have content
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) === 0) {
        throw new Error('File is empty or not available for download.');
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty. The file may be corrupted or not properly accessible.');
      }

      const url = window.URL.createObjectURL(blob);

      if (file.fileType?.startsWith('image/') || file.fileType?.startsWith('text/') || file.fileType === 'application/pdf') {
        setViewingFile(url);
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = file.fileName || 'download'; // Provide fallback filename
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      setIsRetrying(false);

      let errorMessage = 'Failed to download file. ';

      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('Network error')) {
          errorMessage += error.message;
        } else if (error.message.includes('CORS')) {
          errorMessage += 'This file cannot be accessed due to server restrictions.';
        } else if (error.message.includes('Invalid file URL format')) {
          errorMessage += 'The URL appears to be invalid. Please check the file source.';
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += 'An unknown error occurred. Please try again later.';
      }

      setDownloadError(errorMessage);
    }
  };

  const selectedFileData = selectedFile ? files.find(f => f.id === selectedFile) : null;

  return (
    <div className="h-full flex flex-col">
      {/* Fixed Header Section */}
      <div className="sticky top-0 z-10 bg-gray-900 p-6">
        <h2 className="text-2xl font-bold mb-6">File References</h2>

        {downloadError && (
          <div className="mb-4 bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
            <p className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              {downloadError}
            </p>
          </div>
        )}

        {isRetrying && (
          <div className="mb-4 bg-yellow-900/50 border border-yellow-500 text-yellow-200 px-4 py-3 rounded-lg">
            <p className="flex items-center">
              <span className="mr-2">⚡</span>
              Retrying download...
            </p>
          </div>
        )}

        {/* File Details Section */}
        {selectedFileData && (
          <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
            <div className="bg-gray-700 px-4 py-3 flex items-center justify-between">
              <h2 className="font-medium">File Details</h2>
              <button
                className="text-gray-400 hover:text-white"
                onClick={() => setSelectedFile(null)}
              >
                Close
              </button>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Basic Information</h3>
                    <div className="bg-gray-900 p-3 rounded">
                      <p className="text-sm mb-2">
                        <span className="text-gray-500">File Name:</span> {selectedFileData.fileName}
                      </p>
                      <p className="text-sm mb-2">
                        <span className="text-gray-500">Status:</span> {selectedFileData.downloadStatus}
                      </p>
                      <p className="text-sm mb-2">
                        <span className="text-gray-500">Size:</span> {selectedFileData.fileSize ? Math.round(selectedFileData.fileSize / 1024) + ' KB' : 'Unknown'}
                      </p>
                      <p className="text-sm">
                        <span className="text-gray-500">Type:</span> {selectedFileData.fileType || 'Unknown'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Source</h3>
                    <div className="bg-gray-900 p-3 rounded">
                      <p className="text-sm mb-2 break-all">
                        <span className="text-gray-500">URI:</span> {selectedFileData.uri}
                      </p>
                      {selectedFileData.lastModified && (
                        <p className="text-sm">
                          <span className="text-gray-500">Last Modified:</span> {new Date(selectedFileData.lastModified).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Security Information</h3>
                  <div className="bg-gray-900 p-3 rounded">
                    <div className="mb-4">
                      <p className="text-sm mb-1 text-gray-500">SHA-256 Hash</p>
                      <p className="font-mono text-xs break-all">{selectedFileData.hash}</p>
                    </div>

                    <div>
                      <p className="text-sm mb-1 text-gray-500">Actions</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded flex items-center justify-center"
                          onClick={() => handleDownload(selectedFileData)}
                        >
                          <Download size={14} className="mr-1" /> Download File
                        </button>
                        <button
                          className="w-full bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 px-3 rounded flex items-center justify-center"
                          onClick={() => window.open(selectedFileData.uri, '_blank')}
                        >
                          <ExternalLink size={14} className="mr-1" /> Open Source URL
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Scrollable Files Grid Section */}
      <div className="flex-1 overflow-y-auto p-6 pt-0">
        {files.length === 0 ? (
          <div className="bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-700 rounded-full mb-4">
              <File size={32} className="text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No files found</h2>
            <p className="text-gray-400 mb-4">
              Parse network traffic that contains file references to populate this list.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {files.map(file => (
              <div
                key={file.id}
                className={`bg-gray-800 rounded-lg shadow-md overflow-hidden cursor-pointer transition-transform hover:translate-y-[-2px] ${selectedFile === file.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                onClick={() => setSelectedFile(file.id === selectedFile ? null : file.id)}
              >
                <div className="p-4">
                  <div className="flex items-start mb-3">
                    {getFileIcon(file.fileName)}
                    <div className="ml-2 overflow-hidden">
                      <h2 className="text-sm font-medium truncate" title={file.fileName}>
                        {file.fileName}
                      </h2>
                      <p className="text-xs text-gray-500">
                        {file.fileSize ? Math.round(file.fileSize / 1024) + ' KB' : 'Size unknown'}
                      </p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="text-xs text-gray-500 mb-1">Hash (SHA-256)</div>
                    <div className="bg-gray-900 p-2 rounded font-mono text-xs break-all">
                      {file.hash.substring(0, 20)}...
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mb-1">Source URI</div>
                  <div className="bg-gray-900 p-2 rounded text-xs">
                    <div className="truncate" title={file.uri}>
                      {file.uri}
                    </div>
                  </div>
                </div>

                <div className="mt-2 border-t border-gray-700 px-4 py-3 flex items-center justify-between">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${file.downloadStatus === 'downloaded'
                      ? 'bg-green-900 text-green-200'
                      : file.downloadStatus === 'failed'
                        ? 'bg-red-900 text-red-200'
                        : 'bg-yellow-900 text-yellow-200'
                    }`}>
                    {file.downloadStatus}
                  </span>

                  <div className="flex space-x-2">
                    <button
                      className="p-1 hover:bg-gray-700 rounded"
                      title="Download/View"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(file);
                      }}
                    >
                      <Download size={16} className="text-gray-400" />
                    </button>
                    <button
                      className="p-1 hover:bg-gray-700 rounded"
                      title="Open source"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(file.uri, '_blank');
                      }}
                    >
                      <ExternalLink size={16} className="text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* File Preview Modal */}
      {viewingFile && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 overflow-hidden">
            <div className="bg-gray-700 px-4 py-3 flex items-center justify-between">
              <h3 className="font-medium">File Preview</h3>
              <button
                className="text-gray-400 hover:text-white"
                onClick={() => {
                  setViewingFile(null);
                  window.URL.revokeObjectURL(viewingFile);
                }}
              >
                Close
              </button>
            </div>
            <div className="p-4">
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                {viewingFile.startsWith('data:image') || viewingFile.includes('image/') ? (
                  <img src={viewingFile} alt="Preview" className="max-w-full h-auto" />
                ) : viewingFile.includes('application/pdf') ? (
                  <iframe src={viewingFile} className="w-full h-[600px]" title="PDF Preview" />
                ) : (
                  <iframe src={viewingFile} className="w-full h-[600px]" title="File Preview" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilesList;