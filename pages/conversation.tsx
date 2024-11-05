import React from 'react';
import TalkProvider from '@/providers/TalkProvider';
import { Inbox } from '@talkjs/react';

function ConversationPage() {

  return (
    <TalkProvider>
      <div className="my-5 w-full h-screen">
        <Inbox
          className="w-full h-5/6"
          showChatHeader={true}
          theme="default"
        />
      </div>
    </TalkProvider>
  );
}

export default ConversationPage;