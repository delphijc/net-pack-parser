import { useCallback } from 'react';
import chainOfCustodyDb from '@/services/chainOfCustodyDb';
import type { ChainOfCustodyEvent } from '@/types';

export const useAuditLogger = () => {
    const logAction = useCallback(async (
        action: string,
        details: string,
        metadata?: Record<string, any>,
        hash?: string
    ) => {
        const event: ChainOfCustodyEvent = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            action,
            details,
            user: 'Analyst', // Hardcoded for now until Auth is implemented
            hash,
            metadata
        };

        try {
            await chainOfCustodyDb.addEvent(event);
        } catch (error) {
            console.error('Failed to log audit event:', error);
        }
    }, []);

    return { logAction };
};
