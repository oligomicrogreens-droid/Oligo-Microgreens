
import React from 'react';
import { ExclamationTriangleIcon } from './icons';

interface PermissionDeniedProps {
    onGoToDashboard: () => void;
}

const PermissionDenied: React.FC<PermissionDeniedProps> = ({ onGoToDashboard }) => {
    return (
        <div className="text-center py-16 px-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg max-w-lg mx-auto">
            <ExclamationTriangleIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Access Denied</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
                You do not have permission to view this page. Your current role does not grant access to this section.
            </p>
            <button
                onClick={onGoToDashboard}
                className="mt-6 px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-slate-800 transition-colors"
            >
                Return to Dashboard
            </button>
        </div>
    );
};

export default PermissionDenied;