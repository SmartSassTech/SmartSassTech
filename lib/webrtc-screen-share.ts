'use client'

/**
 * WebRTC Screen Sharing Utility
 * 
 * Uses Supabase Realtime broadcast channels for signaling (offer/answer/ICE).
 * No extra infrastructure needed — piggybacks on your existing Supabase project.
 * 
 * Flow:
 *   1. Customer clicks "Share Screen" → getDisplayMedia() → creates offer
 *   2. Offer sent via Supabase broadcast channel to agent
 *   3. Agent receives offer → creates answer → sends back
 *   4. ICE candidates exchanged via same channel
 *   5. Video stream flows peer-to-peer via WebRTC
 */

import { SupabaseClient } from '@supabase/supabase-js'

const ICE_SERVERS: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
]

export type ScreenShareRole = 'sharer' | 'viewer'

export interface ScreenShareCallbacks {
    onRemoteStream?: (stream: MediaStream) => void
    onConnectionStateChange?: (state: RTCPeerConnectionState) => void
    onSharingStarted?: () => void
    onSharingStopped?: () => void
    onError?: (error: Error) => void
}

export class ScreenShareManager {
    private pc: RTCPeerConnection | null = null
    private localStream: MediaStream | null = null
    private channel: ReturnType<SupabaseClient['channel']> | null = null
    private supabase: SupabaseClient
    private sessionId: string
    private role: ScreenShareRole
    private callbacks: ScreenShareCallbacks
    private isActive = false

    constructor(
        supabase: SupabaseClient,
        sessionId: string,
        role: ScreenShareRole,
        callbacks: ScreenShareCallbacks = {}
    ) {
        this.supabase = supabase
        this.sessionId = sessionId
        this.role = role
        this.callbacks = callbacks
    }

    /**
     * Initialize the signaling channel and listen for messages.
     * Both sharer and viewer should call this first.
     */
    async init() {
        const channelName = `screen-share-${this.sessionId}`
        this.channel = this.supabase.channel(channelName)

        this.channel
            .on('broadcast', { event: 'webrtc-signal' }, async ({ payload }) => {
                try {
                    await this.handleSignal(payload)
                } catch (err) {
                    console.error('[ScreenShare] Error handling signal:', err)
                    this.callbacks.onError?.(err as Error)
                }
            })
            .subscribe()
    }

    /**
     * SHARER: Start sharing screen. Captures display and sends offer.
     */
    async startSharing(): Promise<boolean> {
        if (this.role !== 'sharer') {
            console.error('[ScreenShare] Only sharer role can start sharing')
            return false
        }

        try {
            // Request screen capture from browser
            this.localStream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: 'always' } as any,
                audio: false,
            })

            // Detect when user stops sharing via browser UI
            this.localStream.getVideoTracks()[0].onended = () => {
                this.stopSharing()
            }

            // Create peer connection and add tracks
            this.createPeerConnection()
            this.localStream.getTracks().forEach(track => {
                this.pc!.addTrack(track, this.localStream!)
            })

            // Create and send offer
            const offer = await this.pc!.createOffer()
            await this.pc!.setLocalDescription(offer)

            this.sendSignal({
                type: 'offer',
                sdp: offer.sdp,
            })

            this.isActive = true
            this.callbacks.onSharingStarted?.()
            return true
        } catch (err: any) {
            // User cancelled the share dialog
            if (err.name === 'NotAllowedError' || err.name === 'AbortError') {
                console.log('[ScreenShare] User cancelled screen selection')
                return false
            }
            console.error('[ScreenShare] Error starting share:', err)
            this.callbacks.onError?.(err)
            return false
        }
    }

    /**
     * Stop sharing / viewing and clean up all resources.
     */
    stopSharing() {
        // Stop local media tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop())
            this.localStream = null
        }

        // Close peer connection
        if (this.pc) {
            this.pc.close()
            this.pc = null
        }

        // Notify the other side
        this.sendSignal({ type: 'stop' })

        this.isActive = false
        this.callbacks.onSharingStopped?.()
    }

    /**
     * Clean up everything including the signaling channel.
     * Call this when leaving the page.
     */
    destroy() {
        this.stopSharing()
        if (this.channel) {
            this.supabase.removeChannel(this.channel)
            this.channel = null
        }
    }

    getIsActive() {
        return this.isActive
    }

    // ── Private ──

    private createPeerConnection() {
        this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })

        this.pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendSignal({
                    type: 'ice-candidate',
                    candidate: event.candidate.toJSON(),
                })
            }
        }

        this.pc.onconnectionstatechange = () => {
            const state = this.pc?.connectionState
            if (state) {
                this.callbacks.onConnectionStateChange?.(state)
                if (state === 'disconnected' || state === 'failed') {
                    this.callbacks.onSharingStopped?.()
                    this.isActive = false
                }
            }
        }

        // Viewer receives the remote stream here
        this.pc.ontrack = (event) => {
            if (event.streams[0]) {
                this.callbacks.onRemoteStream?.(event.streams[0])
            }
        }
    }

    private async handleSignal(payload: any) {
        const { type } = payload

        if (type === 'stop') {
            // Other side stopped sharing
            if (this.pc) {
                this.pc.close()
                this.pc = null
            }
            this.isActive = false
            this.callbacks.onSharingStopped?.()
            return
        }

        if (type === 'offer' && this.role === 'viewer') {
            // Agent received an offer — create answer
            this.createPeerConnection()
            await this.pc!.setRemoteDescription(
                new RTCSessionDescription({ type: 'offer', sdp: payload.sdp })
            )
            const answer = await this.pc!.createAnswer()
            await this.pc!.setLocalDescription(answer)

            this.sendSignal({
                type: 'answer',
                sdp: answer.sdp,
            })
            this.isActive = true
            this.callbacks.onSharingStarted?.()
        }

        if (type === 'answer' && this.role === 'sharer') {
            // Sharer received answer from viewer
            if (this.pc) {
                await this.pc.setRemoteDescription(
                    new RTCSessionDescription({ type: 'answer', sdp: payload.sdp })
                )
            }
        }

        if (type === 'ice-candidate') {
            if (this.pc && payload.candidate) {
                try {
                    await this.pc.addIceCandidate(new RTCIceCandidate(payload.candidate))
                } catch (err) {
                    console.warn('[ScreenShare] Failed to add ICE candidate:', err)
                }
            }
        }
    }

    private sendSignal(data: Record<string, any>) {
        if (!this.channel) return
        this.channel.send({
            type: 'broadcast',
            event: 'webrtc-signal',
            payload: { ...data, from: this.role },
        })
    }
}
