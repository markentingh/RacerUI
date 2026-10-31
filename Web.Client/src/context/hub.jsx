import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { HubConnectionBuilder, HttpTransportType } from '@microsoft/signalr';

const HubContext = createContext(null);

export function HubProvider({ children }) {
  const [connection] = useState(() =>
    new HubConnectionBuilder()
      .withUrl('/dashboardhub', { skipNegotiation: true, transport: HttpTransportType.WebSockets })
      .build()
  );
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let keepAlive = null;
    let disposed = false;
    connection.on('update', (msg) => console.log(msg));
    connection.on('handshake', () => setConnected(true));
    connection.start()
      .then(() => {
        if (disposed) return;
        connection.send('Handshake');
        keepAlive = setInterval(() => {
          connection.send('KeepAlive').catch(() => { });
        }, 10000);
      })
      .catch((e) => console.error(e));
    return () => {
      disposed = true;
      if (keepAlive) clearInterval(keepAlive);
      connection.stop();
    };
  }, [connection]);

  const value = useMemo(() => ({ connection, connected }), [connection, connected]);
  return <HubContext.Provider value={value}>{children}</HubContext.Provider>;
}

export function useHub() {
  const context = useContext(HubContext);
  if (!context) throw new Error('useHub must be used within a HubProvider');
  return context;
}
