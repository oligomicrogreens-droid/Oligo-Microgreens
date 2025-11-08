
import React, { useState } from 'react';
import type { Order, OrderItem, MicrogreenVarietyName } from '../types';

interface ImportOrdersModalProps {
    onClose: () => void;
    onImport: (ordersToImport: Omit<Order, 'id' | 'status' | 'createdAt'>[]) => void;
    microgreenVarietyNames: MicrogreenVarietyName[];
}

type ParsedOrder = Omit<Order, 'id' | 'status' | 'createdAt'>;

const ImportOrdersModal: React.FC<ImportOrdersModalProps> = ({ onClose, onImport, microgreenVarietyNames }) => {
    const [file, setFile] = useState<File | null>(null);
    const [parsedOrders, setParsedOrders] = useState<ParsedOrder[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setError(null);
        setParsedOrders([]);

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            try {
                const parsed = parseCSV(text);
                setParsedOrders(parsed);
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

    const parseCSV = (csvText: string): ParsedOrder[] => {
        const lines = csvText.trim().split(/\r\n|\n/);
        if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row.");

        const headers = lines[0].split(',').map(h => h.trim());
        const requiredHeaders = ['clientName', 'deliveryDate', 'variety', 'quantity'];
        for (const h of requiredHeaders) {
            if (!headers.includes(h)) {
                throw new Error(`Missing required header column: "${h}". Please check the file format.`);
            }
        }

        const rawItems = lines.slice(1).map((line, index) => {
            const values = line.split(',');
            const rowData: any = {};
            headers.forEach((header, i) => {
                rowData[header] = values[i]?.trim();
            });

            // Validation
            if (!rowData.clientName) throw new Error(`Row ${index + 2}: clientName is missing.`);
            if (!rowData.deliveryDate || !/^\d{4}-\d{2}-\d{2}$/.test(rowData.deliveryDate)) throw new Error(`Row ${index + 2}: deliveryDate is missing or not in YYYY-MM-DD format.`);
            if (!rowData.variety) throw new Error(`Row ${index + 2}: variety is missing.`);
            if (!microgreenVarietyNames.includes(rowData.variety)) throw new Error(`Row ${index + 2}: variety "${rowData.variety}" is not a valid microgreen variety.`);
            const quantity = Number(rowData.quantity);
            if (isNaN(quantity) || quantity <= 0) throw new Error(`Row ${index + 2}: quantity must be a positive number.`);

            return {
                clientName: rowData.clientName,
                deliveryDate: rowData.deliveryDate,
                location: rowData.location || undefined,
                item: { variety: rowData.variety, quantity },
            };
        });
        
        // Group items into orders
        const ordersMap = new Map<string, { clientName: string; deliveryDate: Date; location?: string; items: OrderItem[] }>();
        rawItems.forEach(row => {
            const key = `${row.clientName}::${row.deliveryDate}`;
            if (!ordersMap.has(key)) {
                ordersMap.set(key, {
                    clientName: row.clientName,
                    deliveryDate: new Date(row.deliveryDate + 'T00:00:00'),
                    location: row.location,
                    items: []
                });
            }
            ordersMap.get(key)!.items.push(row.item);
        });

        return Array.from(ordersMap.values());
    };
    
    const handleImport = () => {
        if (parsedOrders.length > 0) {
            onImport(parsedOrders);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Import Orders from File (Excel/CSV)</h2>
                </div>
                <div className="p-6 space-y-6 overflow-y-auto">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">1. Prepare Your File</h3>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 space-y-2">
                            <p>To import orders from Excel, you must first save it as a <strong className="font-semibold text-gray-700 dark:text-gray-200">CSV (Comma-separated values)</strong> file.</p>
                            <ol className="list-decimal list-inside space-y-1 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                                <li>In Excel, go to <code className="bg-gray-200 dark:bg-gray-700 p-1 rounded">File &gt; Save As</code>.</li>
                                <li>Choose <code className="bg-gray-200 dark:bg-gray-700 p-1 rounded">CSV UTF-8 (.csv)</code> from the file format dropdown.</li>
                                <li>Ensure your file has the required columns shown below.</li>
                            </ol>
                        </div>
                        <table className="w-full text-left text-sm mt-4 border-collapse">
                             <thead className="border-b-2 border-gray-300 dark:border-gray-600">
                                <tr>
                                    <th className="p-2 font-semibold">Column</th>
                                    <th className="p-2 font-semibold">Example</th>
                                    <th className="p-2 font-semibold">Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-gray-200 dark:border-gray-700"><td className="p-2">clientName</td><td className="p-2 font-mono">Green Leaf Cafe</td><td className="p-2">Client's name.</td></tr>
                                <tr className="border-b border-gray-200 dark:border-gray-700"><td className="p-2">deliveryDate</td><td className="p-2 font-mono">2024-12-25</td><td className="p-2">Required format: YYYY-MM-DD.</td></tr>
                                <tr className="border-b border-gray-200 dark:border-gray-700"><td className="p-2">variety</td><td className="p-2 font-mono">Sunflower</td><td className="p-2">Must match an existing variety name exactly.</td></tr>
                                <tr className="border-b border-gray-200 dark:border-gray-700"><td className="p-2">quantity</td><td className="p-2 font-mono">10</td><td className="p-2">Number of 50g boxes.</td></tr>
                                <tr><td className="p-2">location</td><td className="p-2 font-mono">Koramangala</td><td className="p-2">(Optional) Delivery address or area.</td></tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="mt-4">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">2. Upload the CSV File</h3>
                        <input id="csv-upload" type="file" accept=".csv,text/csv" onChange={handleFileChange} className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-100 file:text-green-800 hover:file:bg-green-200 dark:file:bg-green-900 dark:file:text-green-200 dark:hover:file:bg-green-800" />
                    </div>
                    
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                            <p className="text-sm font-semibold text-red-800 dark:text-red-300">Error Parsing File</p>
                            <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
                        </div>
                    )}
                    
                    {parsedOrders.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">3. Preview & Confirm</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{parsedOrders.length} orders will be created.</p>
                            <div className="mt-2 max-h-48 overflow-y-auto space-y-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                                {parsedOrders.map((order, index) => (
                                    <div key={index} className="bg-white dark:bg-gray-800 p-2 rounded shadow-sm">
                                        <p className="font-semibold">{order.clientName} - {order.deliveryDate.toLocaleDateString()}</p>
                                        {order.location && <p className="text-xs text-gray-500 dark:text-gray-400">{order.location}</p>}
                                        <ul className="text-xs list-disc list-inside">
                                            {order.items.map(item => <li key={item.variety}>{item.variety}: {item.quantity} boxes</li>)}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                    <button onClick={handleImport} disabled={parsedOrders.length === 0 || !!error} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed">Import {parsedOrders.length > 0 ? parsedOrders.length : ''} Orders</button>
                </div>
            </div>
        </div>
    );
};

export default ImportOrdersModal;