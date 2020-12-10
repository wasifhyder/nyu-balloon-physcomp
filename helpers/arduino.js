class SerialHelper {
    constructor(opts = {}) {
        this.opts = opts;
        this.pollInterval = opts.pollInterval || 300;
        
        // Create the serial helper object
        this.serial = new p5.SerialPort();

        // Requires portName
        // - Otherwise don't create the object
        if (opts.portName !== undefined) {
            console.log("INFO: No portname provided.")

            // List serial ports & return
            // - Autoselects if that configuration is opted for
            const serial = new p5.SerialPort();
            serial.on('list', this.onList.bind(this));
            serial.list();
            return
        }

        // Run as usual
        // ------------

        // Baud Rate
        const portName = opts.portName
        const baudRate = opts.baudRate || 9600;


        // Attach functions for
        this.serial.on('connected', this.onConnected.bind(this));
        this.serial.on('open', this.onOpen.bind(this));
        this.serial.on('data', _.throttle(this.onData.bind(this), 6, {
            leading: true,
            trailing: false
        })),
        this.serial.on('error', this.onError.bind(this));
        this.serial.on('close', this.onClose.bind(this));

        // Open the port
        this.serial.open(portName, {
            baudRate: baudRate
        });

        // Request data every 300 miliseconds
        setInterval(() => {
            this.serial.write("\n");
        }, this.pollInterval);
    }

    onList(portList) {
        // Display the list of ports
        portList.forEach((port, i) => {
            console.log(`${i} | ${port}`);
        })

        // Select default portname (using magic)
        const opts = this.opts;
        if (opts.autoSelectPortName) {
            this.handleAutomaticPortSelection(portList);
        } else {
            console.log("ERR: Please specify a portname from the list below.");
            return; // Break - Since we cannot determine portname
        }

        return portList;
    }

    handleAutomaticPortSelection(portList) {
        const opts = this.opts;
        const validPortNames = portList.filter(i => i.indexOf('tty.usbmodem') >= 0);
        console.log(`INFO: Selecting portname automatically from ${validPortNames}`)
        if (validPortNames.length > 0) {
            opts.portName = validPortNames[0];
            this.serial = new SerialHelper(opts);
            console.log(`INFO: Selected portname ${opts.portName}`)
        } else {
            console.log("ERR: Autoselect Failed. Please specify a portname from the list below.");
            return; // Break - Since we cannot determine portname
        }
    }

    onConnected() {
        if (isValidFunction(this.opts, 'onConnected')) {
            this.opts.onConnected();
            this.serial.clear();
        } else {
            console.log('INFO: onConnected not defined | Running default')
            console.log('INFO: The serial port opened.')
        }
    }

    onOpen() {
        if (isValidFunction(this.opts, 'onOpen')) {
            this.opts.onOpen();
            this.serial.clear();
        } else {
            console.log('INFO: onOpen not defined | Running default')
            console.log('INFO: Connected to server. Clearing serial buffer...');
            this.serial.clear();
        }
    }

    onData() {
        if (isValidFunction(this.opts, 'onData')) {
            let inData = this.serial.readLine();
            this.opts.onData(inData);
        } else {
            console.log('INFO: onData not defined | Running default')
        }
    }

    onError() {
        if (isValidFunction(this.opts, 'onError')) {2
            this.opts.onError();
        } else {
            console.log('INFO: onError not defined | Running default')
        }
    }

    onClose() {
        if (isValidFunction(this.opts, 'onClose')) {
            this.opts.onClose();
        } else {
            console.log('INFO: onClose not defined | Running default')
        }
    }
}

function isValidFunction(obj, fnName) {
    return obj[fnName] !== undefined && obj[fnName] instanceof Function
}