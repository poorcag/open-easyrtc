
var selfEasyrtcid = "";
var connectList = {};
var channelIsActive = {}; // tracks which channels are active

var accelerometerData = { x: 0, y: 0, z: 0 };
var gyroscopeData = { alpha: 0, beta: 0, gamma: 0 };


function connect() {
    easyrtc.enableDebug(false);
    easyrtc.enableDataChannels(true);
    easyrtc.enableVideo(false);
    easyrtc.enableAudio(false);
    easyrtc.enableVideoReceive(false);
    easyrtc.enableAudioReceive(false);
    easyrtc.setDataChannelOpenListener(openListener);
    easyrtc.setDataChannelCloseListener(closeListener);
    easyrtc.setPeerListener(addToConversation);
    easyrtc.setRoomOccupantListener(convertListToButtons);
    easyrtc.connect("easyrtc.dataMessaging", loginSuccess, loginFailure);
}


function addToConversation(who, msgType, content) {
    // Escape html special characters, then add linefeeds.
    content = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    content = content.replace(/\n/g, '<br />');
    document.getElementById('conversation').innerHTML +=
            "<b>" + who + ":</b>&nbsp;" + content + "<br />";
}

// Check if accelerometer and gyroscope are available
if (window.DeviceMotionEvent && window.DeviceOrientationEvent) {
    // Add event listeners for accelerometer and gyroscope data
    window.addEventListener('devicemotion', function(event) {
        accelerometerData.x = event.acceleration.x;
        accelerometerData.y = event.acceleration.y;
        accelerometerData.z = event.acceleration.z;

        sendSensorData();
    });

    window.addEventListener('deviceorientation', function(event) {
        gyroscopeData.alpha = event.alpha;
        gyroscopeData.beta = event.beta;
        gyroscopeData.gamma = event.gamma;

        sendSensorData();
    });
}


function sendSensorData(otherEasyrtcid) {
    // Send accelerometer and gyroscope data via data message
    var data = {
        accelerometer: accelerometerData,
        gyroscope: gyroscopeData
    };

    // Convert data to JSON string
    var jsonData = JSON.stringify(data);

    // Iterate through all connected peers and send data via data channel
    for (var otherEasyrtcid in connectList) {
        // Check if connected to otherEasyrtcid
        if (easyrtc.getConnectStatus(otherEasyrtcid) === easyrtc.IS_CONNECTED) {
            // Send data via data channel
            easyrtc.sendDataP2P(otherEasyrtcid, 'sensorData', jsonData);
        }
    }
}

function openListener(otherParty) {
    channelIsActive[otherParty] = true;
    updateButtonState(otherParty);
}


function closeListener(otherParty) {
    channelIsActive[otherParty] = false;
    updateButtonState(otherParty);
}

function convertListToButtons(roomName, occupantList, isPrimary) {
    connectList = occupantList;

    var otherClientDiv = document.getElementById('otherClients');
    while (otherClientDiv.hasChildNodes()) {
        otherClientDiv.removeChild(otherClientDiv.lastChild);
    }

    var label, button;
    for (var easyrtcid in connectList) {
        var rowGroup = document.createElement("span");
        var rowLabel = document.createTextNode(easyrtc.idToName(easyrtcid));
        rowGroup.appendChild(rowLabel);

        button = document.createElement('button');
        button.id = "connect_" + easyrtcid;
        button.onclick = function(easyrtcid) {
            return function() {
                startCall(easyrtcid);
            };
        }(easyrtcid);
        label = document.createTextNode("Connect");
        button.appendChild(label);
        rowGroup.appendChild(button);

        button = document.createElement('button');
        button.id = "send_" + easyrtcid;
        button.onclick = function(easyrtcid) {
            return function() {
                sendStuffP2P(easyrtcid);
            };
        }(easyrtcid);
        label = document.createTextNode("Send Message");
        button.appendChild(label);
        rowGroup.appendChild(button);
        otherClientDiv.appendChild(rowGroup);
        updateButtonState(easyrtcid);
    }
    if (!otherClientDiv.hasChildNodes()) {
        otherClientDiv.innerHTML = "<em>Nobody else logged in to talk to...</em>";
    }
}

function updateButtonState(otherEasyrtcid) {
    var isConnected = channelIsActive[otherEasyrtcid];
    if(document.getElementById('connect_' + otherEasyrtcid)) {
        document.getElementById('connect_' + otherEasyrtcid).disabled = isConnected;
    }
    if( document.getElementById('send_' + otherEasyrtcid)) {
        document.getElementById('send_' + otherEasyrtcid).disabled = !isConnected;
    }
}


function startCall(otherEasyrtcid) {
    if (easyrtc.getConnectStatus(otherEasyrtcid) === easyrtc.NOT_CONNECTED) {
        try {
        easyrtc.call(otherEasyrtcid,
                function(caller, media) { // success callback
                    if (media === 'datachannel') {
                        // console.log("made call succesfully");
                        connectList[otherEasyrtcid] = true;
                    }
                },
                function(errorCode, errorText) {
                    connectList[otherEasyrtcid] = false;
                    easyrtc.showError(errorCode, errorText);
                },
                function(wasAccepted) {
                    // console.log("was accepted=" + wasAccepted);
                }
        );
        }catch( callerror) {
            console.log("saw call error ", callerror);
        }
    }
    else {
        easyrtc.showError("ALREADY-CONNECTED", "already connected to " + easyrtc.idToName(otherEasyrtcid));
    }
}

function sendStuffP2P(otherEasyrtcid) {
    var text = document.getElementById('sendMessageText').value;
    if (text.replace(/\s/g, "").length === 0) { // Don't send just whitespace
        return;
    }
    if (easyrtc.getConnectStatus(otherEasyrtcid) === easyrtc.IS_CONNECTED) {
        easyrtc.sendDataP2P(otherEasyrtcid, 'msg', text);
    }
    else {
        easyrtc.showError("NOT-CONNECTED", "not connected to " + easyrtc.idToName(otherEasyrtcid) + " yet.");
    }

    addToConversation("Me", "msgtype", text);
    document.getElementById('sendMessageText').value = "";
}


function loginSuccess(easyrtcid) {
    selfEasyrtcid = easyrtcid;
    document.getElementById("iam").innerHTML = "I am " + easyrtcid;
}


function loginFailure(errorCode, message) {
    easyrtc.showError(errorCode, "failure to login");
}
