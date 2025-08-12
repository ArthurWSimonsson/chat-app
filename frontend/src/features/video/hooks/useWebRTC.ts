import { useState, useEffect, useCallback, useRef } from 'react';
import { peerConnectionConfig, SignalingMessage, SignalingMessageType } from '../services/webRTCHelpers';
import { UseSignalingReturn } from './useSignaling';

interface UseWebRTCReturn {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  startLocalStream: () => Promise<MediaStream | null>; // Modified to return stream
  initiateCall: (targetUserId: string) => Promise<void>;
  endCall: () => void;
  isCallActive: boolean;
  // Add other relevant states and functions: e.g., toggleMute, toggleVideo
}

const useWebRTC = (signaling: UseSignalingReturn | null, currentUserId?: string | number | null): UseWebRTCReturn => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);

  // --- Core Functions ---

  const startLocalStream = useCallback(async (): Promise<MediaStream | null> => {
    if (localStream) { // If stream already exists, return it
        console.log('WebRTC: Local stream already active.');
        return localStream;
    }
    try {
      console.log('WebRTC: Attempting to get user media...');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      console.log('WebRTC: Local stream obtained successfully.');
      return stream;
    } catch (error) {
      console.error('WebRTC: Error accessing media devices.', error);
      setLocalStream(null); // Ensure state is null if error occurs
      return null;
    }
  }, [localStream]); // Dependency on localStream to return existing if available

  const createPeerConnection = useCallback((streamForPc?: MediaStream | null) => {
    if (!currentUserId) {
      console.error("WebRTC: Current user ID is not available to create peer connection.");
      return null;
    }
    // If a peer connection already exists, close it before creating a new one
    if (peerConnectionRef.current) {
        console.log('WebRTC: Closing existing peer connection before creating a new one.');
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
    }

    console.log('WebRTC: Creating new RTCPeerConnection.');
    const pc = new RTCPeerConnection(peerConnectionConfig);
    peerConnectionRef.current = pc; // Set the ref immediately

    pc.onicecandidate = (event) => {
      if (event.candidate && signaling && targetUserId) { // Ensure targetUserId is set for candidates
        console.log('WebRTC: Sending ICE candidate to', targetUserId);
        signaling.sendMessage({
          type: SignalingMessageType.ICE_CANDIDATE,
          payload: event.candidate,
          targetUserId: targetUserId,
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('WebRTC: Remote track received.', event.track);
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      } else {
        const newStream = new MediaStream();
        newStream.addTrack(event.track);
        setRemoteStream(newStream);
      }
      if (!isCallActive) setIsCallActive(true); // Set call active when remote track comes in
    };

    const streamToUse = streamForPc || localStream; // Prioritize explicitly passed stream
    if (streamToUse) {
      console.log('WebRTC: Adding tracks from local stream to PeerConnection.');
      streamToUse.getTracks().forEach(track => {
        pc.addTrack(track, streamToUse);
      });
    } else {
      console.warn("WebRTC: No local stream available when creating peer connection. Tracks will need to be added later if stream starts.");
    }

    return pc;
  }, [signaling, targetUserId, currentUserId, localStream, isCallActive]); // Added localStream & isCallActive here

  const endCall = useCallback(() => {
    console.log('WebRTC: Ending call.');
    if (peerConnectionRef.current) {
      peerConnectionRef.current.getSenders().forEach(sender => sender.track?.stop());
      // No need to iterate receivers to stop tracks, happens automatically on close or stream stop
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    setIsCallActive(false);

    if (signaling && targetUserId) {
      console.log('WebRTC: Sending CALL_ENDED message to', targetUserId);
      signaling.sendMessage({ type: SignalingMessageType.CALL_ENDED, targetUserId: targetUserId });
    }
    setTargetUserId(null); // Reset target user on call end
  }, [localStream, signaling, targetUserId]);


  const initiateCall = useCallback(async (userIdToCall: string) => {
    if (!signaling) {
        console.error('WebRTC: Signaling not available to initiate call.');
        return;
    }
    if (!currentUserId) {
        console.error('WebRTC: Current user ID not available for initiating call.');
        return;
    }

    console.log(`WebRTC: Initiating call to ${userIdToCall}`);
    setTargetUserId(userIdToCall);

    const stream = localStream || await startLocalStream(); // Ensure local stream is started
    if (!stream) {
      console.error('WebRTC: Failed to get local stream for initiating call.');
      return;
    }

    // Create or get peer connection, ensuring it uses the latest stream
    const pc = peerConnectionRef.current || createPeerConnection(stream);
    if (!pc) {
      console.error("WebRTC: Failed to create or get peer connection for initiating call.");
      return;
    }
    // If PC existed but didn't have tracks because localStream wasn't ready then
    if (stream && pc.getSenders().length === 0) {
        console.log("WebRTC: Adding tracks to existing PC for initiateCall");
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
    }


    try {
      console.log('WebRTC: Creating offer...');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log('WebRTC: Offer created and set. Sending offer to', userIdToCall);
      signaling.sendMessage({
        type: SignalingMessageType.OFFER,
        payload: pc.localDescription, // Send the full localDescription
        targetUserId: userIdToCall,
      });
      setIsCallActive(true);
    } catch (error) {
      console.error('WebRTC: Error creating offer.', error);
      endCall(); // Clean up if offer fails
    }
  }, [signaling, currentUserId, localStream, startLocalStream, createPeerConnection, endCall]);

  // --- Effect for Handling Signaling Messages ---
  useEffect(() => {
    if (!signaling || !signaling.lastMessage || !currentUserId) return;

    const { type, payload, senderUserId } = signaling.lastMessage;

    // Ignore messages not intended for the current user (if targetUserId is specified)
    if (signaling.lastMessage.targetUserId && signaling.lastMessage.targetUserId !== currentUserId.toString()) {
      console.log("WebRTC: Received signaling message not for me.", signaling.lastMessage);
      return;
    }

    // Function to ensure peer connection exists, especially for callee
    const ensurePeerConnection = async (streamForPcSetup?: MediaStream | null): Promise<RTCPeerConnection | null> => {
        if (peerConnectionRef.current) return peerConnectionRef.current;

        // If there's no PC, we are likely the callee or need to re-establish.
        // Try to get local stream if not already available.
        const stream = streamForPcSetup || localStream || await startLocalStream();
        if (!stream && type !== SignalingMessageType.CALL_ENDED) { // CALL_ENDED might not need a stream
             console.error("WebRTC: Local stream unavailable for creating peer connection for incoming message.");
             return null;
        }
        return createPeerConnection(stream); // Pass the obtained stream
    };


    (async () => {
        let pc = peerConnectionRef.current;

        switch (type) {
            case SignalingMessageType.OFFER:
                if (senderUserId) {
                    console.log('WebRTC: Received offer from', senderUserId);
                    setTargetUserId(senderUserId); // The sender of the offer is now our target

                    pc = await ensurePeerConnection(); // Ensure PC exists, will start stream if needed
                    if (!pc) {
                        console.error("WebRTC: Failed to ensure peer connection for handling offer.");
                        return;
                    }
                    // If ensurePeerConnection started the stream, and PC was created, tracks should be added by it.
                    // If PC existed, and stream started, ensure tracks are on it.
                    if (localStream && pc.getSenders().length === 0) {
                        localStream.getTracks().forEach(track => pc?.addTrack(track, localStream));
                    }

                    try {
                        await pc.setRemoteDescription(new RTCSessionDescription(payload));
                        console.log('WebRTC: Remote description (offer) set. Creating answer...');
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);
                        console.log('WebRTC: Answer created and set. Sending answer to', senderUserId);
                        signaling.sendMessage({
                            type: SignalingMessageType.ANSWER,
                            payload: pc.localDescription, // Send the full localDescription
                            targetUserId: senderUserId,
                        });
                        if(!isCallActive) setIsCallActive(true);
                    } catch (error) {
                        console.error('WebRTC: Error handling offer or creating answer.', error);
                    }
                }
                break;

            case SignalingMessageType.ANSWER:
                if (senderUserId) {
                    console.log('WebRTC: Received answer from', senderUserId);
                    pc = peerConnectionRef.current; // Should have been created by initiateCall
                    if (!pc) {
                        console.error("WebRTC: PeerConnection is null when trying to set remote answer. Call likely not initiated properly.");
                        return;
                    }
                    try {
                        await pc.setRemoteDescription(new RTCSessionDescription(payload));
                        console.log('WebRTC: Remote description (answer) set successfully.');
                        // Call is now fully established
                        if(!isCallActive) setIsCallActive(true);
                    } catch (error) {
                        console.error('WebRTC: Error setting remote description (answer).', error);
                    }
                }
                break;

            case SignalingMessageType.ICE_CANDIDATE:
                if (senderUserId && payload) {
                    console.log('WebRTC: Received ICE candidate from', senderUserId);
                    pc = peerConnectionRef.current;
                    if (!pc) {
                        console.warn("WebRTC: PeerConnection is null when receiving ICE candidate. Candidate might be lost if connection isn't set up yet.");
                        // TODO: Potentially queue candidates if pc isn't ready
                        return;
                    }
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(payload));
                        console.log('WebRTC: ICE candidate added successfully.');
                    } catch (error) {
                        console.error('WebRTC: Error adding ICE candidate.', error, payload);
                    }
                }
                break;

            case SignalingMessageType.CALL_ENDED:
                if (senderUserId && senderUserId === targetUserId) {
                    console.log('WebRTC: Call ended by remote user', senderUserId);
                    endCall();
                } else if (senderUserId) {
                    console.log('WebRTC: Received CALL_ENDED from an unexpected user or no active call with them.', senderUserId);
                }
                break;

            default:
                console.log("WebRTC: Received unhandled signaling message type:", type);
                break;
        }
    })();
  }, [
    signaling, // Use signaling directly as a dependency
    currentUserId,
    localStream, // For re-evaluation when localStream changes from null to a stream
    startLocalStream,
    createPeerConnection,
    endCall,
    targetUserId, // For re-evaluation if targetUserId changes through other means
    isCallActive // To potentially manage call state transitions
  ]);


  // --- Cleanup Effect ---
  useEffect(() => {
    // This effect runs when the component using this hook unmounts
    return () => {
      console.log('WebRTC: Cleaning up useWebRTC hook (unmounting).');
      endCall();
    };
  }, [endCall]); // endCall is memoized, so this won't cause extra runs unless endCall itself changes

  return {
    localStream,
    remoteStream,
    startLocalStream,
    initiateCall,
    endCall,
    isCallActive,
  };
};

export default useWebRTC;