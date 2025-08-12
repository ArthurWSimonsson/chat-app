import { useEffect, useState, useCallback, useRef } from 'react';
import { SignalingMessage, SignalingMessageType } from '../services/webRTCHelpers';
import { useSelector } from 'react-redux';
import { selectToken } from '../../auth/authSelectors'; //
import { User } from '../../auth/authSlice'; //
import { RootState } from '../../../app/store'; //

// Replace with your actual WebSocket server URL for the chat-service
const SIGNALING_SERVER_URL = 'ws://localhost:8082/signaling'; // Example URL

export interface UseSignalingReturn {
  sendMessage: (message: SignalingMessage) => void;
  lastMessage: SignalingMessage | null;
  isConnected: boolean;
}

const useSignaling = (): UseSignalingReturn => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [lastMessage, setLastMessage] = useState<SignalingMessage | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const authToken = useSelector(selectToken); // Get auth token for potential WebSocket authentication
  const currentUser = useSelector((state: RootState) => state.auth.user); // Get current user info

  useEffect(() => {
    if (!authToken || !currentUser?.id) {
      console.log('Signaling: No auth token or user ID, WebSocket not connected.');
      return;
    }

    // Append token for authentication if your backend supports it (e.g., via query param or subprotocol)
    // This is a common pattern, but actual implementation depends on your backend.
    const wsUrl = `${SIGNALING_SERVER_URL}?token=${authToken}&userId=${currentUser.id}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Signaling: Connected to WebSocket server');
      setIsConnected(true);
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data as string) as SignalingMessage;
        console.log('Signaling: Received message:', message);
        setLastMessage(message);
      } catch (error) {
        console.error('Signaling: Error parsing message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('Signaling: WebSocket error:', error);
      setIsConnected(false);
    };

    ws.onclose = (event) => {
      console.log('Signaling: WebSocket disconnected', event.reason);
      setIsConnected(false);
      setSocket(null);
    };

    // Cleanup on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [authToken, currentUser?.id]);

  const sendMessage = useCallback((message: SignalingMessage) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      // Automatically add senderUserId if not present
      const messageToSend = {
        ...message,
        senderUserId: message.senderUserId || currentUser?.id?.toString(),
      };
      console.log('Signaling: Sending message:', messageToSend);
      socket.send(JSON.stringify(messageToSend));
    } else {
      console.error('Signaling: WebSocket is not connected or not ready.');
    }
  }, [socket, currentUser?.id]);

  return { sendMessage, lastMessage, isConnected };
};

export default useSignaling;