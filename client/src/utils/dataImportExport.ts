// src/utils/dataImportExport.ts
import { localStorageService } from '@/services/localStorage';

const DATA_SCHEMA_VERSION = '1.0';
const APP_VERSION = __APP_VERSION__;

/**
 * Generates the full JSON string for data export, including metadata.
 * @returns {string} A stringified JSON object ready for export.
 */
export function generateExportJson(): string {
  const exportData: { [key: string]: any } = {};

  // 1. Gather all data from localStorage under our namespace
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith('npp.')) {
      const data = localStorageService.getValue(key.replace('npp.', ''));
      if (data) {
        exportData[key.replace('npp.', '')] = data;
      }
    }
  }

  // 2. Add metadata
  const metadata = {
    export_date: new Date().toISOString(),
    app_version: APP_VERSION,
    data_schema_version: DATA_SCHEMA_VERSION,
  };

  const fullExport = {
    metadata,
    data: exportData,
  };

  return JSON.stringify(fullExport, null, 2);
}

/**
 * Triggers a download of the provided data as a JSON file.
 * @param {string} jsonString The JSON content to download.
 */
function triggerJsonDownload(jsonString: string) {
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  link.download = `net-pack-parser-export-${timestamp}.json`;

  document.body.appendChild(link);
  link.click();

  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Gathers all application data from localStorage and triggers a download of the data as a JSON file.
 */
export function exportDataAsJson() {
  const jsonString = generateExportJson();
  triggerJsonDownload(jsonString);
}

/**
 * Imports data from a JSON string, validates it, and stores it in localStorage.
 * @param {string} jsonString The JSON content to import.
 * @param {'merge' | 'replace'} mode Whether to merge with or replace existing data.
 * @returns {{success: boolean, message: string, importedCount: number}} An object indicating the result.
 */
export function importDataFromJson(
  jsonString: string,
  mode: 'merge' | 'replace',
): { success: boolean; message: string; importedCount: number } {
  try {
    const parsed = JSON.parse(jsonString);

    // 1. Validate basic structure
    if (!parsed.metadata || !parsed.data) {
      throw new Error(
        'Invalid import file format: missing metadata or data section.',
      );
    }

    // 2. Validate schema version
    if (parsed.metadata.data_schema_version !== DATA_SCHEMA_VERSION) {
      throw new Error(
        `Invalid schema version. Expected ${DATA_SCHEMA_VERSION}, but file is version ${parsed.metadata.data_schema_version}.`,
      );
    }

    // 3. Process data
    if (mode === 'replace') {
      localStorageService.clearAll();
    }

    const dataToImport = parsed.data;
    let importedCount = 0;
    for (const key in dataToImport) {
      if (Object.prototype.hasOwnProperty.call(dataToImport, key)) {
        // The data-version is part of the import, so we let it be set.
        // The service's checkVersion on next load will handle any future migrations if needed.
        localStorageService.setValue(key, dataToImport[key]);
        importedCount++;
      }
    }

    return {
      success: true,
      message: `Successfully imported ${importedCount} items.`,
      importedCount,
    };
  } catch (error: any) {
    console.error('Import failed:', error);
    return {
      success: false,
      message: error.message || 'An unknown error occurred during import.',
      importedCount: 0,
    };
  }
}
