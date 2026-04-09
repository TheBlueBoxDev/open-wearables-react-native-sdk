import { useEvent } from "expo";
import OpenWearablesHealthSDK from "open-wearables";
import { useCallback, useEffect, useState } from "react";

export type LogEntry = {
  id: string;
  timestamp: Date;
  message: string;
  type: "log" | "error";
};

export function useLogs() {
  const onLogPayload = useEvent(OpenWearablesHealthSDK, "onLog");
  const onAuthErrorPayload = useEvent(OpenWearablesHealthSDK, "onAuthError");
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((message: string, type: LogEntry["type"]) => {
    setLogs((prev) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
        message,
        type,
      },
      ...prev,
    ]);
  }, []);

  useEffect(() => {
    if (!onLogPayload) return;
    console.log(`[OpenWearables] - ${onLogPayload.message}`);
    addLog(onLogPayload.message, "log");
  }, [onLogPayload]);

  useEffect(() => {
    if (!onAuthErrorPayload) return;
    console.error(
      `[OpenWearables] - ${onAuthErrorPayload.statusCode}: ${onAuthErrorPayload.message}`
    );
    addLog(
      `${onAuthErrorPayload.statusCode}: ${onAuthErrorPayload.message}`,
      "error"
    );
  }, [onAuthErrorPayload]);

  const clearLogs = () => setLogs([]);

  return { logs, clearLogs };
}
