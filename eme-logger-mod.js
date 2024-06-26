(async () => {
	const indent = (s,n=4) => s.split('\n').map(l=>Array(n).fill(' ').join('')+l).join('\n');
	
    const b64 = {
        decode: s => Uint8Array.from(atob(s), c => c.charCodeAt(0)),
        encode: b => btoa(String.fromCharCode(...new Uint8Array(b)))
    };

    const fnproxy = (object, func) => new Proxy(object, { apply: func });

    const proxy = (object, key, func) => Object.defineProperty(object, key, {
        value: fnproxy(object[key], func)
    });
	
    proxy(Navigator.prototype, 'requestMediaKeySystemAccess', async (_target, _this, _args) => {
        const [keySystem, supportedConfigurations] = _args;
        console.groupCollapsed(
            `[EME] Navigator::requestMediaKeySystemAccess\n` +
            `    Key System: ${keySystem}\n` +
            `    Supported Configurations:\n` +
            indent(JSON.stringify(supportedConfigurations, null, '    '))
        );
        console.trace();
        console.groupEnd();
        return _target.apply(_this, _args);
    });

    proxy(MediaKeySystemAccess.prototype, 'createMediaKeys', async (_target, _this, _args) => {
        console.groupCollapsed(
            `[EME] MediaKeySystemAccess::createMediaKeys\n` +
            `    Key System: ${_this.keySystem}\n` +
            `    Configurations:\n` +
            indent(JSON.stringify(_this.getConfiguration(), null, '    '))
        );
        console.trace();
        console.groupEnd();
        return _target.apply(_this, _args);
    });

    proxy(MediaKeys.prototype, 'setServerCertificate', async (_target, _this, _args) => {
        const [serverCertificate] = _args;
        console.groupCollapsed(
            `[EME] MediaKeys::setServerCertificate\n` +
            `    Server Certificate: ${b64.encode(serverCertificate)}`
        );
        console.trace();
        console.groupEnd();
        return _target.apply(_this, _args);
    });

    function messageHandler(event) {
        const keySession = event.target;
        const {sessionId} = keySession;
        const {message, messageType} = event;
        const listeners = keySession.getEventListeners('message').filter(l => l !== messageHandler);
		const challenge = b64.encode(message)
        console.groupCollapsed(
            `[EME] MediaKeySession::message\n` +
            `    Session ID: ${sessionId || '(not available)'}\n` +
            `    Message Type: ${messageType}\n` +
            `    Message: ${challenge}` +
            '\n    Listeners:', listeners
        );
        console.trace();
        console.groupEnd();
		
		if (messageType === "license-request")
			window.postMessage({ type: "38405bbb-36ef-454d-8b32-346f9564c978", log: challenge }, "*");
    }

    function keystatuseschangeHandler(event) {
        const keySession = event.target;
        const {sessionId} = keySession;
        const listeners = keySession.getEventListeners('keystatuseschange').filter(l => l !== keystatuseschangeHandler);
        console.groupCollapsed(
            `[EME] MediaKeySession::keystatuseschange\n` +
            `    Session ID: ${sessionId || '(not available)'}\n` +
            Array.from(keySession.keyStatuses).map(([keyId, status]) =>
                                                   `    [${status.toUpperCase()}] ${b64.encode(keyId)}`
                                                  ).join('\n') +
            '\n    Listeners:', listeners
        );
        console.trace();
        console.groupEnd();
    }

    proxy(MediaKeys.prototype, 'createSession', (_target, _this, _args) => {
        const [sessionType] = _args;
        console.groupCollapsed(
            `[EME] MediaKeys::createSession\n` +
            `    Session Type: ${sessionType || 'temporary (default)'}`
        );
        console.trace();
        console.groupEnd();
        const session = _target.apply(_this, _args);
        session.addEventListener('message', messageHandler);
        session.addEventListener('keystatuseschange', keystatuseschangeHandler);
        return session;
    });

    function getEventListeners(type) {
        if (this == null) return [];
        const store = this[Symbol.for(getEventListeners)];
        if (store == null || store[type] == null) return [];
        return store[type];
    }

    EventTarget.prototype.getEventListeners = getEventListeners;

    proxy(EventTarget.prototype, 'addEventListener', async (_target, _this, _args) => {
        if (_this != null) {
            const [type, listener] = _args;
            const storeKey = Symbol.for(getEventListeners);
            if (!(storeKey in _this)) _this[storeKey] = {};
            const store = _this[storeKey];
            if (!(type in store)) store[type] = [];
            const listeners = store[type];
            if (listeners.indexOf(listener) < 0) {
                listeners.push(listener);
            }
        }
        return _target.apply(_this, _args);
    });

    proxy(EventTarget.prototype, 'removeEventListener', async (_target, _this, _args) => {
        if (_this != null) {
            const [type, listener] = _args;
            const storeKey = Symbol.for(getEventListeners);
            if (!(storeKey in _this)) return;
            const store = _this[storeKey];
            if (!(type in store)) return;
            const listeners = store[type];
            const index = listeners.indexOf(listener);
            if (index >= 0) {
                if (listeners.length === 1) {
                    delete store[type];
                } else {
                    listeners.splice(index, 1);
                }
            }
        }
        return _target.apply(_this, _args);
    });

    proxy(MediaKeySession.prototype, 'generateRequest', async (_target, _this, _args) => {
        const [initDataType, initData] = _args;
		const pssh = b64.encode(initData)
        console.groupCollapsed(
            `[EME] MediaKeySession::generateRequest\n` +
            `    Session ID: ${_this.sessionId || '(not available)'}\n` +
            `    Init Data Type: ${initDataType}\n` +
            `    Init Data: ${pssh}`
        );
        console.trace();
        console.groupEnd();
		if (pssh)
			window.postMessage({ type: "38405bbb-36ef-454d-8b32-346f9564c978", log: pssh }, "*");
        return _target.apply(_this, _args);
    });

    proxy(MediaKeySession.prototype, 'load', async (_target, _this, _args) => {
        const [sessionId] = _args;
        console.groupCollapsed(
            `[EME] MediaKeySession::load\n` +
            `    Session ID: ${sessionId || '(not available)'}`
        );
        console.trace();
        console.groupEnd();
        return _target.apply(_this, _args);
    });

    proxy(MediaKeySession.prototype, 'update', async (_target, _this, _args) => {
        const [response] = _args;
		const license = b64.encode(response)
        console.groupCollapsed(
            `[EME] MediaKeySession::update\n` +
            `    Session ID: ${_this.sessionId || '(not available)'}\n` +
            `    Response: ${license}`
        );
        console.trace();
        console.groupEnd();
		if (license)
			window.postMessage({ type: "38405bbb-36ef-454d-8b32-346f9564c978", log: license }, "*");
        return _target.apply(_this, _args);
    });

    proxy(MediaKeySession.prototype, 'close', async (_target, _this, _args) => {
        console.groupCollapsed(
            `[EME] MediaKeySession::close\n` +
            `    Session ID: ${_this.sessionId || '(not available)'}`
        );
        console.trace();
        console.groupEnd();
        return _target.apply(_this, _args);
    });

    proxy(MediaKeySession.prototype, 'remove', async (_target, _this, _args) => {
        console.groupCollapsed(
            `[EME] MediaKeySession::remove\n` +
            `    Session ID: ${_this.sessionId || '(not available)'}`
        );
        console.trace();
        console.groupEnd();
        return _target.apply(_this, _args);
    });
})();