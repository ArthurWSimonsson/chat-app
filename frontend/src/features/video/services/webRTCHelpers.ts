// Defines STUN server configuration for NAT traversal.
export const peerConnectionConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      // Add more STUN or TURN servers here if needed for production
      // {
      //   urls: 'turn:your-turn-server.com:3478',
      //   username: 'user',
      //   credential: 'password',
      // },
    ],
  };
  
  // Signaling message types (example)
  export enum SignalingMessageType {
    OFFER = 'offer',
    ANSWER = 'answer',
    ICE_CANDIDATE = 'ice-candidate',
    USER_JOINED = 'user-joined',
    USER_LEFT = 'user-left',
    CALL_REQUEST = 'call-request',
    CALL_ACCEPTED = 'call-accepted',
    CALL_REJECTED = 'call-rejected',
    CALL_ENDED = 'call-ended',
  }
  
  export interface SignalingMessage {
    type: SignalingMessageType;
    payload?: any;
    targetUserId?: string; // For direct messages to a specific user
    senderUserId?: string; // To identify the sender
  }