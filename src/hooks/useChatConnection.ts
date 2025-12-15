import { useEffect, useRef, useState, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import { API_BASE_URL } from "../config/env.config";
import type {
    MessageModel,
    TypingIndicator,
    MessagesReadEvent,
    UserOnlineEvent,
    SendMessageModel,
    MarkAsReadModel,
} from "../types/chat.types";

// Get base URL without /api suffix for SignalR hub
const getHubUrl = () => {
    const baseUrl = API_BASE_URL.replace(/\/api\/?$/, "");
    return `${baseUrl}/chatHub`;
};

interface UseChatConnectionOptions {
    onReceiveMessage?: (message: MessageModel) => void;
    onUserTyping?: (indicator: TypingIndicator) => void;
    onMessagesRead?: (event: MessagesReadEvent) => void;
    onUserOnline?: (event: UserOnlineEvent) => void;
    onUserOffline?: (event: UserOnlineEvent) => void;
    onConnectionStateChange?: (state: signalR.HubConnectionState) => void;
}

export function useChatConnection(options: UseChatConnectionOptions = {}) {
    const connectionRef = useRef<signalR.HubConnection | null>(null);
    const isConnectingRef = useRef(false);
    const isMountedRef = useRef(true);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [connectionState, setConnectionState] = useState<signalR.HubConnectionState>(
        signalR.HubConnectionState.Disconnected
    );
    const [error, setError] = useState<string | null>(null);

    // Store callbacks in refs to prevent dependency cycle
    const callbacksRef = useRef(options);
    callbacksRef.current = options;

    // Stop connection
    const stopConnection = useCallback(async () => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (connectionRef.current) {
            try {
                await connectionRef.current.stop();
            } catch (err) {
                console.error("[ChatHub] Error stopping connection:", err);
            }
            connectionRef.current = null;
        }
        isConnectingRef.current = false;
    }, []);

    // Start connection - defined once, uses refs for callbacks
    const startConnection = useCallback(async () => {
        // Prevent multiple simultaneous connections
        if (isConnectingRef.current) {
            return;
        }

        if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
            return;
        }

        // Stop any existing connection first
        await stopConnection();

        const token = localStorage.getItem("accessToken");
        if (!token) {
            console.warn("[ChatHub] No access token found");
            return;
        }

        isConnectingRef.current = true;

        try {
            const hubUrl = getHubUrl();
            console.log("[ChatHub] Building connection to:", hubUrl);

            const connection = new signalR.HubConnectionBuilder()
                .withUrl(hubUrl, {
                    accessTokenFactory: () => token,
                    transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents,
                    skipNegotiation: false,
                })
                .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
                .configureLogging(signalR.LogLevel.Warning)
                .build();

            connectionRef.current = connection;

            // Set up event handlers using refs
            connection.on("ReceiveMessage", (message: MessageModel) => {
                console.log("[ChatHub] Received message:", message);
                callbacksRef.current.onReceiveMessage?.(message);
            });

            connection.on("UserTyping", (indicator: TypingIndicator) => {
                callbacksRef.current.onUserTyping?.(indicator);
            });

            connection.on("MessagesRead", (event: MessagesReadEvent) => {
                callbacksRef.current.onMessagesRead?.(event);
            });

            connection.on("UserOnline", (event: UserOnlineEvent) => {
                callbacksRef.current.onUserOnline?.(event);
            });

            connection.on("UserOffline", (event: UserOnlineEvent) => {
                callbacksRef.current.onUserOffline?.(event);
            });

            // Connection state handlers
            connection.onreconnecting((err) => {
                console.log("[ChatHub] Reconnecting...", err);
                if (isMountedRef.current) {
                    setConnectionState(signalR.HubConnectionState.Reconnecting);
                    callbacksRef.current.onConnectionStateChange?.(signalR.HubConnectionState.Reconnecting);
                }
            });

            connection.onreconnected((connectionId) => {
                console.log("[ChatHub] Reconnected with ID:", connectionId);
                if (isMountedRef.current) {
                    setConnectionState(signalR.HubConnectionState.Connected);
                    callbacksRef.current.onConnectionStateChange?.(signalR.HubConnectionState.Connected);
                    setError(null);
                }
            });

            connection.onclose((err) => {
                console.log("[ChatHub] Connection closed", err);
                if (isMountedRef.current) {
                    setConnectionState(signalR.HubConnectionState.Disconnected);
                    callbacksRef.current.onConnectionStateChange?.(signalR.HubConnectionState.Disconnected);
                }
            });

            await connection.start();

            if (isMountedRef.current) {
                console.log("[ChatHub] Connected successfully");
                setConnectionState(signalR.HubConnectionState.Connected);
                callbacksRef.current.onConnectionStateChange?.(signalR.HubConnectionState.Connected);
                setError(null);
            }
        } catch (err) {
            console.error("[ChatHub] Connection failed:", err);
            if (isMountedRef.current) {
                setError("Không thể kết nối chat");
                setConnectionState(signalR.HubConnectionState.Disconnected);

                // Retry after delay (only if still mounted)
                reconnectTimeoutRef.current = setTimeout(() => {
                    if (isMountedRef.current) {
                        isConnectingRef.current = false;
                        startConnection();
                    }
                }, 5000);
            }
        } finally {
            isConnectingRef.current = false;
        }
    }, [stopConnection]);

    // Send message via SignalR
    const sendMessage = useCallback(async (model: SendMessageModel): Promise<void> => {
        if (connectionRef.current?.state !== signalR.HubConnectionState.Connected) {
            throw new Error("Chat connection not established");
        }

        await connectionRef.current.invoke("SendMessage", model);
    }, []);

    // Join conversation group
    const joinConversation = useCallback(async (conversationId: string): Promise<void> => {
        if (connectionRef.current?.state !== signalR.HubConnectionState.Connected) {
            return;
        }

        await connectionRef.current.invoke("JoinConversation", conversationId);
    }, []);

    // Send typing indicator
    const sendTypingIndicator = useCallback(async (conversationId: string, isTyping: boolean): Promise<void> => {
        if (connectionRef.current?.state !== signalR.HubConnectionState.Connected) {
            return;
        }

        await connectionRef.current.invoke("SendTypingIndicator", conversationId, isTyping);
    }, []);

    // Mark as read via SignalR
    const markAsRead = useCallback(async (model: MarkAsReadModel): Promise<void> => {
        if (connectionRef.current?.state !== signalR.HubConnectionState.Connected) {
            return;
        }

        await connectionRef.current.invoke("MarkAsRead", model);
    }, []);

    // Auto-connect on mount (only once)
    useEffect(() => {
        isMountedRef.current = true;

        // Delay initial connection slightly to prevent race conditions
        const initTimeout = setTimeout(() => {
            startConnection();
        }, 100);

        return () => {
            isMountedRef.current = false;
            clearTimeout(initTimeout);
            stopConnection();
        };
    }, []); // Empty dependency array - only run once

    return {
        connectionState,
        error,
        isConnected: connectionState === signalR.HubConnectionState.Connected,
        sendMessage,
        joinConversation,
        sendTypingIndicator,
        markAsRead,
        reconnect: startConnection,
    };
}
