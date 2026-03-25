export const CHUNK_SIZE = 16384; 


export async function sendFileChunks(
  dataChannel: RTCDataChannel, 
  file: File, 
  onProgress: (p: number) => void
) {
  // 1. Send metadata first
  dataChannel.send(JSON.stringify({ 
    type: "metadata", 
    name: file.name, 
    size: file.size 
  }));

  const buffer = await file.arrayBuffer();
  let offset = 0;
  const progress = Math.round((offset / file.size) * 100);

  const sendNext = () => {
    while (offset < buffer.byteLength) {
      // If buffer is full, wait for 'bufferedamountlow' event
      if (dataChannel.bufferedAmount > dataChannel.bufferedAmountLowThreshold) {
        dataChannel.onbufferedamountlow = () => {
          dataChannel.onbufferedamountlow = null;
          sendNext();
        };
        return;
      }
      const chunk = buffer.slice(offset, offset + CHUNK_SIZE);
      dataChannel.send(chunk);
      offset += CHUNK_SIZE;

      onProgress(progress);
    }
    dataChannel.send(JSON.stringify({ type: "eof" }));
  };
  sendNext();
}