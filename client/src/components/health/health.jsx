import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  checkHealth,
  updateLiveHealth,
  setStreamConnection,
} from "../../redux/Slices/routeslice";
import { Button } from "../ui/button";
import {
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  Server,
  Radio,
  Cpu,
} from "lucide-react";
import ModeToggle from "../theme/mode-toggle";

function HealthStatus() {
  const dispatch = useDispatch();
  const health = useSelector((state) => state.health || state.Health || {});

  const isHealthy = health.status === "healthy";
  const isUnhealthy = health.status === "unhealthy";
  const isChecking = health.status === "loading" || health.status === "checking...";
  const isLive = health.connectionState === "connected";
  const isConnecting = health.connectionState === "connecting";

  // Phase 3: SSE stream lifecycle
  useEffect(() => {
    dispatch(setStreamConnection("connecting"));

    const streamUrl = `${import.meta.env.VITE_API_URL}/api/v1/health/status`;
    const eventSource = new EventSource(streamUrl);

    eventSource.onopen = () => {
      dispatch(setStreamConnection("connected"));
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        dispatch(updateLiveHealth(data));
      } catch (err) {
        console.error("Failed to parse SSE health event:", err);
      }
    };

    eventSource.onerror = () => {
      // EventSource automatically attempts to reconnect on error
      dispatch(setStreamConnection("connecting"));
    };

    return () => {
      eventSource.close();
      dispatch(setStreamConnection("disconnected"));
    };
  }, [dispatch]);

  const getStreamBadgeStyle = () => {
    if (isLive) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    if (isConnecting) return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
    return "bg-muted text-muted-foreground border-border";
  };

  const getStreamDotStyle = () => {
    if (isLive) return "bg-emerald-500 animate-pulse";
    if (isConnecting) return "bg-amber-500 animate-ping";
    return "bg-muted-foreground";
  };

  const getStreamLabel = () => {
    if (isLive) return "LIVE";
    if (isConnecting) return "RECONNECTING";
    return "OFFLINE";
  };

  const getHealthBadgeStyle = () => {
    if (isHealthy) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    if (isUnhealthy) return "bg-destructive/10 text-destructive border-destructive/30";
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 transition-colors duration-200">
      <div className="w-full max-w-md bg-card text-card-foreground border border-border rounded-xl shadow-sm p-6 space-y-6">
      <ModeToggle
        size="icon-sm"
        side="top"
        align="end"
        className="rounded-full left-92 size-7 border-border hover:bg-muted text-muted-foreground hover:text-foreground"
      />
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-muted text-muted-foreground">
              <Server className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold leading-none">
                  Backend Status
                </h2>
                {/* Live stream badge */}
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border ${getStreamBadgeStyle()}`}
                >
                  <span
                    className={`size-1.5 rounded-full ${getStreamDotStyle()}`}
                  />
                  {getStreamLabel()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Real-time SSE Stream (5s interval)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getHealthBadgeStyle()}`}
            >
              {isHealthy && <CheckCircle2 className="size-3.5 text-emerald-500" />}
              {isUnhealthy && <XCircle className="size-3.5 text-destructive" />}
              {!isHealthy && !isUnhealthy && (
                <Activity className="size-3.5 text-muted-foreground" />
              )}
              <span className="capitalize">{health.status || "idle"}</span>
            </span>

          </div>
        </div>


        {/* Status Details */}
        <div className="rounded-lg border border-border bg-muted/40 divide-y divide-border text-sm">
          <div className="flex justify-between items-center px-4 py-2.5">
            <span className="text-muted-foreground">Stream Connection</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-xs capitalize text-foreground">
              <Radio
                className={`size-3.5 ${isLive
                  ? "text-emerald-500 animate-pulse"
                  : "text-muted-foreground"
                  }`}
              />
              {health.connectionState || "disconnected"}
              {health.isStale && !isLive && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1 rounded">
                  stale
                </span>
              )}
            </span>
          </div>

          <div className="flex justify-between items-center px-4 py-2.5">
            <span className="text-muted-foreground">Status</span>
            <span className="font-medium capitalize text-foreground">
              {health.status || "Unknown"}
            </span>
          </div>

          <div className="flex justify-between items-center px-4 py-2.5">
            <span className="text-muted-foreground">Message</span>
            <span
              className="font-medium text-right truncate max-w-[200px] text-foreground"
              title={health.message}
            >
              {health.message || "—"}
            </span>
          </div>

          <div className="flex justify-between items-center px-4 py-2.5">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Clock className="size-3.5 text-muted-foreground" />
              Uptime
            </span>
            <span className="font-mono text-xs font-semibold bg-background px-2 py-0.5 rounded border border-border text-foreground">
              {health.uptime ?? 0}s
            </span>
          </div>

          {health.memory && (
            <div className="flex justify-between items-center px-4 py-2.5">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Cpu className="size-3.5 text-muted-foreground" />
                Memory (Heap / RSS)
              </span>
              <span className="font-mono text-xs font-medium bg-background px-2 py-0.5 rounded border border-border text-foreground">
                {health.memory.heapUsed} / {health.memory.rss}
              </span>
            </div>
          )}

          {health.timestamp && (
            <div className="flex justify-between items-center px-4 py-2.5 text-xs">
              <span className="text-muted-foreground">Last Synced</span>
              <span className="font-mono text-muted-foreground">
                {new Date(health.timestamp).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>

        {/* Manual Refresh Action */}
        <Button
          onClick={() => dispatch(checkHealth())}
          disabled={isChecking}
          variant="outline"
          className="w-full h-10 font-medium transition-all shadow-xs"
        >
          <RefreshCw
            className={`size-4 mr-2 ${isChecking ? "animate-spin" : ""}`}
          />
          {isChecking ? "Checking Backend..." : "Manual Snapshot Refresh"}
        </Button>
      </div>
    </div>
  );
}

export default HealthStatus;