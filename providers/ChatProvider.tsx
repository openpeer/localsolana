import React, { useEffect, useState, useRef } from 'react';
import { useAccount, useUserProfile } from 'hooks';
import Talk from 'talkjs';

interface ChatProviderProps {
    children: React.ReactNode;
}

function ChatProvider({ children }: ChatProviderProps) {
    const { user } = useUserProfile({});
    const { address } = useAccount();
    const [inboxVisible, setInboxVisible] = useState(false);
    const talkjsContainer = useRef<HTMLDivElement>(null); // Use `useRef` instead of `createRef`

    useEffect(() => {
        if (!address){
            if (talkjsContainer.current) {
                talkjsContainer.current.innerHTML = ""; // Unmount the TalkJS inbox
            }
            return;
        }

        const currentUser = {
            id: address,
            name: (user?.name && user.name)?user.name:address,
            email:  (user?.email && user.email)?user.email:address,
            photo: 'https://source.unsplash.com/random/200x200?person',
        };

        Talk.ready.then(() => {
            const me = new Talk.User({
                id: currentUser.id,
                name: currentUser.name,
                email: currentUser.email,
                photoUrl: currentUser.photo,
                role: 'default',
            });

            if (!window.talkSession) {
                window.talkSession = new Talk.Session({
                    appId: 'tMPnPVYF', // Replace with your actual app ID
                    me: me,
                });
            }

            const inbox = window.talkSession.createInbox({
                showFeed: true, // Show conversation list (feed)
            });

            if (talkjsContainer.current) {
                inbox.mount(talkjsContainer.current); // Mount once, and control visibility with CSS
            }
        });
        return () => {
            if (talkjsContainer.current) {
                talkjsContainer.current.innerHTML = ""; // Clean up on component unmount or when address changes
            }
        };
    }, [address]); // Add address dependency to prevent re-initialization

    return (
        <>
            {/* Chat icon that toggles the inbox visibility */}
            <div className="_icon_7tcsj_23 _activeIcon_7tcsj_35">
                <img
                    alt="WalletChat"
                    className="w-16"
                    src="https://uploads-ssl.webflow.com/62d761bae8bf2da003f57b06/62d761bae8bf2dea68f57b52_walletchat%20logo.png"
                    style={{
                        position: 'fixed',
                        zIndex: 2000,
                        right: '20px',
                        bottom: '20px',
                        cursor: 'pointer', // Ensure it's clickable
                    }}
                    onClick={() => setInboxVisible((prev) => !prev)} // Toggle inbox visibility
                />
            </div>

            
            <div
                style={{
                    width: '100%',
                    height: '500px',
                    position: 'fixed',
                    zIndex: 2000,
                    right: '20px',
                    bottom: inboxVisible ? '100px' : '-1000px', // Slide out of view when hidden
                    maxWidth: '400px',
                    maxHeight: '500px',
                    transition: 'bottom 0.5s ease-in-out', // Smooth slide-in/out
                    visibility: inboxVisible ? 'visible' : 'hidden', // Hide when not visible
                }}
                ref={talkjsContainer}
            />
            {children}
        </>
    );
}

export default ChatProvider;
