'use strict';

let http = require('http');
let https = require('https');
let WebSocketServer = require('websocket').server;
let fs = require('fs');
let path = require('path');

/**
 * @author Cathal Butler
*/

let connectionArray = [];

// Output logging information to console
function log(text) {
    let time = new Date();
    console.log("[" + time.toLocaleTimeString() + "] " + text);
}


/** Sends a message (which is already stringified JSON) to a single
 *  user(peer), this is used when a peer tries to connect to a candidate
 *  @param target, the id of the user the request is being sent too.
 *  @param request, the request data sent from the peer that wants to connect
 */
function sendToPeer(target, request) {
    for (let i = 0; i < connectionArray.length; i++) {
        console.log(connectionArray[i].id);
        if (connectionArray[i].id === target) {
            connectionArray[i].sendUTF(request);
            break;
        }
    }
}

function checkConnection(id) {
    for (let i = 0; i < connectionArray.length; i++) {
        if (connectionArray[i].id === id) {
            return true;
        }
    }
    return false;
}

/**
 * Builds a message object of type "peers" which contains details of users connected to the server
 */
function buildPeerList() {
    let peersResponse = {
        type: "peers",
        data: []
    };
    // Add the users to the list
    for (let i = 0; i < connectionArray.length; i++) {
        let peer = {};
        peer['id'] = connectionArray[i].data.id;
        peer['device_name'] = connectionArray[i].data.device_name;
        peer['username'] = connectionArray[i].data.username;
        peer['user_agent'] = connectionArray[i].data.user_agent;
        peersResponse.data.push(peer); // Add a peer to data array of peers
    }
    return peersResponse;
}

/**
 * Sends a "peerList" to all members on the server
 */
function sendPeerListToAll() {
    let peers = buildPeerList();
    let peersListResponse = JSON.stringify(peers);
    for (let i = 0; i < connectionArray.length; i++) {
        console.log(peersListResponse);
        connectionArray[i].sendUTF(peersListResponse);
    }
}

// Load the key and certificate data to be used for our HTTPS/WSS
// server.
//
let httpsOptions = {
    key: fs.readFileSync(path.resolve("ssl/server.key")),
    cert: fs.readFileSync(path.resolve("ssl/server.cert"))
};

let httpsServer = https.createServer(httpsOptions, function (request, response) {
    log("Received secure request for " + request.url);
    response.write("WebSocket Server - Vertex");
    response.end();
});

/**
 * Spin up the HTTPS server on the port 8086
 */
httpsServer.listen(8086, function () {
    log("Server is listening on port 8086");
});


/**
 * Create the WebSocket server by converting the HTTPS server into one.
 */
let wsServer = new WebSocketServer({
    httpServer: httpsServer,
    autoAcceptConnections: false,
    path: '/ws',//Path to access ws
});

// Set up a "connect" message handler on our WebSocket server. This is
// called whenever a user connects to the server's port using the
// WebSocket protocol.
wsServer.on('request', function (request) {
    // Connection
    let connection = request.accept();
    // Add the new connection to our list of connections.
    log("Connection accepted from " + connection.remoteAddress + ".");

    // Request message inbound from client
    let requestMsg = {
        type: 'type',
        data: 'data'
    };

    // Set up a handler for the "message" event received over WebSocket. This
    // is a message sent by a client.
    connection.on('message', async function (message) {
        if (message.type === 'utf8') {
            log("Received Message: " + message.utf8Data);
            requestMsg = JSON.parse(message.utf8Data);
            //Assign id and data to connection from request
            connection.id = requestMsg.data.id;
            connection.data = requestMsg.data;

            // let connect = getConnectionForID(requestMsg.data.to);
            let msgString = JSON.stringify(requestMsg);

            //Handle incoming request by there type
            switch (requestMsg.type) {
                case 'new':
                    // Send peers to all connected
                    connectionArray.push(connection);
                    // Add data to current connection
                    // Add new connection the array on connections (Peers)
                    sendPeerListToAll();
                    break;
                case 'offer': //Fallthrough
                case 'answer': //Fallthrough
                case 'candidate':
                    // Convert to an object to send:
                    // Check that a id exists in the request sent from a client:
                    // @ts-ignore
                    if (requestMsg.data.to && requestMsg.data.to.length !== 0) {
                        await sendToPeer(requestMsg.data.to, msgString);
                    } else {
                        //Return an error if no ID is found
                        log('No to id found in request message');
                        let errorMessage = {
                            type: 'error',
                            data: 'Peer to id not found'
                        };
                        let response = JSON.stringify(errorMessage);
                        //Return error
                        connection.sendUTF(response);
                    }
                    break;
                case 'leave':
                    break;
                case 'bye':
                    //Disconnect from server
                    log('Disconnecting from server');
                    // Return error if no session id is found
                    if (requestMsg.data.session_id && requestMsg.data.session_id.length == 0) {
                        let errorMsg = {
                            type: 'error',
                            data: 'No session id found'
                        };
                        log('No session id found');
                        let response = JSON.stringify(errorMsg);
                        //Return error
                        connection.sendUTF(response);
                        return;
                    }

                    let sessionId = requestMsg.data['session_id'];
                    let ids = {};
                    ids = sessionId.split("-");


                    // Handle error if a users id does not exist in the connections array:
                    if (checkConnection(ids[0]) == null) {
                        let errorMsg = {
                            type: 'error',
                            data: {
                                requestMsg: requestMsg.type,
                                reason: 'Peer ' + ids[0] + ' not found.'
                            },
                        };
                        log('Peer id not found in connections');
                        let response = JSON.stringify(errorMsg);
                        connection.sendUTF(response);
                        return;
                    } else {
                        let bye = {
                            type: 'bye',
                            data: {
                                to: ids[0],
                                session_id: sessionId
                            },
                        };
                        log('Send bye request to ' + ids[0]);
                        let response = JSON.stringify(bye);
                        connection.sendUTF(response);
                    }

                    // handle error is client 2 ids
                    if (checkConnection(ids[1]) == null) {
                        let errorMsg = {
                            type: 'error',
                            data: {
                                requestMsg: requestMsg.type,
                                reason: 'Peer ' + ids[0] + ' not found.'
                            },
                        };
                        log('Peer id not found in connections');
                        let response = JSON.stringify(errorMsg);
                        connection.sendUTF(response);
                        return;
                    } else {
                        let bye = {
                            type: 'bye',
                            data: {
                                to: ids[1],
                                session_id: sessionId
                            },
                        };
                        log('Send bye request to ' + ids[1]);
                        let response = JSON.stringify(bye);
                        sendToPeer(ids[1], response);
                    }
                    break;
                default:
                    let errorMessage = {
                        type: 'error',
                        data: {reason: 'Unable to process request, may not be correct "type"' + requestMsg.type}
                    };
                    let response = JSON.stringify(errorMessage);
                    connection.sendUTF(response)
            }//End switch
        }//End if
    });

    // Handle the WebSocket "close" event; this means a user has logged off
    // or has been disconnected.
    connection.on('close', function (reason, description) {
        // First, remove the connection from the list of connections.
        connectionArray = connectionArray.filter(function (el, idx, ar) {
            console.log('Connection is being removed');
            return el.connected;
        });
        // Now send the updated user list to clients
        sendPeerListToAll();
        // Build and output log output for close information.
        let logMessage = "Connection closed: " + connection.remoteAddress + " (" +
            reason;
        if (description !== null && description.length !== 0) {
            logMessage += ": " + description;
        }
        logMessage += ")";
        log(logMessage);
    });
});