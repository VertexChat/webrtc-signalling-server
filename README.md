# webrtc-signalling-server
WebRTC's connections requires a signalling server to resolve how peers can connect over the internet.  A signaling servers job is to act as 
a link in the middle of two peers that wish to connect to each other.  WebRTC doesn’t specify a transport mechanism for 
signaling information, so a WebSocket is used to send and receive messages from client to server.The  signalling  server  
does  not  need  to  understand  or  interpret  the  signalling data.  SDP data is sent to enable WebRTC class, but the 
socket doesn’t need to worry about understanding it.  What is important when the ICE instructs the websocket to send 
signaling data to another peer.  When the other peer receives information it knows how to receive the information and 
deliver it to its ownICE subsystem. All the signalling server has to do is channel the information back and forth, 
the context doesn’t matter at all to the signalling server.


 ![](uploads/signallingserver_diagram.png)
 
[www.html5rocks.com](https://www.html5rocks.com/en/tutorials/webrtc/infrastructure/)


## Environment Setup First
  * Install [Git](https://git-scm.com/downloads) to clone the project with the repositories URL or download the .zip from the Github:
    - https://github.com/VertexChat/webrtc-signalling-server
  * Install [Node](https://nodejs.org/en/)
  * `cd /webrtc-signalling-server`
  * Install [npm](https://www.npmjs.com/) packages
    - `npm install`
  * WebRTC requires a secure websocket(WSS) to allow peers to exchange data between each other so SSL certs need to be
  provided in order for the websocket to allow WebRTC communicate. [Let's Encrypt](https://letsencrypt.org/) provide SSL certs. 
    

## How to run
  * Run the server
    - `node .`
    - Server is served on `localhost:8086`
    
    
    
## References
 * https://docs.w3cub.com/dom/webrtc_api/signaling_and_video_calling/
 * https://www.tutorialspoint.com/webrtc/webrtc_signaling.htm
 * https://www.w3.org/TR/webrtc/#offer-answer-options
 * https://codelabs.developers.google.com/codelabs/webrtc-web/#0
 * https://testrtc.com/webrtc-api-trace/









