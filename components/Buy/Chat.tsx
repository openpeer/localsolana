// import React, { useCallback, useEffect, useState } from 'react';
// import Talk from 'talkjs';
// import { Session, Chatbox } from '@talkjs/react';

// // Define the type for user information
// interface User {
//   id: string;
//   name: string;
//   email: string;
//   photoUrl: string;
//   welcomeMessage?: string;
// }

// const Chat: React.FC = () => {
//   const [currentUser, setCurrentUser] = useState<User | null>(null); // State for the logged-in user
//   const [conversationId, setConversationId] = useState<string | null>(null); // State for the conversation ID

//   // Assuming this user data is coming from Dynamic.xyz or your authentication system
//   useEffect(() => {
//     // Replace this with real data fetching logic (e.g., from Dynamic.xyz)
//     const fetchCurrentUser = async () => {
//       // Fetch the current user from Dynamic.xyz or another auth provider
//       const user = {
//         id: 'dynamic-user-id',
//         name: 'Logged-in User',
//         email: 'user@example.com',
//         photoUrl: 'https://example.com/user-avatar.jpg',
//         welcomeMessage: 'Hi there!',
//       };

//       setCurrentUser(user);
//     };

//     fetchCurrentUser();
//   }, []);

//   // Sync the current user (logged-in user) with Talk.js
//   const syncUser = useCallback(() => {
//     if (!currentUser) return null;

//     return new Talk.User({
//       id: currentUser.id,
//       name: currentUser.name,
//       email: currentUser.email,
//       photoUrl: currentUser.photoUrl,
//       welcomeMessage: currentUser.welcomeMessage,
//     });
//   }, [currentUser]);

//   // Sync conversation between current user and another user
//   const syncConversation = useCallback((session: Talk.Session) => {
//     if (!currentUser) return null; // Ensure that the current user is loaded

//     const conversation = session.getOrCreateConversation('new_conversation');

//     const other = new Talk.User({
//       id: 'frank',
//       name: 'Frank',
//       email: 'frank@example.com',
//       photoUrl: 'https://talkjs.com/new-web/avatar-8.jpg',
//       welcomeMessage: 'Hey, how can I help?',
//     });

//     conversation.setParticipant(session.me);
//     conversation.setParticipant(other);

//     setConversationId(conversation.id); // Set the conversation ID

//     return conversation;
//   }, [currentUser]);

//   // Display chatbox only when user data is available
//   if (!currentUser) {
//     return <p>Loading chat...</p>;
//   }
// if(syncUser()!=null)
//   return (
    
//     <Session appId="YOUR_TALKJS_APP_ID" syncUser={syncUser()}>
//       {conversationId && (
//         <Chatbox
//           conversationId={conversationId}
//           style={{ width: '100%', height: '500px' }}
//         />
//       )}
//     </Session>
//   );
// };

// export default Chat;