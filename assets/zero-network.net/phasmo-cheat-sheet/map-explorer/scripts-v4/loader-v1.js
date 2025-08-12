let all_maps = {}
let ranges = {}
let all_spots = {}
let image
let preload = {}
let automated = false

function getMaps(){
    let loadMaps = new Promise((resolve, reject) => {
        fetch("http://nickfara.github.io/new-book-for-phasmophobia/phasmophobia/data/maps", {signal: AbortSignal.timeout(6000)})
        .then(data => data.json())
        .then(data => {
            var map_html = ""
            for(var i = 0; i < data.length; i++) {
                all_maps[data[i]['div_id']] = data[i]['file_url']
                map_html += `<button class="maps_button${data[i]['div_id'] == premap ? " selected_map" : ""}" id="${data[i]['div_id']}" onclick="changeMap(this,'${data[i]['file_url']}');send_map('${data[i]['div_id']}','${data[i]['file_url']}')"><div class="map_size ${data[i]['size'].toLowerCase()}">${data[i]['size']}</div>${data[i]['name']}</button>`
            }
            $("#map-list").html(map_html)

            resolve("Map data loaded")
        })
        .catch(error => {
            console.error(error)
            reject("Failed to load map data")
        })
    })
    let loadSpots = new Promise((resolve, reject) => {
        fetch("http://nickfara.github.io/new-book-for-phasmophobia/phasmophobia/data/map-hiding-spots", {signal: AbortSignal.timeout(6000)})
        .then(data => data.json())
        .then(data => {
            
            all_spots = data

            if ('requestIdleCallback' in window) {
                requestIdleCallback(() => {
                    const preimage = new Image();
                    preimage.src = 'https://file.garden/Z-9fual_RynAMoLc/Lobby%20360s/lobby.webp';
                    preload['https://file.garden/Z-9fual_RynAMoLc/Lobby%20360s/lobby.webp'] = preimage;

                });
            } else {
                // fallback for older browsers
                setTimeout(() => {
                    const preimage = new Image();
                    preimage.src = 'https://file.garden/Z-9fual_RynAMoLc/Lobby%20360s/lobby.webp';
                    preload['https://file.garden/Z-9fual_RynAMoLc/Lobby%20360s/lobby.webp'] = preimage;
                }, 0);
            }

            resolve("Map data loaded")
        })
        .catch(error => {
            console.error(error)
            reject("Failed to load map data")
        })
    })
    let loadRanges = new Promise((resolve, reject) => {
        fetch("data/ranges.json", {signal: AbortSignal.timeout(6000)})
        .then(data => data.json())
        .then(data => {
            ranges = data

            resolve("Range data loaded")
        })
        .catch(error => {
            console.error(error)
            reject("Failed to load range data")
        })
    })
    Promise.all([loadMaps,loadSpots,loadRanges])
    .then(x => {
        params = new URL(window.location.href).searchParams
        if (params.get("automation-mapping")){
            automated = true
        }
        if (params.get("share")){
            var encoded_str = params.get('share')
            var map = encoded_str.split("|")[0]
            var map_size = document.getElementById(map).firstElementChild.innerText

            let url = new URL(window.location.href)
            url.searchParams.delete("share")
            history.replaceState(history.state,"",url.href)

            if(encoded_str.split("|").length > 1){
                var share = {"map": map,"url":document.getElementById(map).onclick.toString().match(/https?:\/\/[^\s]+?\.(png|jpg|jpeg|gif)/)[0],"circles":encoded_str.split("|")[1].split(":").map(i => (i.split(',').length > 3 ? {"x":i.split(",")[0],"y":i.split(",")[1],"circles":ranges[i.split(",")[2]],"angle":i.split(",")[3]} : {"x":i.split(",")[0],"y":i.split(",")[1],"circles":ranges[i.split(",")[2]],"angle":false}))}
            }
            else{
                var share = {"map": map,"url":document.getElementById(map).onclick.toString().match(/https?:\/\/[^\s]+?\.(png|jpg|jpeg|gif)/)[0],"circles":[]}
            }

            for (var i=0; i<share.circles.length; i++){
                for (var j=0; j<share.circles[i].circles.length; j++){
                    if(typeof share.circles[i].circles[j].radius == 'object'){
                        share.circles[i].circles[j].radius = share.circles[i].circles[j].radius[map_size]
                    }
                }
            }

            let map_load = new Promise((resolve,reject) => {
                changeMap(document.getElementById(share['map']),share['url'])
                resolve("Map loaded")
            })

            Promise.all([map_load])
            .then(x => {
                setTimeout(() => {
                    var cur_map = document.getElementById("cur-map")
                    var ratio = cur_map.height/cur_map.naturalHeight
                                
                    for(var circ of share['circles']){
                        if(circ['angle'] === false)
                            drawCircles(-3000,-3000,"circles",circ['circles'],true)
                        else
                            drawAngles(-3000,-3000,"circles",circ['circles'],true)
                        for(child of document.getElementById(`circles`).children){
                            $(child).show()
                            if (child.id.includes("-left")){
                                child.style.transform = `translate(${Math.round(circ['x']*ratio) - 5}px,${Math.round(circ['y']*ratio) - $(child).height() - 8}px) rotate(${parseInt(circ['angle'])-10}deg)`
                            }
                            else if (child.id.includes("-right")){
                                child.style.transform = `translate(${Math.round(circ['x']*ratio) + 1}px,${Math.round(circ['y']*ratio) - $(child).height() - 3}px) rotate(${parseInt(circ['angle'])+10}deg)`
                            }
                            else{
                                child.style.transform = `translate(${Math.round(circ['x']*ratio) - ($(child).width()/2) - 3}px,${Math.round(circ['y']*ratio) - ($(child).height()/2) - 3}px)`
                            }
                        }
                        document.getElementById("placed_circles").innerHTML += document.getElementById(`circles`).innerHTML
                        document.getElementById(`circles`).innerHTML = ""
                    }

                    $("#flash_message").fadeOut(500,() => {$("#flash_message").innerHTML = ""})
                    
                },1000)
            })
            .then(() => {
                drawSpots()
            })
        }
        else{
            $("#flash_message").hide()
            $("#flash_message").innerHTML = ""
            drawSpots()
        }
        if (params.get("jlid")){
            link(params.get("jlid"),params.get("pos"))
        }
        return
    })
}