var my_id;
var ws = null;
var first_message = true;

function link(id,pos){
    ws = new WebSocket(`wss://zero-network.net/phasmolink/melink/${id}/${pos}`);

    ws.onopen = function(event){
        console.log('Connected')
    }
    ws.onerror = function(event){
        console.error(event.error)
    }
    ws.onmessage = function(event) {

        var pos = JSON.parse(event.data)

        if(pos.hasOwnProperty('history')){
            premap = pos['history']['map']
            try {changeMap(document.getElementById(pos['history']['map']),pos['history']['url'])} catch(e){}

            var cur_map = document.getElementById("cur-map")
            var ratio = cur_map.height/cur_map.naturalHeight

            for(var circ of pos['history']['circles']){
                if(circ['placed']){
                    drawCircles(-3000,-3000,"circles",circ['circles'],true)
                    for(child of document.getElementById(`circles`).children){
                        $(child).show()
                        child.style.transform = `translate(${Math.round(circ['x']*ratio) - ($(child).width()/2) - 3}px,${Math.round(circ['y']*ratio) - ($(child).height()/2) - 3}px)`
                    }
                    document.getElementById("placed_circles").innerHTML += document.getElementById(`circles`).innerHTML
                    document.getElementById(`circles`).innerHTML = ""
                }
                else{
                    drawCircles(-3000,-3000,`circles${circ['pos']}`,circ['circles'],true)
                    for(child of document.getElementById(`circles${circ['pos']}`).children){
                        $(child).show()
                        child.style.transform = `translate(${Math.round(circ['x']*ratio) - ($(child).width()/2) - 3}px,${Math.round(circ['y']*ratio) - ($(child).height()/2) - 3}px)`
                    }
                }
            }
        }

        else if (pos.hasOwnProperty("share")){
            if (pos['share']['circles']){
                var temp_share = `${pos['share']['map']}|`
                for(var circle of pos['share']['circles']){
                    if(circle['placed']){
                        for(const [key, value] of Object.entries(ranges)){
                            if(value.map(x => `${x['name']}-${x['radius']}`).filter(e => circle['circles'].map(x => `${x['name']}-${x['radius']}`).includes(e)).length > 0){
                                temp_share += `${circle['x']},${circle['y']},${key}:`
                                break
                            }
                        } 
                    }
                }
                navigator.clipboard.writeText(window.location.href.split('?')[0] + `?share=${temp_share.slice(0,-1)}`)
            }
        }
        else if (pos.hasOwnProperty("setpos")){
            my_id = parseInt(pos['setpos'])

        }
        else if(pos.hasOwnProperty("circles")){
            if(pos.hasOwnProperty("angle"))
                drawAngles(-3000,-3000,`circles${pos['pos']}`,pos['circles'],true)
            else
                drawCircles(-3000,-3000,`circles${pos['pos']}`,pos['circles'],true)
        }
        else if(pos.hasOwnProperty("offscreen")){
            $(document.getElementById(`cursor${pos['pos']}`)).hide()
            for(child of document.getElementById(`circles${pos['pos']}`).children){
                $(child).hide()
            }
        }
        else if(pos.hasOwnProperty("placed")){
            var cur_map = document.getElementById("cur-map")
            var ratio = cur_map.height/cur_map.naturalHeight
            $(document.getElementById(`cursor${pos['pos']}`)).show()
            document.getElementById(`cursor${pos['pos']}`).style.transform = `translate(${Math.round(pos.x*ratio)}px, ${Math.round(pos.y*ratio)}px)`
            for(child of document.getElementById(`circles${pos['pos']}`).children){
                $(child).show()
                child.style.transform = `translate(${Math.round(pos.x*ratio) - ($(child).width()/2) - 3}px,${Math.round(pos.y*ratio) - ($(child).height()/2) - 3}px)`
            }
            document.getElementById("placed_circles").innerHTML += document.getElementById(`circles${pos['pos']}`).innerHTML
            document.getElementById(`circles${pos['pos']}`).innerHTML = ""

        }
        else if(pos.hasOwnProperty("map")){
            clear_maps()
            clearstate()
            changeMap(document.getElementById(pos['map']),pos['url'])
        }
        else if(pos.hasOwnProperty("clear")){
            clear_maps()
            clearstate()
        }
        else{
            var cur_map = document.getElementById("cur-map")
            var ratio = cur_map.height/cur_map.naturalHeight
            $(document.getElementById(`cursor${pos['pos']}`)).show()
            document.getElementById(`cursor${pos['pos']}`).style.transform = `translate(${Math.round(pos.x*ratio)}px, ${Math.round(pos.y*ratio)}px)`
            for(child of document.getElementById(`circles${pos['pos']}`).children){
                $(child).show()
                if (child.id.includes("-left")){
                    child.style.transform = `translate(${Math.round(pos.x*ratio) - 5}px,${Math.round(pos.y*ratio) - $(child).height() - 8}px) rotate(${parseInt(pos.angle)-10}deg)`
                }
                else if (child.id.includes("-right")){
                    child.style.transform = `translate(${Math.round(pos.x*ratio) + 1}px,${Math.round(pos.y*ratio) - $(child).height() - 3}px) rotate(${parseInt(pos.angle)+10}deg)`
                }
                else{
                    child.style.transform = `translate(${Math.round(pos.x*ratio) - ($(child).width()/2) - 3}px,${Math.round(pos.y*ratio) - ($(child).height()/2) - 3}px)`
                }
            }
        }

        if(first_message && !pos.hasOwnProperty('history')){
            var cur_map_id = document.getElementsByClassName("selected_map")[0].id
            var cur_map_image = document.getElementsByClassName("selected_map")[0].onclick.toString().match(/https?:\/\/[^\s]+?\.(png|jpg|jpeg|gif)/)[0]
            send_map(cur_map_id,cur_map_image)
        }

        first_message = false
    }
}

var time_delta = 100
var prev_time = Date.now()
async function send_mouse(elem,e) {
    if (ws){
        var cur_time = Date.now()
        if (cur_time - prev_time > time_delta){
            var cur_map = document.getElementById("cur-map")
            var ratio = cur_map.naturalHeight/cur_map.height
            if (is_angle)
                ws.send('{"pos":'+my_id+',"x":'+Math.round(e.offsetX*ratio)+',"y":'+Math.round(e.offsetY*ratio)+',"angle":'+cur_rotation+'}')
            else
                ws.send('{"pos":'+my_id+',"x":'+Math.round(e.offsetX*ratio)+',"y":'+Math.round(e.offsetY*ratio)+'}')
            prev_time = cur_time
        }
    }
}

async function send_circle(){
    if (ws){
        if(is_angle)
            ws.send(JSON.stringify({"pos":my_id,"circles":selected_ranges,"angle":cur_rotation}))
        else
            ws.send(JSON.stringify({"pos":my_id,"circles":selected_ranges}))
    }
}

async function send_offscreen(){
    if (ws){
        ws.send('{"pos":'+my_id+',"offscreen":true}')
    }
}

async function send_place_circle(elem,e){
    if(circles.length < 2){
        return
    }

    if (ws){
        var cur_map = document.getElementById("cur-map")
        var ratio = cur_map.naturalHeight/cur_map.height
        ws.send('{"pos":'+my_id+',"x":'+Math.round(e.offsetX*ratio)+',"y":'+Math.round(e.offsetY*ratio)+',"placed":true}')
    }
}

async function send_clear(){
    if (ws){
        ws.send('{"pos":'+my_id+',"clear":true}')
    }
}

async function send_map(id, map){
    if (ws){
        ws.send('{"pos":'+my_id+',"map":"'+id+'", "url":"'+map+'"}')
    }
}

async function send_share_request(){
    if (ws){
        ws.send('{"pos":'+my_id+',"share":true}')
    }
    else{
        if(share_data['circles']){
            var encoded_str = `${share_data['map']}|`
            for (var circ of share_data['circles']){
                if(circ['angle'] === false)
                    encoded_str += `${circ['x']},${circ['y']},${circ['set']}:`
                else
                    encoded_str += `${circ['x']},${circ['y']},${circ['set']},${circ['angle']}:`
            }
            navigator.clipboard.writeText(window.location.href.split('?')[0] + `?share=${encoded_str.slice(0,-1)}`)
        }
    }
}