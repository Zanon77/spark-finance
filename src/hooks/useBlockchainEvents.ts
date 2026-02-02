import { useEffect, useCallback } from 'react';
import { BlockchainService } from '@/services/BlockchainService';
import { BlockchainEvent } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function useBlockchainEvents() {
  const { toast } = useToast();

  const handleEvent = useCallback((event: BlockchainEvent) => {
    toast({
      title: event.type,
      description: event.signature,
      duration: 5000,
    });
  }, [toast]);

  useEffect(() => {
    const unsubscribe = BlockchainService.listenToAllEvents(handleEvent);
    return () => unsubscribe();
  }, [handleEvent]);
}
