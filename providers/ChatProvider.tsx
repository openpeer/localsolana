import React, { useEffect, useRef } from 'react';
import { useAccount, useUserProfile } from 'hooks';
import Talk from 'talkjs';
import { talkJsAppId } from '@/utils/constants';

function ChatProvider() {
    const { user } = useUserProfile({});
    const { address } = useAccount();
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
            //@ts-ignore
            if (!window.talkSession) {
                 //@ts-ignore
                window.talkSession = new Talk.Session({
                    appId: talkJsAppId, // Replace with your actual app ID
                    me: me,
                });
            }
 //@ts-ignore
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
            <div
            className='p-2'
                style={{
                    width: '100%',
                    height: '80vh',
                }}
                ref={talkjsContainer}
            />
    );
}

export default ChatProvider;
