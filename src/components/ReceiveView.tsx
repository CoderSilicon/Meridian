import { createSignal, type Component, onCleanup } from "solid-js";
import { ObjSync } from "../lib/socket";

const ReceiveView: Component<{ setMode: (mode: string) => void }> = (props) => {
  const [handshakeId, setHandshakeId] = createSignal("");
  const [isConnected, setIsConnected] = createSignal(false);
  const [status, setStatus] = createSignal("Enter code to connect");
  const [progress, setProgress] = createSignal(0);
  
  let pc: RTCPeerConnection;
  let receivedChunks: ArrayBuffer[] = [];
  let fileMeta: { name: string, size: number } | null = null;
  let bytesReceived = 0;

  const connectToPeer = () => {
    const code = handshakeId();
    pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });

    pc.onicecandidate = (e) => {
      if (e.candidate) ObjSync.emit("candidate", { code, candidate: e.candidate });
    };

    // IMPORTANT: Listen for the data channel the sender creates
    pc.ondatachannel = (event) => {
      const channel = event.channel;
      channel.onopen = () => {
        setIsConnected(true);
        setStatus("Connected! Receiving...");
      };

      channel.onmessage = (e) => {
        if (typeof e.data === "string") {
          const msg = JSON.parse(e.data);
          if (msg.type === "metadata") fileMeta = msg;
          if (msg.type === "eof") downloadFile();
        } else {
          receivedChunks.push(e.data);
          bytesReceived += e.data.byteLength;
          if (fileMeta) setProgress(Math.round((bytesReceived / fileMeta.size) * 100));
        }
      };
    };

    ObjSync.emit("join-room", { code });
    
    ObjSync.on("offer", async (offer) => {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      ObjSync.emit("answer", { code, answer });
    });

    ObjSync.on("candidate", (cand) => pc.addIceCandidate(new RTCIceCandidate(cand)));
  };

  const downloadFile = () => {
    const blob = new Blob(receivedChunks);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileMeta?.name || "file";
    a.click();
    setStatus("Download Complete!");
  };

  onCleanup(() => pc?.close());

  return (
   <div class="min-h-screen w-full bg-zinc-950 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto">
  <div class="w-full max-w-lg space-y-6 sm:space-y-8 my-auto">
    
    {/* Header Section */}
    <div class="space-y-2">
      <button
        onClick={() => props.setMode("selection")}
        class="text-zinc-500 hover:text-zinc-300 transition-colors uppercase text-[10px] font-bold tracking-[0.2em] mb-2 block"
      >
        ← Back
      </button>
      <h2 class="text-3xl sm:text-4xl font-black text-white lexend-400 tracking-tighter">
        Receive
      </h2>
      <p class="text-base sm:text-lg text-zinc-400 lexend-300">
        Enter the generated code to establish a peer-to-peer connection.
      </p>
    </div>

    {/* Input Section */}
    <div class="space-y-4">
      <div class="relative group">
        <input 
          onInput={(e) => setHandshakeId(e.currentTarget.value.toUpperCase())} 
          placeholder="Enter the code. :)" 
          class="w-full p-5 bg-zinc-950 border border-zinc-800 text-white font-mono text-xl tracking-[0.3em] placeholder:text-zinc-700 lexend-200 placeholder:tracking-normal focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all rounded-xl shadow-inner"
        />
      </div>

      <button 
        onClick={connectToPeer}
        disabled={!!isConnected() || !handshakeId()}
        class="w-full py-5 bg-white text-black font-black lexend-600 tracking-widest text-sm rounded-xl transition-all duration-200 hover:bg-[#32FF00] active:scale-[0.98] disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-white"
      >
        {isConnected() ? (
          <span class="flex items-center justify-center gap-3">
            <span class="animate-pulse">●</span> Transferring {progress()}%
          </span>
        ) : "Connect "}
      </button>
    </div>

    {/* Status Footer */}
    <div class="pt-4 border-t border-zinc-900">
      <p class="text-center text-zinc-500 text-[10px] tracking-[0.25em] font-medium  animate-in fade-in duration-700">
        {status() || "Ready for handshake"}
      </p>
    </div>

  </div>
</div>
  );
};

export default ReceiveView;