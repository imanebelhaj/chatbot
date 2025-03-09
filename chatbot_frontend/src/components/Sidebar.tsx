// "use client";

// import React from "react";
// import useChatHistory from "../hooks/useChat";

// export default function Sidebar() {
//   const { chats, loading } = useChatHistory();

//   return (
//     <aside className="w-1/4 bg-gray-800 text-white h-screen p-4">
//       <h2 className="text-xl font-bold mb-4">Chat History</h2>
//       <button className="w-full bg-blue-500 text-white py-2 rounded mb-4">
//         + New Chat
//       </button>

//       {loading ? (
//         <p>Loading...</p>
//       ) : (
//         <ul>
//           {chats.length === 0 ? (
//             <p className="text-gray-400">No chats yet.</p>
//           ) : (
//             chats.map((chat, index) => (
//               <li key={index} className="p-2 hover:bg-gray-700 cursor-pointer">
//                 {chat}
//               </li>
//             ))
//           )}
//         </ul>
//       )}
//     </aside>
//   );
// }
