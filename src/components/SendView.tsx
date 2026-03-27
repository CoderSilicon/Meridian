import {
  createSignal,
  onCleanup,
  onMount,
  Show,
  type Component,
} from "solid-js";
import { signal } from "../lib/socket";
import { sendFileChunks } from "../lib/dataTransfer";
import { Copy } from "lucide-solid";
import axios from "axios";

const SendView: Component<{ setMode: (mode: string) => void }> = (props) => {
  const [isServerActive, setIsServerActive] = createSignal<boolean>(false);
  const [file, setFile] = createSignal<File | null>(null);
  const [isDragging, setIsDragging] = createSignal<boolean>();
  const [generatedCode, setGeneratedCode] = createSignal("");
  const [peerConnected, setPeerConnected] = createSignal(false);
  const [progress, setProgress] = createSignal(0);

  let pc: RTCPeerConnection;
  let dataChannel: RTCDataChannel;

  let inputRef: HTMLInputElement | undefined;

  const initConnection = async () => {
    const code = await signal.generateCode();
    setGeneratedCode(code);
    pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // Create the data channel
    dataChannel = pc.createDataChannel("fileTransfer", { ordered: true });
    dataChannel.onopen = () => setPeerConnected(true);
    dataChannel.onclose = () => setPeerConnected(false);

    // Signaling logic
    pc.onicecandidate = (e) => {
      if (e.candidate)
        signal.emit("candidate", { code, candidate: e.candidate });
    };

    // Wait for receiver to join before sending offer
    signal.emit("create-room", { code });

    signal.on("receiver-joined", async () => {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      signal.emit("offer", { code, offer });
    });

    signal.on("answer", (answer) =>
      pc.setRemoteDescription(new RTCSessionDescription(answer)),
    );
    signal.on("candidate", (cand) =>
      pc.addIceCandidate(new RTCIceCandidate(cand)),
    );

    signal.on("receiver-left", () => {
      alert("Receiver canceled the connection.");
      reset(); // Reset the UI to the start
    });

    // Handle the WebRTC layer actually closing
    dataChannel.onclose = () => {
      reset();
    };

    pc.onconnectionstatechange = () => {
      if (
        pc.connectionState === "disconnected" ||
        pc.connectionState === "failed"
      ) {
        reset();
      }
    };
  };

  const handleSend = async () => {
    const currentFile = file(); // Accessing your SolidJS signal

    if (currentFile && dataChannel?.readyState === "open") {
      // 1. Define the UI progress handler here
      const handleProgressUpdate = (bytesSent: number, totalBytes: number) => {
        let percentage = Math.round((bytesSent / totalBytes) * 100);

        // Clamp it so it never breaks your clean UI layout
        if (percentage > 100) percentage = 100;

        setProgress(percentage);

        // Cleanly reset after a short delay once finished
        if (percentage === 100) {
          setTimeout(() => {
            setProgress(0);
          }, 1000);
        }
      };

      // 2. Pass the handler to the WebRTC function
      try {
        await sendFileChunks(dataChannel, currentFile, handleProgressUpdate);
        alert("Transfer complete!");
      } catch (error) {
        alert("Transfer interrupted:" + error);
        // You could also add a setTransferStatus("failed") here if needed
      }
    }
  };

  const reset = () => {
    // 1. Close the connection
    pc?.close();
    dataChannel?.close();

    // 2. Reset all UI signals to their "Selection" state
    setGeneratedCode("");
    setPeerConnected(false);
    setProgress(0);
    setFile(null);
  };

  onMount(async () => {
    try {
      const response = await axios.get("https://meridite.onrender.com/alive");
      setIsServerActive(response.status === 200);
    } catch (error) {
      setIsServerActive(false);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Error fetching data:", errorMessage);
    }
  });

  onCleanup(() => pc?.close());

  return (
    <div class=" w-full bg-zinc-950 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <Show when={isServerActive() === true} fallback={<div>Loading...</div>}>
        <div class="w-full max-w-lg space-y-6 sm:space-y-8 my-auto">
          {/* Header Section */}
          <div class="space-y-2">
            <button
              onClick={() => props.setMode("selection")}
              class="text-zinc-500 hover:text-zinc-300 transition-colors uppercase text-xs font-bold tracking-wider mb-2 block"
            >
              ← Back
            </button>
            <h2 class="text-3xl sm:text-4xl font-bold text-white lexend-400">
              Send File
            </h2>
            <p class="text-base sm:text-lg text-zinc-400 lexend-300">
              Upload your file below to generate a secure transfer code.
            </p>
          </div>

          {/* Dropzone & File Selection Section */}
          <div class="w-full space-y-4">
            <div
              onClick={() => inputRef?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const dropped = e.dataTransfer?.files?.[0];
                if (dropped) setFile(dropped);
              }}
              class={`w-full rounded-2xl border-2 border-dashed px-6 py-12 sm:py-16 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200
        ${isDragging() ? "border-zinc-400 bg-zinc-900" : "border-zinc-800 bg-zinc-950/50 hover:border-zinc-700 hover:bg-zinc-900/50"}`}
            >
              {/* Simple Upload Icon */}
              <div class="p-4 bg-zinc-900 rounded-full text-zinc-400 mb-2">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </div>
              <p class="text-sm font-medium text-zinc-300 lexend-400 text-center">
                {file()
                  ? "Replace selected file"
                  : "Click or drag file to upload"}
              </p>
              <p class="text-xs text-zinc-600">
                Supports any file type up to 5GB
              </p>
            </div>

            <input
              ref={inputRef}
              type="file"
              class="hidden"
              onChange={(e) => {
                const selected = e.currentTarget.files?.[0];
                if (selected) setFile(selected);
              }}
            />

            {/* Selected File Card */}
            <Show when={file()}>
              {(f) => (
                <div class="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 flex items-center gap-4 transition-all">
                  <div class="p-2 bg-zinc-800 rounded-lg text-zinc-300">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                      <polyline points="13 2 13 9 20 9"></polyline>
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-zinc-200 truncate">
                      {f().name}
                    </p>
                    <p class="text-xs text-zinc-500 mt-0.5">
                      {(f().size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    class="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              )}
            </Show>
          </div>

          {/* Generated Code Display */}
          <Show when={generatedCode()}>
            <div class="relative w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
              <div class="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/50 px-4 py-3">
                <div class="flex items-center gap-2">
                  <div class="h-2.5 w-2.5 rounded-full bg-zinc-700 hover:bg-rose-500 transition-colors"></div>
                  <div class="h-2.5 w-2.5 rounded-full bg-zinc-700 hover:bg-amber-500 transition-colors"></div>
                  <div class="h-2.5 w-2.5 rounded-full bg-zinc-700 hover:bg-emerald-500 transition-colors"></div>
                </div>
                <span
                  onclick={() => {
                    navigator.clipboard.writeText(generatedCode());
                  }}
                  class="font-mono text-[10px] font-medium tracking-wider text-zinc-500 uppercase"
                >
                  <Copy class="w-3 h-3 hover:text-green-500 active:text-neutral-200" />
                </span>
              </div>
              <div class="p-6 overflow-x-auto">
                <pre class="font-mono text-sm leading-relaxed text-zinc-300 antialiased selection:bg-zinc-800 selection:text-white">
                  <code>
                    <span class="text-zinc-500 mr-2">2 |</span>{" "}
                    <span class="text-emerald-400">{generatedCode()}</span>
                  </code>
                </pre>
              </div>
            </div>
          </Show>

          {/* Primary Action Button */}
          <Show when={file()}>
            <button
              onClick={!generatedCode() ? initConnection : handleSend}
              disabled={!!generatedCode() && !peerConnected()}
              class="w-full py-5 bg-black text-white font-black lexend-600 tracking-widest text-sm rounded-xl transition-all duration-200 hover:bg-zinc-900 active:scale-[0.98] disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-black overflow-hidden relative"
            >
              {!generatedCode()
                ? "Generate Code"
                : peerConnected()
                  ? progress() > 0
                    ? `Sending ${progress()}%` // Just call the signal here
                    : "Send File"
                  : "Waiting for Peer..."}
            </button>
          </Show>
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

export default SendView;
