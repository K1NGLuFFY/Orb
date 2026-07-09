// src/hooks/useProductStockSubscription.js
import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Subscribes to Postgres UPDATE events on the products table.
 * Calls onStockUpdate(updatedProduct) whenever a row is updated.
 *
 * @param {Function} onStockUpdate  - Callback: (updatedRow) => void
 * @param {boolean}  enabled        - Set to false to disable (e.g., when no local products are shown)
 */
export const useProductStockSubscription = (onStockUpdate, enabled = true) => {
    const callbackRef = useRef(onStockUpdate);

    // Keep callback ref up to date without recreating the channel
    useEffect(() => {
        callbackRef.current = onStockUpdate;
    }, [onStockUpdate]);

    useEffect(() => {
        if (!enabled) return;

        const channel = supabase
            .channel('public:products:stock')          // unique channel name
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'products',
                },
                (payload) => {
                    // payload.new is the full updated row
                    callbackRef.current(payload.new);
                }
            )
            .subscribe((status) => {
                if (status === 'CHANNEL_ERROR') {
                    console.error('[Realtime] products channel error. Reconnecting...');
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [enabled]);
};
