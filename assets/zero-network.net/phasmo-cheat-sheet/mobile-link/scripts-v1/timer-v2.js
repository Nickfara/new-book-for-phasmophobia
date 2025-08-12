const zeroPad = (num, places) => String(num).padStart(places, '0')

var smudge_worker;
var cooldown_worker;
var hunt_worker;

var map_size = 0;
var map_difficulty = 2;
var cursed_hunt = 20;
const map_hunt_lengths = [
    [15+cursed_hunt,30+cursed_hunt,40+cursed_hunt],
    [20+cursed_hunt,40+cursed_hunt,50+cursed_hunt],
    [30+cursed_hunt,50+cursed_hunt,60+cursed_hunt]
];


function updateMapSize(size){
    map_size = {"S":0,"M":1,"L":2}[size]
}

function updateMapDifficulty(difficulty, cust_hunt_length){
    if(difficulty.match(/[0-9]{4}-[0-9]{4}-[0-9]{4}/g))
        map_difficulty = {"0":2,"1":2,"2":2,"3":2,"3I":1,"3A":0}[cust_hunt_length]
    else
        map_difficulty = {"0":2,"1":2,"2":2,"3":2,"3I":1,"3A":0}[["-5","-1"].includes(difficulty) ? cust_hunt_length : difficulty]}

function toggle_timer(force_start = false, force_stop = false){

    if(force_start){
        if($("#smudge").hasClass("playing")){
            smudge_worker.terminate();
            start_timer()
        }
        else{
            $("#smudge").addClass("playing")
            start_timer()
        }
    }

    else if(force_stop){
        if($("#smudge").hasClass("playing")){
            $("#smudge").removeClass("playing")
            smudge_worker.terminate();
        }
    }

    else if($("#smudge").hasClass("playing")){
        $("#smudge").removeClass("playing")
        smudge_worker.terminate();
    }

    else{
        $("#smudge").addClass("playing")
        start_timer()
    }
}

function start_timer(){

    var time = 180 +1
    var prev_t = ""

    var deadline = new Date(Date.now() + time *1000);
    var time_obj = document.getElementById("smudge")

    function progress() {
        var t = deadline - Date.now();
        var dt = t;
        var timeleft = Math.floor(t / 1000);

        // t = (181*1000) - t
        dt = t

        var minutes = Math.floor((t % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((t % (1000 * 60)) / 1000);
        var d_minutes = Math.floor((dt % (1000 * 60 * 60)) / (1000 * 60));
        var d_seconds = Math.floor((dt % (1000 * 60)) / 1000);

        min_val = t<0 ? "00" : zeroPad(minutes,2);
        sec_val = t<0 ? "00" : zeroPad(seconds,2);
        d_min_val = t<0 ? "00" : zeroPad(d_minutes,2);
        d_sec_val = t<0 ? "00" : zeroPad(d_seconds,2);
        d_val = `${d_min_val[1]}:${d_sec_val}`
        if(prev_t != d_val){
            time_obj.innerHTML = `${min_val}:${sec_val}`
            prev_t = d_val
        }

        if(timeleft <= 0){
            smudge_worker.terminate();
            $("#smudge").removeClass("playing")
        }
    };

    const blob = new Blob([`(function(e){setInterval(function(){this.postMessage(null)},100)})()`])
    const url = window.URL.createObjectURL(blob)
    smudge_worker = new Worker(url)
    smudge_worker.onmessage = () => {
        progress()
    }
}

function toggle_cooldown_timer(force_start = false, force_stop = false){
    if(force_start){
        if($("#cooldown").hasClass("playing")){
            cooldown_worker.terminate();
            start_cooldown_timer();
        }
        else{
            $("#cooldown").addClass("playing")
            start_cooldown_timer()
        }
    }

    else if(force_stop){
        if($("#cooldown").hasClass("playing")){
            $("#cooldown").removeClass("playing")
            cooldown_worker.terminate();
        }
    }

    else if($("#cooldown").hasClass("playing")){
        $("#cooldown").removeClass("playing")
        cooldown_worker.terminate();
    }
    else{
        $("#cooldown").addClass("playing")
        start_cooldown_timer()
    }
}

function start_cooldown_timer(){
    var time = 25 +1
    var prev_t = ""

    var deadline = new Date(Date.now() + time *1000);
    var time_obj = document.getElementById("cooldown")
    
    function progress() {
        var t = deadline - Date.now();
        var timeleft = Math.floor(t / 1000);
        // t = (26*1000) - t

        var minutes = Math.floor((t % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((t % (1000 * 60)) / 1000);

        min_val = t<0 ? "00" : zeroPad(minutes,2);
        sec_val = t<0 ? "00" : zeroPad(seconds,2);
        d_val = `${min_val[1]}:${sec_val}`
        if(prev_t != d_val){
            time_obj.innerHTML = `${min_val}:${sec_val}`
            prev_t = d_val
        }

        if(timeleft <= 0){
            cooldown_worker.terminate();
            $("#cooldown").removeClass("playing")
        }
    };

    const blob = new Blob([`(function(e){setInterval(function(){this.postMessage(null)},100)})()`])
    const url = window.URL.createObjectURL(blob)
    cooldown_worker = new Worker(url)
    cooldown_worker.onmessage = () => {
        progress()
    }
}

function toggle_hunt_timer(force_start = false, force_stop = false){
    if(force_start){
        if($("#hunt").hasClass("playing")){
            hunt_worker.terminate();
            start_hunt_timer();
        }
        else{
            $("#hunt").addClass("playing")
            start_hunt_timer()
        }
    }

    else if(force_stop){
        if($("#hunt").hasClass("playing")){
            $("#hunt").removeClass("playing")
            hunt_worker.terminate();
        }
    }

    else if($("#hunt").hasClass("playing")){
        $("#hunt").removeClass("playing")
        hunt_worker.terminate();
    }
    else{
        $("#hunt").addClass("playing")
        start_hunt_timer()
    }
}

function start_hunt_timer(){
    var time = map_hunt_lengths[map_difficulty][map_size] +1;
    var prev_t = ""

    var deadline = new Date(Date.now() + time *1000);
    var time_obj = document.getElementById("hunt")
    
    function progress() {
        var t = deadline - Date.now();
        var dt = t;
        var timeleft = Math.floor(t / 1000);

        // t = ((map_hunt_lengths[map_difficulty][map_size]+1)*1000) - t
        dt = t

        var minutes = Math.floor((t % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((t % (1000 * 60)) / 1000);
        var d_minutes = Math.floor((dt % (1000 * 60 * 60)) / (1000 * 60));
        var d_seconds = Math.floor((dt % (1000 * 60)) / 1000);

        min_val = t<0 ? "00" : zeroPad(minutes,2);
        sec_val = t<0 ? "00" : zeroPad(seconds,2);
        d_min_val = t<0 ? "00" : zeroPad(d_minutes,2);
        d_sec_val = t<0 ? "00" : zeroPad(d_seconds,2);
        d_val = `${d_min_val[1]}:${d_sec_val}`
        if(prev_t != d_val){
            time_obj.innerHTML = `${min_val}:${sec_val}`
            prev_t = d_val
        }

        if(timeleft <= 0){
            hunt_worker.terminate();
            $("#hunt").removeClass("playing")
        }
    };

    const blob = new Blob([`(function(e){setInterval(function(){this.postMessage(null)},100)})()`])
    const url = window.URL.createObjectURL(blob)
    hunt_worker = new Worker(url)
    hunt_worker.onmessage = () => {
        progress()
    }
}