
import React, { useState } from 'react';
import type { MicrogreenVariety, MicrogreenVarietyName } from '../types';

interface ImportVarietiesModalProps {
    onClose: () => void;
    onImport: (varietiesToImport: MicrogreenVariety[]) => void;
    existingVarietyNames: MicrogreenVarietyName[];
}

const ImportVarietiesModal: React.FC<ImportVarietiesModalProps> = ({ onClose, onImport, existingVarietyNames }) => {
    const [file, setFile] = useState<File | null>(null);
    const [parsedVarieties, setParsedVarieties] = useState<MicrogreenVariety[]>([]);
    const [error, setError] = useState<string | null>(null);
    const existingNamesSet = new Set(existingVarietyNames.map(name => name.toLowerCase()));

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setError(null);
        setParsedVarieties([]);

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            try {
                const parsed = parseCSV(text);
                setParsedVarieties(parsed);
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('An unknown error occurred during parsing.');
                }
            }
        };
        reader.onerror = () => {
            setError("Failed to read the file.");
        };
        reader.readAsText(selectedFile);
    };

    const parseCSV = (csvText: string): MicrogreenVariety[] => {
        const lines = csvText.trim().split(/\r\n|\n/);
        if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row.");

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
        const nameHeader = headers.find(h => ['name', 'variety', 'varietyname'].includes(h));
        const daysHeader = headers.find(h => ['growthcycledays', 'days', 'growthcycle', 'cycle'].includes(h));

        if (!nameHeader) throw new Error(`Missing required header column: "name".`);
        if (!daysHeader) throw new Error(`Missing required header column: "growthCycleDays".`);

        const nameIndex = headers.indexOf(nameHeader);
        const daysIndex = headers.indexOf(daysHeader);

        const varieties: MicrogreenVariety[] = [];
        const seenNames = new Set<string>();

        lines.slice(1).forEach((line, index) => {
            if (!line.trim()) return; // Skip empty lines
            const values = line.split(',');
            const name = values[nameIndex]?.trim();
            const growthCycleDays = Number(values[daysIndex]?.trim());

            if (!name) throw new Error(`Row ${index + 2}: 'name' is missing.`);
            if (isNaN(growthCycleDays) || growthCycleDays <= 0) throw new Error(`Row ${index + 2}: 'growthCycleDays' for "${name}" must be a positive number.`);
            if (existingNamesSet.has(name.toLowerCase())) throw new Error(`Row ${index + 2}: Variety "${name}" already exists and will be skipped.`);
            if (seenNames.has(name.toLowerCase())) throw new Error(`Row ${index + 2}: Duplicate variety "${name}" found in the file.`);

            seenNames.add(name.toLowerCase());
            varieties.push({ name, growthCycleDays });
        });

        return varieties;
    };
    
    const handleImport = () => {
        if (parsedVarieties.length > 0) {
            onImport(parsedVarieties);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Import Varieties from File (Excel/CSV)</h2>
                </div>
                <div className="p-6 space-y-6 overflow-y-auto">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">1. Prepare Your File</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Save your Excel sheet as a <strong className="font-semibold text-gray-700 dark:text-gray-200">CSV (Comma-separated values)</strong> file with the following columns.</p>
                        <table className="w-full text-left text-sm mt-3 border-collapse">
                             <thead className="border-b-2 border-gray-300 dark:border-gray-600">
                                <tr>
                                    <th className="p-2 font-semibold">Column</th>
                                    <th className="p-2 font-semibold">Example</th>
                                    <th className="p-2 font-semibold">Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-gray-200 dark:border-gray-700"><td className="p-2">name</td><td className="p-2 font-mono">Sunflower</td><td className="p-2">The name of the microgreen variety.</td></tr>
                                <tr><td className="p-2">growthCycleDays</td><td className="p-2 font-mono">8</td><td className="p-2">The number of days in its growth cycle.</td></tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">2. Upload the CSV File</h3>
                        <input id="csv-upload" type="file" accept=".csv,text/csv" onChange={handleFileChange} className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-100 file:text-green-800 hover:file:bg-green-200 dark:file:bg-blue-900 dark:file:text-blue-200 dark:hover:file:bg-blue-800" />
                    </div>
                    
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                            <p className="text-sm font-semibold text-red-800 dark:text-red-300">Error Parsing File</p>
                            <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
                        </div>
                    )}
                    
                    {parsedVarieties.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">3. Preview & Confirm</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{parsedVarieties.length} new varieties will be added.</p>
                            <div className="mt-2 max-h-48 overflow-y-auto space-y-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                                {parsedVarieties.map((variety, index) => (
                                    <div key={index} className="bg-white dark:bg-gray-800 p-2 rounded shadow-sm flex justify-between">
                                        <p className="font-semibold">{variety.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{variety.growthCycleDays} days</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                    <button onClick={handleImport} disabled={parsedVarieties.length === 0 || !!error} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed">Import {parsedVarieties.length > 0 ? parsedVarieties.length : ''} Varieties</button>
                </div>
            </div>
        </div>
    );
};

export default ImportVarietiesModal;
