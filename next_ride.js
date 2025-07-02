const w = new ListWidget();
w.backgroundColor = new Color("#f7f7f7");
const myGradient = new LinearGradient();
myGradient.colors = [new Color("#0000ff"), new Color("#f7f7f7")];
myGradient.locations = [0,0.35];
w.backgroundGradient = myGradient;
// RTD route info
let config = {
    route:    25990,
    direction: 'Southbound',
    branch: 'E'
};
const MINUTE = 60000;
// setup display
let stack = w.addStack();
stack.centerAlignContent();
const title = stack.addText('RTD Next Ride');
title.textColor = Color.white();
title.font = Font.boldSystemFont(18);
stack = w.addStack();
const spacer = stack.addText(' ');
// get data
const tUrl = 'https://nodejs-prod.rtd-denver.com/api/v2/nextride/stops/' + config.route;
console.log("Getting RTD route info");
let route = await get({url: tUrl});
// calculate table
let timeTable = [];
let max = 0;
const stopName = route.name;
console.log('sotpName: ', stopName);
//fill time table array
route.branches.map((branch) => {
    if(branch.directionName === config.direction && branch.id === config.branch) {
        branch.upcomingTrips.map((trip) => {
            let times = {
                "sTime": trip.scheduledArrivalTime,
                "pTime": trip.predictedArrivalTime,
                "status": trip.tripStopStatus
            }
            timeTable.push(times);
        });
    }
});
//sort time table
timeTable.sort(function(a,b){
    return parseFloat(a.sTime) - parseFloat(b.sTime);
});
max = timeTable.length;
//only show next 3
if(max > 3) {
    max = 3;
}
//Name
stack = w.addStack();
stack.centerAlignContent();
let stopLabel = stack.addText(stopName);
stopLabel.textColor = Color.black();
stack.addSpacer(10);

//Trips
for(let i=0; i<max; i++) {
    let df = new DateFormatter();
    df.dateFormat = 'h:mm';
    let sTime = df.string(new Date(timeTable[i].sTime));
    let pTime = null;
    let dTimeStr = "On Time";
    stack = w.addStack();
    stack.centerAlignContent();

    if(timeTable[i].status === "CANCELLED") {
        let status = stack.addText(timeTable[i].status);
        status.textColor = Color.red();
    } else {
        let timeLabel = stack.addText(sTime);
        timeLabel.textColor = Color.black();
        if(timeTable[i].pTime){
            pTime = df.string(new Date(timeTable[i].pTime));
            // if delta is less than a minute, it's on time
            if(Math.abs(timeTable[i].pTime - timeTable[i].sTime) < MINUTE) {
                dTimeStr = '  On Time'
                let label = stack.addText(dTimeStr);
                label.textColor = Color.green();
            } else if(timeTable[i].pTime > timeTable[i].sTime){
                dTimeStr = "  :"+ calculateDelta(timeTable[i].pTime,timeTable[i].sTime) + " late";
                let label = stack.addText(dTimeStr);
                label.textColor = Color.red();
            } else {
                dTimeStr = "  :"+ calculateDelta(timeTable[i].sTime, timeTable[i].pTime) + " early";
                let label = stack.addText(dTimeStr);
                label.textColor = Color.green();
            }
        }
    }
}

// display
Script.setWidget(w);
w.presentSmall();
Script.complete();

async function get(opts){
    try {
        const request = new Request(opts.url);
        request.headers = {
            ...opts.headers,
            ...this.defaultHeaders
        }
        let result = await request.loadJSON();
        console.log("RESULT: ", result);
        if(result.errors === undefined){
            return result;
        } else {
            let alert = new Alert();
            alert.title = "ERROR";
            alert.message = result.errors[0].detail;
            alert.presentAlert();
            return {};
        }
    } catch (error) {
        console.log('Could not fetch data: ' + error);
        return {directions: {travelTimeInSeconds: 0}};
    }
}

function calculateDelta(a,b){
    let deltaStr = '';
    let delta = Math.trunc((a - b) / MINUTE);
    if(delta < 10) {
        deltaStr = '0' + delta.toString();
    } else {
        deltaStr = delta.toString();
    }
    return deltaStr;
}