import { useCallback, useEffect, useRef, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabaseClient } from '../utils/supabaseClient';
import type { BroadcastEventName, BroadcastPayloads } from '../utils/realtime';

type EventCallback<T extends BroadcastEventName> = (payload: BroadcastPayloads[T]) => void;

let channelInstance: RealtimeChannel | null = null;
let subscribed = false;

function getChannel(): RealtimeChannel {
  if (!channelInstance) {
    channelInstance = supabaseClient.channel('nexus-rpg', {
      config: {
        broadcast: { self: true },
      },
    });
  }
  if (!subscribed) {
    subscribed = true;
    channelInstance.subscribe();
  }
  return channelInstance;
}

export default function useRealtime() {
  const channelRef = useRef<RealtimeChannel>(getChannel());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const channel = channelRef.current;

    if (channel.state === 'joined') {
      setReady(true);
      return;
    }

    const interval = setInterval(() => {
      if (channel.state === 'joined') {
        setReady(true);
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const on = useCallback(<T extends BroadcastEventName>(event: T, callback: EventCallback<T>) => {
    const channel = channelRef.current;
    
    channel.on(
      'broadcast' as any,
      { event } as any,
      (payload: { payload: BroadcastPayloads[T] }) => {
        callback(payload.payload);
      }
    );
    
    // Retornar função vazia corrige a falha 'reading timeout' nos desmotes (useEffect cleanup)
    return () => {};
  }, []);

  return { on, ready, channel: channelRef };
}
