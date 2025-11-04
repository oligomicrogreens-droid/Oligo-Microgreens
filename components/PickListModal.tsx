import React, { useEffect } from 'react';
import type { AggregatedHarvestList } from '../types';
import { XMarkIcon } from './icons';

interface PickListModalProps {
  list: AggregatedHarvestList;
  onClose: () => void;
}

const printStyles = `
  @media print {
    @page {
      size: A4;
      margin: 1in;
    }

    /* Hide everything on the page by default */
    body * {
      visibility: hidden;
    }
    
    /* Show only the printable area and its contents */
    #printable-picklist, #printable-picklist * {
      visibility: visible;
    }

    /* Position the printable area to fill the page */
    #printable-picklist {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      padding: 0; /* Use @page margin instead */
      font-size: 12pt;
    }

    /* General print styles for readability */
    #printable-picklist h3 {
      font-size: 18pt;
      font-weight: bold;
      text-align: center;
      margin-bottom: 0.5rem;
    }

    #printable-picklist p {
      text-align: center;
      margin-bottom: 1.5rem;
      font-size: 10pt;
    }

    /* Table styling for a clean printed look */
    #printable-picklist table {
      width: 100%;
      border-collapse: collapse;
      page-break-inside: auto; /* Allow table to break across pages */
    }

    #printable-picklist thead {
      display: table-header-group; /* Ensure header repeats on each page */
      border-bottom: 2px solid black;
    }

    #printable-picklist tbody tr {
      page-break-inside: avoid; /* Avoid breaking rows across pages */
      border-bottom: 1px solid #ccc;
    }
    
    #printable-picklist tbody tr:last-child {
        border-bottom: none;
    }
    
    #printable-picklist th, #printable-picklist td {
      text-align: left;
      padding: 0.5rem;
    }
    
    #printable-picklist th:last-child, #printable-picklist td:last-child {
      text-align: right;
    }

    /* Force light mode colors for printing to save ink */
    #printable-picklist, #printable-picklist * {
        color: black !important;
        background-color: white !important;
        box-shadow: none !important;
        text-shadow: none !important;
    }
    
    a[href]:after {
        content: none !important;
    }
  }
`;

const PickListModal: React.FC<PickListModalProps> = ({ list, onClose }) => {
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = printStyles;
    document.head.appendChild(styleEl);

    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);
  
  const handlePrint = () => {
    window.print();
  };

  const itemsToPick = Object.entries(list)
    .filter(([, quantity]) => Number(quantity) > 0)
    .sort(([varietyA], [varietyB]) => varietyA.localeCompare(varietyB));
  
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 print:bg-transparent print:p-0" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col print:shadow-none print:max-h-full print:max-w-full" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center print:hidden">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Daily Pick List</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div id="printable-picklist" className="p-6 overflow-y-auto">
            <h3 className="text-xl font-bold text-center text-gray-800 dark:text-white mb-2">Harvest Pick List</h3>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-6">{today}</p>
            <table className="w-full text-left">
                <thead className="border-b-2 border-gray-300 dark:border-gray-600">
                    <tr>
                        <th className="py-2 text-sm font-semibold text-gray-600 dark:text-gray-300">Microgreen Variety</th>
                        <th className="py-2 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">Quantity (50g Boxes)</th>
                    </tr>
                </thead>
                <tbody>
                    {itemsToPick.map(([variety, quantity]) => (
                        <tr key={variety}>
                            <td className="py-3 font-medium text-gray-800 dark:text-white">{variety}</td>
                            <td className="py-3 text-right font-mono text-lg font-bold text-gray-800 dark:text-white">{String(quantity)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-3 flex justify-end space-x-3 print:hidden">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">
            Close
          </button>
          <button onClick={handlePrint} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
            Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default PickListModal;
