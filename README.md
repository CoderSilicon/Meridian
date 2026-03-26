![Meridian](./public/favicon.svg)

# Meridian
**Meridian** is a high-performance, peer-to-peer (P2P) file transfer application built differently from its competitors. By removing the "middleman" server from the data path, It can establishe a direct encrypted tunnel between devices, ensuring your data never touches a third-party cloud.



## ⚡ The Philosophy
Most "file sharing" apps upload your data to a bucket which later is used to access and download it. **This flaw planted the seeds of Meridian.** 
As it follows these strict guidelines:
- **Zero Storage:** It never touch your files. The server only acts as a "matchmaker" (Signaling) to help two devices find each other.
- **Absolute Privacy:** Data is streamed directly via WebRTC. Once the connection is made, the signaling server is discarded maintaining the connection between only the peers.

- **Browser-to-Browser:** No installation required. No accounts. Just a code and a connection.



## Features
-  **Real-Time Streaming:** Files start sending the moment the receiver clicks "Accept."
-  **End-to-End Privacy:** Direct P2P transfer means no server-side logging of your data.
-  **Simplicity over Professionalism:** Designed with a high-contrast, simple user interface which doesn't require you to learn it before using it 
- **Unlimited File Size:** Since we don't store the data, there are no arbitrary upload limits.



## Technical Stack
* **Frontend:** [SolidJS](https://www.solidjs.com/) (For reactive, blazingly fast UI updates)
* **Backend:** [Node.js](https://nodejs.org/) with [Socket.io](https://socket.io/) (Signaling & Room Management)
* **Protocol:** [WebRTC](https://webrtc.org/) (DataChannel for P2P streaming)
* **Deployment:** [Vercel](https://vercel.com) & [Render](https://render.com/)


## How it Works
- **The Handshake:** The Sender creates a room. The Server generates a unique 8-digit session code.
-   **The Discovery:** The Receiver enters the code. The Server introduces the two peers.
-  **The Tunnel:** Using WebRTC, the devices negotiate a direct path (STUN/ICE).
-  **The Transfer:** The file is sliced into chunks and sent directly across the "Meridian."




## Privacy & Security
Meridian is built on the principle of **Ephemeral Connectivity**. 
* No database.
* No tracking cookies.
* Room codes expire immediately after a successful connection or disconnection.

<br/>
<br/>
<br/>

> **Built by [CoderSilicon](https://github.com/CoderSilicon)** > *It is always better to differ from others.*
