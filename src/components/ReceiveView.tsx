import {
  createSignal,
  type Component,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { signal } from "../lib/socket";
import axios from "axios";

const ReceiveView: Component<{ setMode: (mode: string) => void }> = (props) => {
  const [isServerActive, setIsServerActive] = createSignal<boolean>(false);
  const [handshakeId, setHandshakeId] = createSignal<string>("");
  const [isConnected, setIsConnected] = createSignal(false);
  const [status, setStatus] = createSignal("Enter code to connect");
  const [progress, setProgress] = createSignal(0);

  let pc: RTCPeerConnection;
  let receivedChunks: ArrayBuffer[] = [];
  let fileMeta: { name: string; size: number } | null = null;
  let bytesReceived = 0;

  const connectToPeer = () => {
    const code = handshakeId();
    pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = (e) => {
      if (e.candidate)
        signal.emit("candidate", { code, candidate: e.candidate });
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
          if (fileMeta)
            setProgress(Math.round((bytesReceived / fileMeta.size) * 100));
        }
      };
    };

    signal.emit("join-room", { code });

    signal.on("offer", async (offer) => {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      signal.emit("answer", { code, answer });
    });

    signal.on("candidate", (cand) =>
      pc.addIceCandidate(new RTCIceCandidate(cand)),
    );
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

  onMount(async () => {
    try {
      const response = await axios.get("https://meridite.onrender.com/alive");
      setIsServerActive(true);
      console.log(response.data);
    } catch (error) {
      setIsServerActive(false);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Error fetching data:", errorMessage);
    }
  });

  onCleanup(() => pc?.close());

  return (
    <div class="min-h-screen w-full bg-zinc-950 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <Show when={isServerActive()}>
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
                onInput={(e) =>
                  setHandshakeId(e.currentTarget.value.toUpperCase())
                }
                placeholder="Enter the code. :)"
                class="w-full p-5 bg-zinc-950 border border-zinc-800 text-white font-mono text-xl tracking-[0.3em] placeholder:text-zinc-700 lexend-200 placeholder:tracking-normal focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all rounded-xl shadow-inner"
              />
            </div>

            <Show when={isConnected()}>
              <div class="flex justify-between gap-2">
                <button
                  disabled={!!isConnected() || !handshakeId()}
                  class="w-full py-5 bg-black text-white font-black lexend-600 tracking-widest text-sm rounded-xl transition-all duration-200 hover:bg-zinc-900 active:scale-[0.98] disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-black overflow-hidden relative"
                >
                  <div
                    class="absolute inset-0 bg-white transition-all duration-300 ease-out"
                    style={`width: ${progress()}%`}
                  />
                  <span class="relative z-10 mix-blend-difference">
                    Receiving {progress()}%
                  </span>
                </button>
                <button
                  onClick={() => {
                    pc?.close();
                    setIsConnected(false);
                    setStatus("Disconnected");
                    setProgress(0);
                    receivedChunks = [];
                    bytesReceived = 0;
                  }}
                  disabled={!handshakeId()}
                  class="w-full py-5 bg-white text-black lexend-600 tracking-widest text-sm rounded-xl transition-all duration-200 hover:bg-zinc-900 active:scale-[0.98] disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-black overflow-hidden relative"
                >
                  Cancel
                </button>
              </div>
            </Show>
            <Show when={isConnected() === false}>
              {" "}
              <button
                onClick={connectToPeer}
                disabled={!!isConnected() || !handshakeId()}
                class="w-full py-5 bg-white text-black font-black lexend-600 tracking-widest text-sm rounded-xl transition-all duration-200
                "
              >
                Connect
              </button>
            </Show>
          </div>

          {/* Status Footer */}
          <div class="pt-4 border-t border-zinc-900">
            <p class="text-center text-zinc-500 text-[10px] tracking-[0.25em] font-medium  animate-in fade-in duration-700">
              {status() || "Ready for handshake"}
            </p>
          </div>
        </div>
      </Show>
      <Show when={isServerActive() === false}>
        <div class="w-full max-w-lg space-y-6 sm:space-y-8 my-auto">
          <div class="space-y-4">
            <div class="flex justify-center">
              <div class="text-6xl sm:text-7xl animate-bounce">:)</div>
            </div>
            <div class="space-y-2 text-center">
              <h2 class="text-3xl sm:text-4xl font-bold text-white lexend-400">
                Unfortunately, Maybe, Our Server is Sleeping
              </h2>
              <p class="text-base sm:text-lg text-zinc-400 lexend-300">
                The code monkeys in the server headroom are working vewy hard to
                fix it. Check back in a moment!
              </p>
            </div>
            <div class="flex justify-center gap-1 pt-2">
              <div class="h-2 w-2 rounded-full bg-zinc-600 animate-pulse"></div>
              <div
                class="h-2 w-2 rounded-full bg-zinc-600 animate-pulse"
                style="animation-delay: 0.2s"
              ></div>
              <div
                class="h-2 w-2 rounded-full bg-zinc-600 animate-pulse"
                style="animation-delay: 0.4s"
              ></div>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default ReceiveView;
