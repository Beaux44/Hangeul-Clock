let displayedHour = new Date().getHours();
let displayedMinute = new Date().getMinutes();
let messageUpdated = new Date().getTime();
let messageEl;
let quotes = [];

const settings = {
    clockcolor: "255, 255, 255",
    unlitcolor: "255, 255, 255",
    messagecolor: "255, 255, 255",
    bordercolor: "255, 255, 255",
    wallpaper: "../media/default.jpg",
    customtext: "오늘도 수고했어.",
    bgseparate: false,
    opacity: 0.2,
    dim: 0.5,
    useglow: false,
    useglowcolor: false,
    glowcolor: "255, 255, 255",
    glowintensity: 1,
    glowspread: 10,
    msgfreqtype: false,
    msgfreq: 5,
    msgusefile: false,
    msgfile: "", 
    ampm: false,
}

// Read WallpaperEngine Property
window.wallpaperPropertyListener = {
    applyUserProperties: function(properties) {
        let themeUpdate = false;

        for(let prop of ["clockcolor", "unlitcolor", "glowcolor"]) {
            if(properties[prop]) {
                settings[prop] = WPEToRGB(properties[prop].value);
                themeUpdate = true;
            }
        }

        for(let prop of ["bgseparate", "useglow", "useglowcolor", "glowspread", "glowintensity"]) {
            if(properties[prop]) {
                settings[prop] = properties[prop].value;
                themeUpdate = true;
            }
        }

        if(properties.opacity) {
            settings.opacity = properties.opacity.value / 100;
            themeUpdate = true;
        }

        for(let prop of ["msgfreqtype", "msgshuffle", "msgfreq"]) {
            if(properties[prop]) {
                settings[prop] = properties[prop].value;
            }
        }

        if(properties.msgusefile) {
            settings.msgusefile = properties.msgusefile.value;
            updateMessage();
        }

        if(properties.msgfile) {
            settings.msgfile = properties.msgfile.value;
            
            let f = fetch(`file:///${settings.msgfile}`);
            f.then(r => r.text())
                .then(r => {
                    quotes = r.split("\n");
                    updateMessage();
                });
        }

        if(themeUpdate) {
            updateClockColor();
        }

        if(properties.ampm) {
            settings.ampm = properties.ampm.value;
            updateAMPM();
        }

		if(properties.bordercolor) {
			settings.bordercolor = WPEToRGB(properties.bordercolor.value);

			let borderElements = document.getElementsByClassName("border");

            borderElements[0].style.color = `rgb(${settings.bordercolor})`;
            borderElements[borderElements.length - 1].style.color = `rgb(${settings.bordercolor})`;
		}
		
		if(properties.messagecolor) {
            settings.messagecolor = WPEToRGB(properties.messagecolor.value);
			messageEl.style.color = `rgb(${settings.messagecolor})`;
		}
		
		if(properties.customtext) {
			settings.customtext = properties.customtext.value;
			messageEl.innerText = settings.customtext;
		}
		
		if(properties.dim) {
			settings.dim = properties.dim.value / 100;
			document.getElementsByTagName("body")[0].pseudoStyle("before", "background-color", `rgba(0, 0, 0, ${settings.dim})`);
		}

        if(properties.img) {
            settings.wallpaper = properties.wallpaper.value;
            document.body.style.background = `url('file:///${settings.wallpaper}')`;
            document.body.style.backgroundSize = "100vw";
        }
	}
}


function livelyPropertyListener(name, val) {
    switch(name) {
        case "bordercolor":
            settings.bordercolor = hexToRGB(val);
			let borderElements = document.getElementsByClassName("border");
			for(let i = 0; i < borderElements.length; i++) {
				borderElements[i].style.color = `rgb(${settings.bordercolor})`;
			}
            break;
        case "clockcolor":
        case "unlitcolor":
        case "glowcolor":
            settings[name] = hexToRGB(val);
            updateClockColor();
            break;
        case "messagecolor":
            settings.messagecolor = hexToRGB(val);
			messageEl.style.color = `rgb(${settings.messagecolor})`;
            break;
        case "customtext":
            settings.customtext = val;
            if(!settings.msgusefile)
                updateMessage();
            break;
        case "dim":
            settings.dim = val / 100;
			document.getElementsByTagName("body")[0].pseudoStyle("before", "background-color", `rgba(0, 0, 0, ${settings.dim})`);
            break;
        case "opacity":
            settings.opacity = val / 100;
            updateClockColor();
            break;
        case "img":
            settings.wallpaper = val.replace("\\", "/");
            document.body.style.background = `url('../${settings.wallpaper}')`;
            document.body.style.backgroundSize = "100vw";
            break;
        case "bgseparate":
        case "useglow":
        case "useglowcolor":
        case "glowspread":
        case "glowintensity":
            settings[name] = val;
            updateClockColor();
            break;
        case "msgfreq":
        case "msgfreqtype":
        case "msgshuffle":
            settings[name] = val;
            break;
        case "msgusefile":
            settings.msgusefile = val;
            updateMessage();
            break;
        case "msgfile":
            settings.msgfile = val;
            
            let f = fetch(`/${settings.msgfile}`);
            f.then(r => r.text())
                .then(r => {
                    quotes = r.split("\n");
                    updateMessage();
                });
            break;
        case "ampm":
            settings.ampm = val;
            updateAMPM();
            break;
    }
}

// Render Time on First Load
window.onload = function() {
	renderTime(displayedHour, displayedMinute);
    messageEl = document.getElementById("message");
    messageEl.style.color = `rgb( ${settings.messagecolor} )`;

    let els = document.getElementsByClassName("border");
    els[0].style.color = `rgb( ${settings.bordercolor} )`;
    els[els.length - 1].style.color = `rgb( ${settings.bordercolor} )`;
}

// Timer for Clock
setInterval(function() {
	let currentHour = new Date().getHours();
	let currentMinute = new Date().getMinutes();
	if(displayedHour !== currentHour || displayedMinute !== currentMinute) {
		renderTime(currentHour, currentMinute);
	}
    let tmp = settings.msgfreq * (settings.msgfreqtype ? 1 : 60) * 1000;
    if(settings.msgusefile && (new Date().getTime() - messageUpdated > tmp))
        updateMessage();
}, 1000);

let currentMessage = 0;
function updateMessage() {
    // Why the fuck is this necessary
    if(Number.isNaN(currentMessage))
        currentMessage = 0;

    if(settings.msgusefile) {
        if(settings.msgshuffle) {
            currentMessage = Math.floor(Math.random() * quotes.length);
            messageEl.innerText = quotes[currentMessage];
        } else {
            currentMessage = (currentMessage + 1) % quotes.length;
            messageEl.innerText = quotes[currentMessage];
        }
    } else {
        messageEl.innerText = settings.customtext;
    }
    messageUpdated = new Date().getTime();
}

function updateAMPM() {
    let midnight = document.getElementById("midnight");
    let highnight = document.getElementById("highnoon-midnight");
    let highnoon = document.getElementById("highnoon");
    if(settings.ampm) {
        midnight.innerText = "오";
        highnight.innerText = "전";
        highnoon.innerText = "후";
    } else {
        midnight.innerText = "자";
        highnight.innerText = "정";
        highnoon.innerText = "오";
    }
    midnight.setAttribute("class", "disabled");
    highnight.setAttribute("class", "disabled");
    highnoon.setAttribute("class", "disabled");
    renderTime(new Date().getHours(), new Date().getMinutes());
}

function updateClockColor() {
    let ulcolor = settings.bgseparate ? settings.unlitcolor : settings.clockcolor;
    let glowcolor = settings.useglowcolor ? settings.glowcolor : settings.clockcolor;


	let enabledElements = document.getElementsByClassName("enabled");
	for(let i = 0; i < enabledElements.length; i++) {
		enabledElements[i].style.color = `rgb(${settings.clockcolor})`;

        if(settings.useglow) {
            let tmp = `1px 1px ${settings.glowspread}px rgb(${glowcolor})`;
            enabledElements[i].style.textShadow = new Array(settings.glowintensity).fill(tmp).join(",");
        } else {
            enabledElements[i].style.textShadow = "";
        }
	}

	let disabledElements = document.getElementsByClassName("disabled");
	for(let i = 0; i < disabledElements.length; i++) {
		disabledElements[i].style.color = `rgb(${ulcolor}, ${settings.opacity})`;
        disabledElements[i].style.textShadow = "";
	}
}

function hexToRGB(hex) {
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);

    return [r, g, b];
}

function WPEToRGB(wpe) {
    return wpe.split(' ').map(function(c) {
        return Math.ceil(c * 255);
    });
}

// Rendering the Clock
function renderTime(hour, min) {
	let oldIdList = timeToId(displayedHour, displayedMinute);
	let idList = timeToId(hour, min);

	for(let i = 0; i < oldIdList.length; i++) {
		if(!(idList.indexOf(oldIdList[i]) > -1))
			document.getElementById(oldIdList[i]).setAttribute("class", "disabled");
	}

    console.log(idList);
	for(let i = 0; i < idList.length; i++) {
		let targetElement = document.getElementById(idList[i]);
        
        if(typeof targetElement === "undefined")
            continue;

		if(targetElement.getAttribute("class") !== "enabled")
			targetElement.setAttribute("class", "enabled");
	}

    let weekdays = document.querySelectorAll(".weekdays > :not(.border)");
    let today = new Date().getDay();

    for(let i = 0; i < weekdays.length; i++) {
        weekdays[i].setAttribute("class", today === i ? "enabled" : "disabled");
    }

	updateClockColor();
	displayedHour = hour;
	displayedMinute = min;
}

// Parse time to elements id
function timeToId(hour, min) {
    if(settings.ampm)
        return parseAMPM(hour, min);

	let returnList = new Array();

	if(min === 0 && hour === 0) {
		returnList.push("midnight");
		returnList.push("highnoon-midnight");
	} else if(min === 0 && hour === 12) {
		returnList.push("highnoon");
		returnList.push("highnoon-midnight");
	} else {
		returnList = parseHour(hour);
		if(min !== 0) {
			returnList = returnList.concat(parseMinute(min));
		}
	}

	return returnList;
}

function parseAMPM(hour, min) {
    let returnList = new Array();
    returnList.push("midnight");
    if(hour < 12) {
        returnList.push("highnoon-midnight")
    } else {
        returnList.push("highnoon")
    }

    returnList = returnList.concat(parseHour(hour));
    if(min !== 0)
        returnList = returnList.concat(parseMinute(min));
    
    return returnList;
}

const hourTable = [["ten-oclock", "twelve-oclock"], ["one-oclock"], ["two-oclock"], ["three-oclock"], ["four-oclock"],
                   ["five-oclock-one", "five-oclock-two"], ["six-oclock-one", "six-oclock-two"],
                   ["seven-oclock-one", "seven-oclock-two"], ["eight-oclock-one", "eight-oclock-two"],
                   ["nine-oclock-one", "nine-oclock-two"], ["ten-oclock"], ["ten-oclock", "eleven-oclock"]];

function parseHour(hour) {
	let hourList = new Array();
    hourList = hourList.concat(hourTable[hour % 12])
	hourList.push("oclock");
	return hourList;
}

function parseMinute(min) {
	let minList = new Array();
	let tendigit = (min / 10)|0;
	let onedigit = min % 10;

	if(tendigit !== 0) {
        if(tendigit !== 1)
            minList.push(`ten-min${tendigit}`);
		minList.push("ten-min");
	}

    if(onedigit !== 0)
        minList.push(`min${onedigit}`);

	minList.push("min");
	return(minList);
}

let UID = {
	_current: 0,
	getNew: function(){
		this._current++;
		return this._current;
	}
};

HTMLElement.prototype.pseudoStyle = function(element,prop,value){
	var _this = this;
	var _sheetId = "pseudoStyles";
	var _head = document.head || document.getElementsByTagName('head')[0];
	var _sheet = document.getElementById(_sheetId) || document.createElement('style');
	_sheet.id = _sheetId;
	var className = "pseudoStyle" + UID.getNew();
	
	_this.className +=  " "+className; 
	
	_sheet.innerHTML += " ."+className+":"+element+"{"+prop+":"+value+"}";
	_head.appendChild(_sheet);
	return this;
};
			
		
		
