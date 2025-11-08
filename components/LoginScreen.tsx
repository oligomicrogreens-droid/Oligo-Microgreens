
import React from 'react';
import { useUser } from '../contexts/UserContext';
import type { User } from '../types';
import { UserRole } from '../types';
import { LeafIcon } from './icons';

const predefinedUsers: User[] = [
    { name: 'Admin User', role: UserRole.Admin },
    { name: 'Sales Rep', role: UserRole.Sales },
    { name: 'Production Staff', role: UserRole.Production },
    { name: 'Logistics Coordinator', role: UserRole.Logistics },
];

const roleDescriptions: Record<UserRole, string> = {
    [UserRole.Admin]: "Full access to all features and settings.",
    [UserRole.Sales]: "Manages orders, clients, and views reports.",
    [UserRole.Production]: "Handles sowing, harvesting, and seed inventory.",
    [UserRole.Logistics]: "Manages dispatch and final delivery of orders.",
};

const roleColors: Record<UserRole, string> = {
    [UserRole.Admin]: 'bg-red-500 hover:bg-red-600',
    [UserRole.Sales]: 'bg-blue-500 hover:bg-blue-600',
    [UserRole.Production]: 'bg-green-500 hover:bg-green-600',
    [UserRole.Logistics]: 'bg-indigo-500 hover:bg-indigo-600',
};

const LoginScreen: React.FC = () => {
    const { login } = useUser();

    return (
        <div className="flex flex-col justify-center items-center min-h-screen bg-slate-100 dark:bg-slate-900 p-4">
            <div className="text-center mb-10">
                <LeafIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h1 className="text-4xl font-bold text-slate-800 dark:text-white">Welcome to Microgreen Hub</h1>
                <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">Please select a user profile to continue.</p>
            </div>
            <div className="w-full max-w-md space-y-4">
                {predefinedUsers.map(user => (
                    <button
                        key={user.role}
                        onClick={() => login(user)}
                        className={`w-full text-left p-5 rounded-xl shadow-lg text-white transition-transform transform hover:scale-105 ${roleColors[user.role]}`}
                    >
                        <h2 className="text-xl font-bold">{user.name}</h2>
                        <p className="text-sm opacity-90 mt-1">{roleDescriptions[user.role]}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default LoginScreen;