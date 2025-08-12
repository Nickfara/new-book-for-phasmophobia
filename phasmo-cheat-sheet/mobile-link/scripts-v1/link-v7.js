function getCookie(e){let t=e+"=",i=decodeURIComponent(document.cookie).split(";");for(let n=0;n<i.length;n++){let o=i[n];for(;" "==o.charAt(0);)o=o.substring(1);if(0==o.indexOf(t))return o.substring(t.length,o.length)}return""}
function setCookie(e,t,i){let n=new Date;n.setTime(n.getTime()+864e5*i);let o="expires="+n.toUTCString();document.cookie=e+"="+t+";"+o+";path=/"}

let ws = null
let dlws = null
let dlwshost = null

let hasLink = false
let hasDLLink = false
let wakeLock = null;

let ghosts = {}

async function requestWakeLock() {
  try {
    wakeLock = await navigator.wakeLock.request('screen');
  } catch (err) {
    console.error(`${err.name}, ${err.message}`);
  }
}

// --------------- Handler functions

function load_ghost_data(){
    fetch("https://nickfara.github.io/new-book-for-phasmophobia/phasmophobia/data/ghosts.json", {cache: 'default', signal: AbortSignal.timeout(10000)})
    .then(data => data.json())
    .then(data => {
        Array.from(data.ghosts).forEach((ghost) => {
            let ghtml = `
                <div id="${ghost.ghost}" class="g-card">
                    <div class="g-name">${ghost.name}</div>
                        ${build_evidence(ghost.evidence)}
                        <div class="g-hunt">
                            <div class="g-speed">
                                <span class="g-head">Speed:</span>
                                ${toNumStr(ghost.min_speed)} <span class="ms">m/s</span>${ghost.max_speed == null ? '' : (+ghost.speed_is_range)?' - ':' | '}${ghost.max_speed == null ? '' : toNumStr(ghost.max_speed)+' <span class="ms">m/s</span>'}${ghost.alt_speed == null ? '' : '<br>('+toNumStr(ghost.alt_speed)+' <span class="ms">m/s</span>'}
                            </div>
                            <div class="g-sanity">
                                <span class="g-head">Sanity:</span>
                                ${parseInt(ghost.hunt_sanity_low) < parseInt(ghost.hunt_sanity) ? ('<div class="ghost_hunt_alt">' + ghost.hunt_sanity_low + '</div>') : ''}
                                <div>${ghost.hunt_sanity}</div>
                                ${parseInt(ghost.hunt_sanity_high) > parseInt(ghost.hunt_sanity) ? ('<div class="ghost_hunt_alt">' + ghost.hunt_sanity_high + '</div>') : ''}
                            </div>
                        </div>
                    <div class="g-data">
                        ${behavior(ghost.wiki)}
                    </div>
                </div>
            `

            document.getElementById("ghost-data").innerHTML += ghtml
        })
    })
}

function build_evidence(evi){
    let ehtml = "<div class='g-evidences'>"
    Array.from(evi).forEach((e) => {
        ehtml += `<div class="g-evi">${e}</div>`
    })
    ehtml += "</div>"
    return ehtml
}

function behavior(value){
    var msg = "<div class='ghost_behavior_item'>"
    var opened = false

    // Load Tells
    for(var s of ["tells","behaviors","abilities","hunt_sanity","hunt_speed","evidence"]){
        if(value[s] != null){
            opened = false
            for(var i = 0; i < value[s].length;i++){
                if(value[s][i]["include_on_card"]){
                    if(i == 0){
                        opened = true
                        msg += `<div class='dtitle'><i>${titleCase(s.replace("_",""))}</i><div class='ddash'></div></div><ul>`
                    }
                    msg += `<li>${value[s][i]["data"].replace(/<[^>]*\bonclick\b[^>]*>(.*?)<\/[^>]+>|<[^>]*\bonclick\b[^>]*\/?>/gi, '').replace(/\([^()]*<a\b[^>]*>.*?<\/a>[^()]*\)/gi, '')}</li>`
                }
            }
            if(opened)
            msg += "</ul>"
        }
    }

    msg += "</div>"
    return msg
}

function toNumStr(num) { 
    if(num == undefined)
        return ""
    let new_num = num
    if (Number.isInteger(new_num)) { 
        new_num += ".0"
    } else {
        new_num = new_num.toString(); 
    }

    return new_num
}

function titleCase(str) {
  return str.toLowerCase().split(' ').map(function(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

function toggle_ghosts(){
    if(document.getElementById("ghost-blackout").checkVisibility()){
        $("#ghost-blackout").fadeOut(500)
    }
    else{
        $("#ghost-blackout").fadeIn(500)
    }
}

function toggle_instructions(){
    if(document.getElementById("inst-blackout").checkVisibility()){
        $("#inst-blackout").fadeOut(500)
    }
    else{
        $("#inst-blackout").fadeIn(500)
    }
}

// --------------- Override WS send

const wssend = WebSocket.prototype.send

WebSocket.prototype.send = function(message){
    if(this.readyState == WebSocket.OPEN){
        wssend.call(this, message)
    }

    else if(this.readyState == WebSocket.CONNECTING){
        const timeout = setTimeout(() => {
            if(this.readyState != WebSocket.OPEN){
                console.error("Socket did not open in time, message not sent")
            }
        },5000)

        const interval = setInterval(() => {
            if(this.readyState === WebSocket.OPEN){
                clearTimeout(timeout)
                clearInterval(interval)
                wssend.call(this,message)
            }
        },250)
    }

    else{
        console.warn("Socket not open or connecting. Failed to send message")
    }

}

// --------------------------------

function sendMessage(event) {
    event.preventDefault();
    const input = document.getElementById('chat-input');
    const chatWindow = document.getElementById('chat-window');
    const message = input.value.trim();
    if (message) {
        chatWindow.innerHTML += `
            <div class="message">
                <span class="user">[me]</span>
                <span class="content">${message}</span>
            </div>
        `;
        chatWindow.scrollTop = chatWindow.scrollHeight;
        input.value = '';

        if(hasDLLink){
            if(Object.keys(discord_user).length > 0)
                dlws.send(`{"action":"INGC","message":"${message}","username":"${discord_user.username}"}`)
            else
                dlws.send(`{"action":"INGC","message":"${message}"}`)
        }
    }
}

function scrollToBottomWithVisualViewport() {
    if (window.visualViewport) {
        window.scrollTo(0, document.documentElement.clientHeight + window.visualViewport.pageTop);
    } else {
        window.scrollTo(0, document.documentElement.scrollHeight);
    }
}

function relink(){
    let room_id = getCookie("link-id")
    if(room_id){
        try{ws.close()}catch{}
        try{dlws.close()}catch{}
        try{dlwshost.close()}catch{}
        startlink(room_id)
    }
}

function checkstart(e){
    if (e.key === 'Enter' || e.key === "Return") {
        e.preventDefault();
        startlink()
  }
}

function startlink(link_id=null){
    document.getElementById("error").innerText = ""
    var room_id = link_id == null ? document.getElementById("journal-link-id").value : link_id
    document.getElementById("link-id").innerText = room_id
    ws = new WebSocket(`wss://zero-network.net/phasmolink/link/znml/${room_id}?ml=true`);

    ws.onopen = function(event){
        hasLink = true;
        ws_ping = setInterval(function(){
            send_ping()
        }, 30000)
    }
    ws.onerror = function(event){
        disconnect_room()
    }
    ws.onmessage = function(event) {
        try {

            if(event.data == "-"){
                state_received = true
                return
            }
            var incoming_state = JSON.parse(event.data)

            if (incoming_state.hasOwnProperty("setpos")){
                $("#blackout").fadeOut(500)
                setCookie("link-id",room_id,1)
                if ('wakeLock' in navigator) {
                    requestWakeLock();
                }
            }
            else if (incoming_state.hasOwnProperty("action")){

                if (incoming_state['action'].toUpperCase() == "UNLINK"){
                    document.getElementById("room_id").value = ""
                    disconnect_room()
                    return
                }
                if (incoming_state['action'].toUpperCase() == "CHANGE"){
                    document.getElementById("connected").innerText = `(${incoming_state['players']})`
                }
                if (incoming_state['action'].toUpperCase() == "ML-GHOSTS"){
                    let ghosts = []
                    let chosen = null
                    Array.from(incoming_state['ghost'].split(',')).forEach((entry) => {
                        let g = entry.split(":")[0]
                        $(document.getElementById(g)).show()
                        let v = parseInt(entry.split(":")[1])
                        if (v == 1 || v == 3){
                            ghosts.push(g)
                        }
                        else if(v == 2 || v == -2){
                            chosen = g
                        }
                        else{
                            $(document.getElementById(g)).hide()
                        }
                    })
                    document.getElementById("ghosts").innerText = chosen ? chosen : ghosts.length < 5 ? ghosts.join(", ") : "[Tap to view all ghosts]"
                    if (ghosts.length < 5)
                        $("#ghosts").removeClass("faded")
                    else
                        $("#ghosts").addClass("faded")
                }
                if (incoming_state['action'].toUpperCase() == "ML-EVIDENCE"){
                    Array.from(incoming_state['evidences'].split(',')).forEach((entry) => {
                        let e = entry.split(":")[0]
                        let v = parseInt(entry.split(":")[1])
                        if(v == 1){
                            $(document.getElementById(e)).removeClass("not_found")
                            $(document.getElementById(e)).removeClass("not_possible")
                            $(document.getElementById(e)).removeClass("removed")
                        }
                        else if(v == -1){
                            $(document.getElementById(e)).addClass("not_found")
                            $(document.getElementById(e)).addClass("not_possible")
                            $(document.getElementById(e)).removeClass("removed")
                        }
                        else if(v == -2){
                            $(document.getElementById(e)).removeClass("not_found")
                            $(document.getElementById(e)).removeClass("not_possible")
                            $(document.getElementById(e)).addClass("removed")
                        }
                        else{
                            $(document.getElementById(e)).removeClass("not_possible")
                            $(document.getElementById(e)).addClass("not_found")
                            $(document.getElementById(e)).removeClass("removed")
                        }
                    })
                }
                if (incoming_state['action'].toUpperCase() == "TIMER"){
                    if(incoming_state.hasOwnProperty("force_start") && incoming_state.hasOwnProperty("force_stop")){
                        toggle_timer(incoming_state["force_start"], incoming_state["force_stop"])
                    }
                    else{
                        toggle_timer()
                    }
                }
                if (incoming_state['action'].toUpperCase() == "COOLDOWNTIMER"){
                    if(incoming_state.hasOwnProperty("force_start") && incoming_state.hasOwnProperty("force_stop")){
                        toggle_cooldown_timer(incoming_state["force_start"], incoming_state["force_stop"])
                    }
                    else{
                        toggle_cooldown_timer()
                    }
                }
                if (incoming_state['action'].toUpperCase() == "HUNTTIMER"){
                    if(incoming_state.hasOwnProperty("force_start") && incoming_state.hasOwnProperty("force_stop")){
                        toggle_hunt_timer(incoming_state["force_start"], incoming_state["force_stop"])
                    }
                    else{
                        toggle_hunt_timer()
                    }
                }
                if (incoming_state['action'].toUpperCase() == "POLL"){
                    ws.send('{"action":"READY"}')
                }

            }
            else if (incoming_state.hasOwnProperty("error")){
                console.log(incoming_state)
                document.getElementById("error").innerText = `${incoming_state['error']}!`
                if (incoming_state.hasOwnProperty("disconnect") && incoming_state['disconnect']){
                    disconnect_room(false,true)
                } 
                return
            }
            else{
                let dif
                if(incoming_state['settings']['num_evidences'].match(/[0-9]{4}-[0-9]{4}-[0-9]{4}/g)){
                    dif = incoming_state['settings']['dif_name']
                }
                else{
                    dif = {
                        "3A":"Amateur",
                        "3I": "Intermediate",
                        "3": "Professional",
                        "2": "Nightmare",
                        "1": "Insanity",
                        "0": "Apocalypse III",
                        "-1": "Custom",
                        "-5": "Weekly"
                    }[incoming_state['settings']['num_evidences']]
                }
                let hunt = {
                    "3A": "Short",
                    "3I": "Medium",
                    "3": "Long"
                }[incoming_state['settings']['cust_hunt_length']]
                document.getElementById("difficulty").innerText = `${dif} | ${incoming_state['settings']['cust_num_evidences']} Evidence | ${hunt} Hunts`
                updateMapSize(incoming_state['map_size'])
                updateMapDifficulty(incoming_state['settings']['num_evidences'],incoming_state['settings']['cust_hunt_length'])
            }

        } catch (error){
            console.log(error)
            console.log(event.data)
        }
    }


    fetch(`https://nickfara.github.io/new-book-for-phasmophobia/znlink/create-link/znml`,{method:"POST",Accept:"application/json",signal: AbortSignal.timeout(6000)})
    .then(response => response.json())
    .then(data => {
        var link_id = data['link_id']
        dlwshost = new WebSocket(`wss://zero-network.net/phasmolink/link/${link_id}`);
        dlws = new WebSocket(`wss://zero-network.net/phasmolink/link/${link_id}`);

        dlws.onopen = function(event){
            hasDLLink = true;
            sync_sjl_dl(link_id)
        }
        dlws.onerror = function(event){
            disconnect_room()
        }
        dlws.onmessage = function(event){
            var incoming_state = JSON.parse(event.data)
            if (incoming_state.hasOwnProperty("action")){
                if(incoming_state['action'].toUpperCase() == "INGC"){
                    const chatWindow = document.getElementById('chat-window');
                    chatWindow.innerHTML += `
                        <div class="message">
                            <span class="user">[${incoming_state.hasOwnProperty("username") ? incoming_state.username : 'player '+ incoming_state['pos']}]</span>
                            <span class="content">${incoming_state['message']}</span>
                        </div>
                    `
                    chatWindow.scrollTop = chatWindow.scrollHeight;
                }
            }
        }
    })
    .catch(response => {
        console.error(response)
    });

}

function send_ping(){
    if(hasLink){
        ws.send('{"action":"PING"}')
    }
}

function send_evidence(elem){
    if(hasLink){
        ws.send(`{"action":"EVIDENCE","evidence":"${elem.id}"}`)
    }
}

function send_timer(force_start = false, force_stop = false){
    if(hasLink){
        ws.send(`{"action":"TIMER","force_start":${force_start},"force_stop":${force_stop}}`)
    }
}

function send_cooldown_timer(force_start = false, force_stop = false){
    if(hasLink){
        ws.send(`{"action":"COOLDOWNTIMER","force_start":${force_start},"force_stop":${force_stop}}`)
    }
}

function send_hunt_timer(force_start = false, force_stop = false){
    if(hasLink){
        ws.send(`{"action":"HUNTTIMER","force_start":${force_start},"force_stop":${force_stop}}`)
    }
}

function sync_sjl_dl(dl_link){
    if(hasDLLink && hasLink){
        ws.send(`{"action":"SJLDLLINK","value":"${dl_link}"}`)
    }
}

function disconnect_room(){
    try{ws.close()}catch{}
    try{dlws.close()}catch{}
    try{dlwshost.close()}catch{}
    document.getElementById("journal-link-id").value = ""
    setCookie("link-id","",-1)
    $("#blackout").fadeIn(500)
    hasLink=false
    hasDLLink=false
    if (wakeLock) {
        wakeLock.release();
        wakeLock = null;
    }
}