define(function (require, exports, module) {
    "use strict";
    
    var context = this;
    
    var socket_io = require('socket.io'),
        status = require('status'),
        util = require('util'),
        config = JSON.parse(require('text!./config.json'));
    
    var actived = false,
        serverURL = null,
        channelID = null,
        namespace = null,
        ns = null;
    
    // protect functions to be called in wrong situations
    function _assertActivedStatus(func, shouldBeActived) {
        function compose() {
            if (actived !== shouldBeActived) {
                throw new Error('socket connection is not actived');
            }
            func.apply(context, arguments);
        }
        return compose;
    }
    
    function _deployOwnerSocket(callback) {
        ns.socket.on('connect', function() {
            status.setStatus(status.STATUS.AS_OWNER);
            actived = true;
            callback();
        });
        
        ns.socket.on('error', function() {
			//Actually this should move to the up layer
			//call callback(new Error('')) would be better
            window.alert('Connection failed.');
        });
        
        ns.on('serverVersion', function(data) {
            if (util.versionCompare(data, config.requiredServerVersion) === -1) {
                window.alert('Server version mismatched. Be sure to use the latest version of both client and server :)');
            }
        });
    }
    
    function _deployGuestSocket(callback) {
        ns.on('codeText', function(data) {
            $(exports).triggerHandler('receiveCodeText', [data]);
        });
        
        ns.on('shouldDisconnect', function() {
           ns.socket.disconnect(); 
        });

        ns.socket.on('connect', function() {
            status.setStatus(status.STATUS.AS_GUEST);
            actived = true;
            callback();
        });
        
        ns.socket.on('error', function() {
            window.alert('Connection failed.');
        });

        ns.on('serverVersion', function(data) {
            alert(data);
            if (util.versionCompare(data, config.requiredServerVersion) === -1) {
                window.alert('Server version mismatched. Be sure to use the latest version of both client and server :)');
            }
        });
    }
    
    function connectAsOwner(_serverURL, _channelID, callback) {
        callback = callback || function() {};
        
        serverURL = _serverURL;
        channelID = _channelID;
        namespace = '/' + _channelID;
        
        ns = socket_io.connect(serverURL + namespace, {'force new connection' : true});
        _deployOwnerSocket(callback);
    }
    
    function connectAsGuest(_serverURL, _channelID, callback) {
        callback = callback || function() {};
        
        serverURL = _serverURL;
        channelID = _channelID;
        namespace = '/' + _channelID;
        
        ns = socket_io.connect(serverURL + namespace, {'force new connection' : true});
        _deployGuestSocket(callback);
    }
    
    function sendCode(data) {
        ns.emit('codeText', data);
    }
    
    function unload() { 
        serverURL = null;
        channelID = null;
        namespace = null;
        ns.socket.disconnect();
        ns = null;
        actived = false;
    }
   
    exports.connectAsOwner = _assertActivedStatus(connectAsOwner, false);
    exports.connectAsGuest = _assertActivedStatus(connectAsGuest, false);
    exports.unload = _assertActivedStatus(unload, true);
    exports.sendCode = _assertActivedStatus(sendCode, true);
});
