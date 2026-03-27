export const CHUNK_SIZE = 16384; 

export async function sendFileChunks(
  dataChannel: RTCDataChannel, 
  file: File, 
  onProgressUpdate: (bytesSent: number, totalBytes: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    // 1. Send metadata first
    dataChannel.send(JSON.stringify({ 
      type: "metadata", 
      name: file.name, 
      size: file.size 
    }));

    let offset = 0;

    const readAndSendNextChunk = async () => {
      try {
        while (offset < file.size) {
          if (dataChannel.bufferedAmount > dataChannel.bufferedAmountLowThreshold) {
            dataChannel.onbufferedamountlow = () => {
              dataChannel.onbufferedamountlow = null;
              readAndSendNextChunk();
            };
            return; 
          }

          // Read only the current chunk into memory
          const chunk = file.slice(offset, offset + CHUNK_SIZE);
          const buffer = await chunk.arrayBuffer();
          
          dataChannel.send(buffer);
          offset += buffer.byteLength; 

          // Pass raw data outside; don't calculate percentages here
          onProgressUpdate(offset, file.size);
        }

        // 2. Transfer complete
        dataChannel.send(JSON.stringify({ type: "eof" }));
        resolve();
        
      } catch (error) {
        alert(`Transfer failed: ${error}`);
        reject(error);
      }
    };

    readAndSendNextChunk();
  });
}