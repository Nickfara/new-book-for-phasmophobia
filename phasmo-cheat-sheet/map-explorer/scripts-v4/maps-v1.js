function getCookie(e){let t=e+"=",i=decodeURIComponent(document.cookie).split(";");for(let n=0;n<i.length;n++){let o=i[n];for(;" "==o.charAt(0);)o=o.substring(1);if(0==o.indexOf(t))return o.substring(t.length,o.length)}return""}
function setCookie(e,t,i){let n=new Date;n.setTime(n.getTime()+864e5*i);let o="expires="+n.toUTCString();document.cookie=e+"="+t+";"+o+";path=/"}

var ppm = 22.5;
var prev_ratio = 0;
var circles = []
var share_data = {"map":"tanglewood","url":"http://localhost:8000/phasmophobia/static/imgs/maps/tanglewood.png","circles":[]}
var selected_ranges = []
var nodes = []
var cur_selected = ""
var is_angle = false
var cur_rotation = 0
var selection_changed = true
var show_labels = false
var animate_labels = false
var show_fill = false
var show_spots = {
    "official": false,
    "unofficial": false,
    "cursed_objects": false,
    "panorama": false
}
var isFirefox = !!!window.chrome
var premap = "tanglewood"
const textDecoder = new TextDecoder()

var user_settings = {"show_labels":0,"animate_labels":0,"show_fill":0,"show_spots":0}

function titleCase(str) {
    return str
        .toLowerCase() // Convert the string to lowercase first
        .split(' ') // Split the string into an array of words
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize the first letter of each word
        .join(' '); // Join the words back together
}

function mapTo3D(a_x, a_y, b_x, b_y) {
    
    ang = Math.atan(Math.abs(a_x - b_x)/Math.abs(a_y - b_y)) * 180 / Math.PI

    if(a_x>b_x){
        if(a_y>b_y){
            ang = ang * -1
        }
        else{
            ang = -180 + ang
        }
    }
    else{
        if(a_y>b_y){
            ang = ang
        }
        else{
            ang = 180 - ang
        }
    }

    return ang
}

function drawSpots(id = null){

    spot_html = ""

    if(show_spots.official || show_spots.unofficial || show_spots.cursed_objects || show_spots.panorama){

        if (id === null){
            id = document.getElementsByClassName("selected_map")[0].id
        }
        var cur_map = document.getElementById("cur-map")
        var ratio = cur_map.height/cur_map.naturalHeight
        
        if (all_spots.hasOwnProperty(id)){
            nodes = []

            if ('requestIdleCallback' in window) {
                requestIdleCallback(() => {
                    all_spots[id].forEach(spot => {
                        if (!preload.hasOwnProperty(spot.image) && spot.type === 'panorama') {
                            const preimage = new Image();
                            preimage.src = spot.image;
                            preload[spot.image] = preimage;
                        }
                    });
                });
            } else {
                // fallback for older browsers
                setTimeout(() => {
                    all_spots[id].forEach(spot => {
                        if (!preload.hasOwnProperty(spot.image) && spot.type === 'panorama') {
                            const preimage = new Image();
                            preimage.src = spot.image;
                            preload[spot.image] = preimage;
                        }
                    });
                }, 0);
            }

            all_spots[id].forEach(spot => {
                if (show_spots[spot.type]){
                    if (spot.type == 'panorama'){
                        spot_html += `
                            <div id="${spot['node-id']}" class="spot-icon" style="position: absolute; top: ${(spot.y*ratio)-12.5}px; left: ${(spot.x*ratio)-12.5}px; background-image: url('imgs/${spot.type}.png');" onclick="showPanorama('${spot.image}','${spot['node-id']}')"></div>
                        `

                        if (spot.mapping && spot.mapping.hasOwnProperty("links")){
                            node_links = []
                            spot.mapping['links'].forEach((node) => {
                                if (node.hasOwnProperty('pseudoX')){
                                    to_x = node.pseudoX
                                    to_y = node.pseudoY
                                }
                                else{
                                    let s = all_spots[id].find(n => n['node-id'] == node.nodeId)
                                    to_x = s.mapping.hasOwnProperty('pseudoX') ? s.mapping.pseudoX : s.x
                                    to_y = s.mapping.hasOwnProperty('pseudoY') ? s.mapping.pseudoY : s.y
                                }
                                let yaw = mapTo3D(spot.x, spot.y, to_x, to_y)
                                node['position'] = {yaw:yaw * Math.PI / 180, pitch:-15*Math.PI/180}
                                node['target'] = { pitch: 0 }
                                node_links.push(node)
                            })

                            node_name = spot.image.split("/").pop().replace(".webp","")
                            node_name = node_name.replace(node_name.split("-")[0],"").replaceAll("-"," ")

                            nodes.push({
                                id: spot['node-id'],
                                panorama: spot.image,
                                name: titleCase(node_name),
                                links: node_links,
                                sphereCorrection: spot.mapping.hasOwnProperty('sc') ? {pan: spot.mapping['sc']*Math.PI/180} : null
                            })
                        }
                    }
                    else if (spot.type == 'official')
                        spot_html += `
                            <div class="spot" style="position: absolute; top: ${(spot.y*ratio)-12.5}px; left: ${(spot.x*ratio)-12.5}px; background-image: url('imgs/${spot.type}.png');" onmouseover="showSpot(this,'${spot.image}')" onmouseout="hideSpot()"></div>
                        `
                    else
                        spot_html += `
                            <div class="${spot.type == 'cursed_objects' ? 'spot-blank' : 'spot'}" style="position: absolute; top: ${(spot.y*ratio)-(spot.type == 'cursed_objects' ? 7.5 : 12.5)}px; left: ${(spot.x*ratio)-(spot.type == 'cursed_objects' ? 7.5 : 12.5)}px; background-image: url('imgs/${spot.type}.png');" onmouseover="showSpotSingle(this,'${spot.image}',${spot.rating})" onmouseout="hideSpot()"></div>
                        `   
                        
                    if (!preload.hasOwnProperty(spot.image) && show_spots[spot.type] && spot.type != 'panorama'){
                        const preimage = new Image()
                        preimage.src = spot.image
                        preload[spot.image] = preimage
                    }
                            
                }
            });
        }
    }

    document.getElementById("touch-pad").innerHTML = spot_html
}

function showSpot(elem,url){

    let hover = document.getElementById("spot-panel")
    let elem_rect = elem.getBoundingClientRect()

    let contain = $("#map-area")
    let sp_panel = $("#spot-panel")

    // Top-Left
    if(elem_rect.top <= (contain.height()/2) && elem_rect.left <= (contain.width()/2)){
        hover.style.top = `${elem_rect.top + 30}px`
        hover.style.left = `${Math.min(elem_rect.left + 30,contain.width() - sp_panel.width() - 20)}px`
    }

    // Top-Right
    else if(elem_rect.top <= (contain.height()/2) && elem_rect.left > (contain.width()/2)){
        hover.style.top = `${elem_rect.top  + 30}px`
        hover.style.left = `${Math.max(elem_rect.left - sp_panel.width() - 15,0)}px`
    }

    // Bottom-Left
    else if(elem_rect.top > (contain.height()/2) && elem_rect.left <= (contain.width()/2)){
        hover.style.top = `${elem_rect.top - sp_panel.height() - 20}px`
        hover.style.left = `${Math.min(elem_rect.left + 30,contain.width() - sp_panel.width() - 20)}px`
    }

    // Bottom-Right
    else if(elem_rect.top > (contain.height()/2) && elem_rect.left > (contain.width()/2)){
        hover.style.top = `${elem_rect.top - sp_panel.height() - 20}px`
        hover.style.left = `${Math.max(elem_rect.left - sp_panel.width() - 15,0)}px`
    }

    $("#spot-image").attr("src",preload[url].src)
    $("#spot-panel").show()
}

function showSpotSingle(elem,url,rating=null){

    let hover = document.getElementById("spot-panel-single")
    let elem_rect = elem.getBoundingClientRect()

    let contain = $("#map-area")
    let sp_panel = $("#spot-panel-single")

    // Top-Left
    if(elem_rect.top <= (contain.height()/2) && elem_rect.left <= (contain.width()/2)){
        hover.style.top = `${elem_rect.top + 30}px`
        hover.style.left = `${Math.min(elem_rect.left + 30,contain.width() - sp_panel.width() - 20)}px`
    }

    // Top-Right
    else if(elem_rect.top <= (contain.height()/2) && elem_rect.left > (contain.width()/2)){
        hover.style.top = `${elem_rect.top  + 30}px`
        hover.style.left = `${Math.max(elem_rect.left - sp_panel.width() - 15,0)}px`
    }

    // Bottom-Left
    else if(elem_rect.top > (contain.height()/2) && elem_rect.left <= (contain.width()/2)){
        hover.style.top = `${elem_rect.top - sp_panel.height() - 20}px`
        hover.style.left = `${Math.min(elem_rect.left + 30,contain.width() - sp_panel.width() - 20)}px`
    }

    // Bottom-Right
    else if(elem_rect.top > (contain.height()/2) && elem_rect.left > (contain.width()/2)){
        hover.style.top = `${elem_rect.top - sp_panel.height() - 20}px`
        hover.style.left = `${Math.max(elem_rect.left - sp_panel.width() - 15,0)}px`
    }

    if (rating != null){
        $("#spot-single-rating").attr("src",`imgs/${rating}-star.png`)
        $("#spot-single-rating").show()
    }
    else{
        $('#spot-single-rating').hide()
    }

    $("#spot-image-single").attr("src",preload[url].src)
    $("#spot-panel-single").show()
}

function hideSpot(){
    $("#spot-panel").hide()
    $("#spot-image").attr("src","imgs/blank.png")
    $("#spot-panel-single").hide()
    $("#spot-image-single").attr("src","imgs/blank-single.png")
}

function showPanorama(url,node_id){
    console.log(`Node ID: ${node_id}`)
    if(!automated){
        window.tour.setNodes(nodes,node_id)
        $("#v360-viewer").css("z-index","20")
        $("#v360-viewer").fadeIn(500)
        $("#v360-close").fadeIn(500)
        $("#v360-bright").fadeIn(500)
        $("#v360-contrast").fadeIn(500)
        var cur_map = document.getElementsByClassName("selected_map")[0].id
    }
}

function hidePanorama(){
    $("#v360-contrast").fadeOut(500)
    $("#v360-bright").fadeOut(500)
    $("#v360-close").fadeOut(500)
    $("#v360-viewer").fadeOut(500)
    setTimeout(() => {
        $("#v360-viewer").css("z-index","-1")
    },500)
}

function v360_filter(elem){
    let b = elem.id == "v360-slider"   ? elem : document.getElementById("v360-slider")
    let c = elem.id == "v360-contrast-slider" ? elem : document.getElementById("v360-contrast-slider")
    $("#v360-viewer").css("filter",`brightness(${b.value/100}) contrast(${c.value/100})`)
}

function changeMap(elem,url){
    hidePanorama()
    $(".maps_button").removeClass("selected_map")
    $(elem).addClass("selected_map")
    document.getElementById("cur-map").src = url
    placed_circles = ""
    document.getElementById("circles").innerHTML = ""
    document.getElementById("placed_circles").innerHTML = ""
    document.getElementById("warning").style.display = "none"
    try { share_data['map'] = elem.id } catch (e) {}
    share_data['url'] = url
    clear_maps()
    drawSpots(elem.id)
}

function place(elem,e){

    var cur_map = document.getElementById("cur-map")
    var ratio = cur_map.naturalHeight/cur_map.height
    console.log(`Actual: (${e.offsetX},${e.offsetY})`)
    console.log(`Intrinsic: (${Math.round(e.offsetX*ratio)},${Math.round(e.offsetY*ratio)})`)

    if(circles.length < 2){
        return
    }

    var cur_map = document.getElementById("cur-map")
    var ratio = cur_map.naturalHeight/cur_map.height

    share_data['circles'].push({"x":Math.round(e.offsetX*ratio), "y":Math.round(e.offsetY*ratio), "set":cur_selected, "angle":is_angle ? cur_rotation : false})

    for(circle of document.getElementById("circles").children){
        if (child.id.includes("-left")){
            child.style.transform = `translate(${Math.round(e.offsetX) - 5}px,${Math.round(e.offsetY) - $(child).height() - 8}px) rotate(${cur_rotation-10}deg)`
        }
        else if (child.id.includes("-right")){
            child.style.transform = `translate(${Math.round(e.offsetX) + 1}px,${Math.round(e.offsetY) - $(child).height() - 3}px) rotate(${cur_rotation+10}deg)`
        }
        else if ($(child).hasClass("square")){
            child.style.transform = `translate(${e.offsetX - ($(child).width()/2) - 3}px,${e.offsetY - ($(child).height()/2) - 3}px) rotate(${cur_rotation}deg)`
        }
        else{
            child.style.transform = `translate(${e.offsetX - ($(child).width()/2) - 3}px,${e.offsetY - ($(child).height()/2) - 3}px)`
        }
    }

    placed_circles += document.getElementById("circles").innerHTML 
    document.getElementById("placed_circles").innerHTML += document.getElementById("circles").innerHTML 
    document.getElementById("circles").innerHTML = ""
    
    selected_ranges = []
    cur_selected = ""
    selection_changed = true
    clearstate()
}

function hideRadius(){
    for(var i = 0; i < circles.length; i++){
        var circle = document.getElementById("circles").querySelector(`#${circles[i]}`)
        $(circle).hide()
    }
    selection_changed = true
}

var prev_znc_state = 1
function mapRadiusMove(elem,e){
    for(child of document.getElementById(`circles`).children){
        $(child).show()

        let offsetX = Math.round(e.clientX - elem.parentElement.offsetLeft - elem.offsetLeft)
        let offsetY = Math.round(e.clientY - elem.parentElement.offsetTop - elem.offsetTop)

        if (child.id.includes("-left")){
            child.style.transform = `translate(${offsetX - 5}px,${offsetY - $(child).height() - 8}px) rotate(${cur_rotation-10}deg)`
        }
        else if (child.id.includes("-right")){
            child.style.transform = `translate(${offsetX + 1}px,${offsetY - $(child).height() - 3}px) rotate(${cur_rotation+10}deg)`
        }
        else if ($(child).hasClass("square")){
            child.style.transform = `translate(${offsetX - ($(child).width()/2) - 3}px,${offsetY - ($(child).height()/2) - 3}px) rotate(${cur_rotation}deg)`
        }
        else{
            child.style.transform = `translate(${offsetX - ($(child).width()/2) - 3}px,${offsetY - ($(child).height()/2) - 3}px)`
        }
    }
}

function rotate(elem,event) {
    if(event.wheelDelta < 0)
        cur_rotation = (cur_rotation + 5) % 360
    else
        cur_rotation -= 5
        cur_rotation = cur_rotation < 0 ? 360 + cur_rotation : cur_rotation
}

function drawAngles(x,y,id="circles",ranges=null,redraw=false){
    is_angle = true
    var cur_map = document.getElementById("cur-map")
    var ratio = cur_map.height/cur_map.naturalHeight
    cur_rotation = 0
    document.getElementById("warning").style.display = "none"

    ranges_to_draw = ranges == null ? selected_ranges : ranges

    if (prev_ratio != ratio || selection_changed || redraw){
        var nppm = ratio * ppm
        var circle_html = `<div id="center-dot" class="center-dot"></div>`
        if (ranges == null)
            circles = ["center-dot"]

        for(var i = 0; i < ranges_to_draw.length; i++){
            var d = nppm * ranges_to_draw[i]['radius']

            var circle_id = ranges_to_draw[i]['name'].toLowerCase().replaceAll(" ","-").replaceAll(".","").replaceAll("/","").replaceAll("(","").replaceAll(")","").replaceAll("{","").replaceAll("}","")
            if (ranges == null)
                circles.push(circle_id)  

            circle_html += `<div class="angle ${show_fill ? "" : "hide-back"}" id="${circle_id}-left" style="display:none; width:${d}px; height:${d}px; transform-origin: 3px calc(100% + 2px); border-left:solid 5px black; border-top:solid 5px black; color:${ranges_to_draw[i]['label_col']}; background-color:${ranges_to_draw[i]['background']}; z-index:${20-Math.round(ranges_to_draw[i]['radius'])+1};">`
            circle_html += `<div class="angle-label" style="color:${ranges_to_draw[i]['color']};">${ranges_to_draw[i]['name']}</div>`
            circle_html += `<div class="angle-viz ${show_fill ? "" : "hide-back"}" id="${circle_id}-viz-left" style="width:calc(100% + 2px); height:calc(100% + 1px); border-left:${ranges_to_draw[i]['border']}; border-top:${ranges_to_draw[i]['border']}; color:${ranges_to_draw[i]['label_col']}; background-color:${ranges_to_draw[i]['background']}; z-index:${20-Math.round(ranges_to_draw[i]['radius'])}; top:-4px; left:-4px;"></div>`
            for(var j = 0; j < ranges_to_draw[i]['major'].length; j++){
                var md = nppm * ranges_to_draw[i]['major'][j]
                circle_html += `<div class="angle-viz ${show_fill ? "" : "hide-back"}" style="width:${md}px; height:${md}px; border-top:${ranges_to_draw[i]['major_border']}; color:${ranges_to_draw[i]['label_col']}; background-color:${ranges_to_draw[i]['background']}; z-index:${20-Math.round(ranges_to_draw[i]['major'][j])+1}; left:0; bottom:0;"><div class="angle-label" style="color:${ranges_to_draw[i]['major_label_color']};">${ranges_to_draw[i]['major_labels'][j]}</div></div>`
                circle_html += `<div class="angle-viz ${show_fill ? "" : "hide-back"}" style="width:${md-1}px; height:${md-1}px; border-top:solid 5px black; color:${ranges_to_draw[i]['label_col']}; background-color:${ranges_to_draw[i]['background']}; z-index:${20-Math.round(ranges_to_draw[i]['major'][j])}; left:0; bottom:0;"></div>`
            }
            for(var j = 0; j < ranges_to_draw[i]['minor'].length; j++){
                var md = nppm * ranges_to_draw[i]['minor'][j]
                circle_html += `<div class="angle-viz ${show_fill ? "" : "hide-back"}" style="width:${md}px; height:${md}px; border-top:${ranges_to_draw[i]['minor_border']}; color:${ranges_to_draw[i]['label_col']}; background-color:${ranges_to_draw[i]['background']}; z-index:${20-Math.round(ranges_to_draw[i]['minor'][j])+1}; left:0; bottom:0;"><div class="angle-label" style="color:${ranges_to_draw[i]['minor_label_color']};">${ranges_to_draw[i]['minor_labels'][j]}</div></div>`
                circle_html += `<div class="angle-viz ${show_fill ? "" : "hide-back"}" style="width:${md-1}px; height:${md-1}px; border-top:solid 5px black; color:${ranges_to_draw[i]['label_col']}; background-color:${ranges_to_draw[i]['background']}; z-index:${20-Math.round(ranges_to_draw[i]['minor'][j])}; left:0; bottom:0;"></div>`
            }
            circle_html += `</div>`

            circle_html += `<div class="angle ${show_fill ? "" : "hide-back"}" id="${circle_id}-right" style="display:none; width:${d}px; height:${d}px; transform-origin: -2px calc(100% - 3px); border-right:solid 5px black; border-bottom:solid 5px black; color:${ranges_to_draw[i]['label_col']}; background-color:${ranges_to_draw[i]['background']}; z-index:${20-Math.round(ranges_to_draw[i]['radius'])+1};">`
            circle_html += `<div class="angle-viz ${show_fill ? "" : "hide-back"}" id="${circle_id}-viz-right" style="width:calc(100% + 1px); height:calc(100% + 2px); border-right:${ranges_to_draw[i]['border']}; border-bottom:${ranges_to_draw[i]['border']}; color:${ranges_to_draw[i]['label_col']}; background-color:${ranges_to_draw[i]['background']}; z-index:${20-Math.round(ranges_to_draw[i]['radius'])}; top:-1px;"></div>`
            for(var j = 0; j < ranges_to_draw[i]['major'].length; j++){
                var md = nppm * ranges_to_draw[i]['major'][j]
                circle_html += `<div class="angle-viz ${show_fill ? "" : "hide-back"}" style="width:${md}px; height:${md}px; border-right:${ranges_to_draw[i]['major_border']}; color:${ranges_to_draw[i]['label_col']}; background-color:${ranges_to_draw[i]['background']}; z-index:${20-Math.round(ranges_to_draw[i]['major'][j])+1}; left:0; bottom:0;"></div>`
                circle_html += `<div class="angle-viz ${show_fill ? "" : "hide-back"}" style="width:${md-1}px; height:${md-1}px; border-right:solid 5px black; color:${ranges_to_draw[i]['label_col']}; background-color:${ranges_to_draw[i]['background']}; z-index:${20-Math.round(ranges_to_draw[i]['major'][j])}; left:0; bottom:0;"></div>`
            }
            // for(var j = 0; j < ranges_to_draw[i]['minor'].length; j++){
            //     var md = nppm * ranges_to_draw[i]['minor'][j]
            //     circle_html += `<div class="angle-viz ${show_fill ? "" : "hide-back"}" style="width:${md}px; height:${md}px; border-right:${ranges_to_draw[i]['minor_border']}; color:${ranges_to_draw[i]['label_col']}; background-color:${ranges_to_draw[i]['background']}; z-index:${20-Math.round(ranges_to_draw[i]['minor'][j])+1}; left:0; bottom:0;"></div>`
            //     circle_html += `<div class="angle-viz ${show_fill ? "" : "hide-back"}" style="width:${md-1}px; height:${md-1}px; border-right:solid 5px black; color:${ranges_to_draw[i]['label_col']}; background-color:${ranges_to_draw[i]['background']}; z-index:${20-Math.round(ranges_to_draw[i]['minor'][j])}; left:0; bottom:0;"></div>`
            // }
            circle_html += `</div>`
        }

        document.getElementById(id).innerHTML = circle_html
        prev_ratio = ratio
        if (ranges == null)
            selection_changed = false
    }

    // for(var i = 0; i < circles.length; i++){
    //     var circle = document.getElementById("circles").querySelector(`#${circles[i]}`)
    //     $(circle).show()
    // }
}

function drawCircles(x,y,id="circles",ranges=null,redraw=false){
    is_angle = false
    var cur_map = document.getElementById("cur-map")
    var ratio = cur_map.height/cur_map.naturalHeight
    var map_size = document.getElementsByClassName("selected_map")[0].firstElementChild.innerText
    document.getElementById("warning").style.display = "none"

    ranges_to_draw = ranges == null ? selected_ranges : ranges

    if (prev_ratio != ratio || selection_changed || redraw){
        var nppm = ratio * ppm
        var circle_html = `<div id="center-dot" class="center-dot"></div>`
        if (ranges == null)
            circles = ["center-dot"]

        let show_warn = false
        for(var i = 0; i < ranges_to_draw.length; i++){

            if(ranges_to_draw[i].hasOwnProperty('warn') && ranges_to_draw[i].warn.includes(map_size)){
                show_warn = true
            }

            var w = nppm * ranges_to_draw[i]['radius'] * 2

            var circle_id = ranges_to_draw[i]['name'].toLowerCase().replaceAll(" ","-").replaceAll(".","").replaceAll("/","").replaceAll("(","").replaceAll(")","").replaceAll("{","").replaceAll("}","")

            if (ranges == null)
                circles.push(circle_id)  

            if(ranges_to_draw[i].type == "square")
                circle_html += `<div class="square ${show_fill ? "" : " hide-back"}" id="${circle_id}" style="display:none; width:${w}px; height:${w}px; border:${ranges_to_draw[i]['border']}; color:${ranges_to_draw[i]['label_col']}; background-color:${ranges_to_draw[i]['background']}; z-index:${20-Math.round(ranges_to_draw[i]['radius'])+1}; margin: 1 0 0 1;">`
            else
                circle_html += `<div class="radius ${show_fill ? "" : " hide-back"}" id="${circle_id}" style="display:none; width:${w}px; height:${w}px; border:${ranges_to_draw[i]['border']}; color:${ranges_to_draw[i]['label_col']}; background-color:${ranges_to_draw[i]['background']}; z-index:${20-Math.round(ranges_to_draw[i]['radius'])+1};">`
            
            if(ranges_to_draw[i].type != "square"){
                if(isFirefox){
                    circle_html += `<div class="radius_label_ff" style="${show_labels ? "" : "display: none; "}color:${ranges_to_draw[i]['label_col']};">${ranges_to_draw[i]['name'].replace("{{m}}",parseFloat(ranges_to_draw[i]['radius']).toString())}</div>`
                }
                else{
                    circle_html += `<div data-splitting class="${ranges_to_draw[i]['label_pos'] == "out" ? 'radius_label' : 'radius_label_in'}${animate_labels ? " animate_label" : ""}" style="${show_labels ? "" : "display: none; "}color:${ranges_to_draw[i]['label_col']};">${ranges_to_draw[i]['name'].replace("{{m}}",parseFloat(ranges_to_draw[i]['radius']).toString()).replace("{{m}}",parseFloat(ranges_to_draw[i]['radius']).toString())}</div>`
                }
            }
            circle_html += `</div>`


            if (ranges == null)
                circles.push(circle_id+"-viz")

            if(ranges_to_draw[i].type == "square")
                circle_html += `<div class="square ${ranges_to_draw[i]['label_pos'] == "out" ? 'radius-alt' : 'radius-alt-in'}${show_fill ? "" : " hide-back"}" id="${circle_id}-viz" style="display:none; width:calc(${w}px - 1px); height:calc(${w}px - 1px); border:solid 3px black; background-color:${ranges_to_draw[i]['background']}; z-index:${20-Math.round(ranges_to_draw[i]['radius'])}; margin: -1 0 0 -1;">`
            else
                circle_html += `<div class="radius ${ranges_to_draw[i]['label_pos'] == "out" ? 'radius-alt' : 'radius-alt-in'}${show_fill ? "" : " hide-back"}" id="${circle_id}-viz" style="display:none; width:calc(${w}px - 2px); height:calc(${w}px - 2px); border:solid 5px black; background-color:${ranges_to_draw[i]['background']}; z-index:${20-Math.round(ranges_to_draw[i]['radius'])}; margin: -2 0 0 -2;">`

            if(!isFirefox && !ranges_to_draw[i]['single_label'] && ranges_to_draw[i].type != "square"){
                circle_html += `<div data-splitting class="${ranges_to_draw[i]['label_pos'] == "out" ? 'radius_label_alt' : 'radius_label_alt_in'}${animate_labels ? " animate_label" : ""}" style="${show_labels ? "" : "display: none; "}color:${ranges_to_draw[i]['label_col']};">${ranges_to_draw[i]['name'].replace("{{m}}",parseFloat(ranges_to_draw[i]['radius']).toString())}</div>`
            }
            circle_html += `</div>`
        }

        if(show_warn){
            document.getElementById("warning").style.display = "flex"
        }

        document.getElementById(id).innerHTML = circle_html
        prev_ratio = ratio
        if (ranges == null)
            selection_changed = false

        if(isFirefox){
            setTimeout(function() {
                Splitting({
                    whitespace: true
                })
                $('[data-splitting]').removeAttr("data-splitting")
            }, 0)
        }
        else{
            Splitting({
                whitespace: true
            })
            $('[data-splitting]').removeAttr("data-splitting")
        }
    }

    for(var i = 0; i < circles.length; i++){
        var circle = document.getElementById("circles").querySelector(`#${circles[i]}`)
        $(circle).show()
        circle.style.transform = `translate(${x - ($(circle).width()/2) - 3}px,${y - ($(circle).height()/2) - 3}px)`
    }
}



function clearstate(){
    var checkboxes = document.getElementsByClassName("checkbox");
    cur_selected = ""
    for(var i = 0; i < checkboxes.length; i++){
        $(checkboxes[i]).removeClass("good")
        $(checkboxes[i]).addClass("neutral")
    }

    if(show_labels){
        var checkbox = $("#show_labels").find(".checkbox");
        checkbox.removeClass("neutral")
        checkbox.addClass("good")
    }
    if(animate_labels){
        var checkbox = $("#animate_labels").find(".checkbox");
        checkbox.removeClass("neutral")
        checkbox.addClass("good")
    }
    if(show_fill){
        var checkbox = $("#show_fill").find(".checkbox");
        checkbox.removeClass("neutral")
        checkbox.addClass("good")
    }
}

function dualstate(elem, radio = false, sibling_class = null){
    var checkbox = $(elem).find(".checkbox");
    var siblings = document.getElementById("range-list").querySelectorAll(sibling_class)

    if (checkbox.hasClass("neutral")){
        checkbox.removeClass("neutral")
        checkbox.addClass("good")
        if(radio){
            for(var i=0;i<siblings.length;i++){
                if(elem != siblings[i]){
                    $(siblings[i]).find(".checkbox").removeClass("good")
                    $(siblings[i]).find(".checkbox").addClass("neutral")
                }
            }
        }
    }
    else if (checkbox.hasClass("good")){
        checkbox.removeClass("good")
        checkbox.addClass("neutral")
    }
}

function add_range(elem, radio = false, sibling_class = null){
    cur_selected = elem.value
    var checkbox = $(elem).find(".checkbox");
    var siblings = document.getElementById("range-list").querySelectorAll(sibling_class)
    var map_size = document.getElementsByClassName("selected_map")[0].firstElementChild.innerText

    if (checkbox.hasClass("neutral")){
        selected_ranges = selected_ranges.filter(value => !ranges[elem.value].map(v => v.name).includes(value.name))
    }
    else if (checkbox.hasClass("good")){
        var ranges_to_add = JSON.parse(JSON.stringify(ranges[elem.value]))
        for(var i = 0; i < ranges_to_add.length; i++){
            if (typeof ranges_to_add[i].radius == 'object'){
                ranges_to_add[i].radius = ranges_to_add[i].radius[map_size]
            }
        }
        selected_ranges = selected_ranges.concat(ranges_to_add)
        if(radio){
            for(var i=0;i<siblings.length;i++){
                if(elem != siblings[i]){
                    selected_ranges = selected_ranges.filter(value => !ranges[siblings[i].value].map(v => v.name).includes(value.name))
                }
            }
        }
    }
    selection_changed = true
}

function toggleSpots(elem, spot_type){
    show_spots[spot_type] = elem.checked
    drawSpots()
}

function showLabels(elem){
    var checkbox = $(elem).find(".checkbox");

    if (checkbox.hasClass("neutral")){
        show_labels = false
        $(".radius_label").hide()
        $(".radius_label_alt").hide()
        $(".radius_label_in").hide()
        $(".radius_label_alt_in").hide()
        $(".radius_label_ff").hide()
    }
    else if (checkbox.hasClass("good")){
        show_labels = true
        $(".radius_label").show()
        $(".radius_label_alt").show()
        $(".radius_label_in").show()
        $(".radius_label_alt_in").show()
        $(".radius_label_ff").show()
    }
    selection_changed = true
    placed_circles = document.getElementById("placed_circles").innerHTML
}

function animateLabels(elem){
    var checkbox = $(elem).find(".checkbox");

    if (checkbox.hasClass("neutral")){
        animate_labels = false
        $(".radius_label").removeClass("animate_label")
        $(".radius_label_alt").removeClass("animate_label")
        $(".radius_label_in").removeClass("animate_label")
        $(".radius_label_alt_in").removeClass("animate_label")
    }
    else if (checkbox.hasClass("good")){
        animate_labels = true
        $(".radius_label").addClass("animate_label")
        $(".radius_label_alt").addClass("animate_label")
        $(".radius_label_in").addClass("animate_label")
        $(".radius_label_alt_in").addClass("animate_label")
    }
    selection_changed = true
    placed_circles = document.getElementById("placed_circles").innerHTML

}

function showFill(elem){
    var checkbox = $(elem).find(".checkbox");

    if (checkbox.hasClass("neutral")){
        show_fill = false
        $(".radius").addClass("hide-back")
    }
    else if (checkbox.hasClass("good")){
        show_fill = true
        $(".radius").removeClass("hide-back")
    }
    selection_changed = true
    placed_circles = document.getElementById("placed_circles").innerHTML

}

function clear_maps(){
    share_data['circles'] = []
    selected_ranges = []
    selection_changed = true
    placed_circles = ""
    document.getElementById("circles").innerHTML = ""
    document.getElementById("circles1").innerHTML = ""
    document.getElementById("circles2").innerHTML = ""
    document.getElementById("circles3").innerHTML = ""
    document.getElementById("circles4").innerHTML = ""
    document.getElementById("placed_circles").innerHTML = ""
    clearstate()
}

function saveSettings(){
    user_settings['show_labels'] = show_labels ? 1 : 0;
    user_settings['animate_labels'] = animate_labels ? 1 : 0;
    user_settings['show_fill'] = show_fill ? 1 : 0;
    Object.entries(show_spots).forEach(([key,value]) => {
        user_settings['show_spots'][key] = value ? 1 : 0;
    })
    setCookie("map_settings",JSON.stringify(user_settings),30)
}

function loadSettings(){
    try{
        user_settings = JSON.parse(getCookie("map_settings"))
    } catch (error) {
        console.error(error)
        user_settings = {"show_labels":0,"animate_labels":0,"show_fill":0,"show_spots":{"official": 0,"unofficial": 0,"cursed_objects": 0,"panorama": 0}}
    }

    show_labels = user_settings['show_labels'] == 1
    animate_labels = user_settings['animate_labels'] == 1
    show_fill = user_settings['show_fill'] == 1

    if (typeof user_settings['show_spots'] === 'number'){
        show_spots.official = user_settings['show_spots'] == 1
        user_settings['show_spots'] = {"official": user_settings['show_spots'],"unofficial": 0,"cursed_objects": 0,"panorama": 0}
        Object.entries(show_spots).forEach(([key,value]) => {
            document.getElementById(key).checked = value == 1
        })
    }
    else{
        Object.entries(user_settings['show_spots']).forEach(([key,value]) => {
            show_spots[key] = value ? 1 : 0;
            document.getElementById(key).checked = value == 1
        })
    }

    setCookie("map_settings",JSON.stringify(user_settings),30)
    clearstate()
}

function flash_message(message){
    document.getElementById("flash_message").innerText = message
    $("#flash_message").fadeIn(500,function () {
        $("#flash_message").delay(500).fadeOut(500);
    });
}