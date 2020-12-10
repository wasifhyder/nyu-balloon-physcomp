let dropzone;
let json;
let dataDisplay;
let data = {}
let healthData = {}
let activitySummary = []
let activityTypes = new Set()
let heartRateData = []
let ready = false
let counter = 0

function setup() {
    createCanvas(400, 400);
    dataDisplay = createElement('pre', "Data will be displayed here")

    // Create a helper for managing p5 Serial Processing
    // - 
    serialHelper = new SerialHelper({
        autoSelectPortName: true,
        onData: (data) => {
            // Read Data Here
        },
        pollFn: (serial) => {
            // serial.write(byte('\n'))
        },
        pollInterval: 1000 / 60,
    });

    // Drag and Drop
    dropzone = select('#dropzone')
    dropzone.dragOver(highlight);
    dropzone.dragLeave(unhighlight);
    dropzone.drop(gotFile, unhighlight)
}

function draw() {
    background(210);

    if (ready) {
        let activeEnergyBurned = activitySummary.map(r => r['@activeEnergyBurned'])
        let activeEnergyBurnedGoal = activitySummary.map(r => r['@activeEnergyBurnedGoal'])
        let exerciseTime = activitySummary.map(r => r['@appleExerciseTime'])
        let exerciseTimeGoal = activitySummary.map(r => r['@appleExerciseTimeGoal'])
        let standHours = activitySummary.map(r => r['@appleStandHours'])
        let standHoursGoal = activitySummary.map(r => r['@appleStandHoursGoal'])
        ellipse(10, 10, activeEnergyBurned[counter])
        ellipse(10, 50, activeEnergyBurnedGoal[counter])
        counter++

        serialHelper.serial.write("1200,600,200")
        alert('I am sending data')
    }
}

function filterAppleWatchData(record) {
    return record['@sourceName'].indexOf('Watch') !== -1
}

function updateData() {
    healthData = data['HealthData'];
    activitySummary = healthData.ActivitySummary
    activityTypes = new Set(data.HealthData.Record.map(r => r['@type']));
    sourceTypes = new Set(data.HealthData.Record.map(r => r['@sourceName']))
    heartRateData = healthData.Record.filter(r => r['@type'] === "HKQuantityTypeIdentifierHeartRate").slice(0, 100)
    // dataDisplay.html(JSON.stringify(heartRateData, null, 4))
    dataDisplay.html(JSON.stringify(activitySummary, null, 4))

    ready = true;
}

function highlight() {
    dropzone.style('background-color', 'gray')
}

function unhighlight() {
    dropzone.style('background-color', 'white')
}

function gotFile(file) {
    var zip = new JSZip();
    zip.loadAsync(file.data.substring(28), {
            base64: true
        })
        .then(function (zip) {
            let exportFileXml = zip.files['apple_health_export/export.xml'];
            exportFileXml.async('text').then((exportFileXmlContent => {
                let result = parseXml(exportFileXmlContent);
                json = xml2json(result, "  ");
                data = JSON.parse(json)
                updateData()
            }))

        }, function (err) {
            alert("Not a valid zip file " + err)
        });
}

function parseXml(xml) {
    var dom = null;
    if (window.DOMParser) {
        try {
            dom = (new DOMParser()).parseFromString(xml, "text/xml");
        } catch (e) {
            dom = null;
        }
    } else if (window.ActiveXObject) {
        try {
            dom = new ActiveXObject('Microsoft.XMLDOM');
            dom.async = false;
            if (!dom.loadXML(xml)) // parse error ..

                window.alert(dom.parseError.reason + dom.parseError.srcText);
        } catch (e) {
            dom = null;
        }
    } else
        alert("cannot parse xml string!");
    return dom;
}