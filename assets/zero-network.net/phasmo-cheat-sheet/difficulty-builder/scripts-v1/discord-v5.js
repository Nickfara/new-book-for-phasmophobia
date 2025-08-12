let discord_user = {}

const pre_built = {
    "Amateur":"4614-5391-2947",
    "Intermediate":"2559-7606-8997",
    "Professional":"3296-6279-3676",
    "Nightmare":"6331-4569-3229",
    "Insanity":"6301-2384-6644",
    "Apocalypse I":"3709-4288-1492",
    "Apocalypse II":"0447-9557-6774",
    "Apocalypse III":"7581-5017-4211"
}

function getLink(){
    try{

        let presets = document.getElementById("saved-ids")
        var opt = document.createElement('option');
        opt.value = "";
        opt.innerHTML = "-----------------";
        opt.disabled = true;
        presets.appendChild(opt);
        Object.entries(pre_built).forEach(([id,value]) => {
            var opt = document.createElement('option');
            opt.value = value;
            opt.innerHTML = id;
            if(id === "Professional"){
                opt.selected = true
                document.getElementById("url_id_input").value = value
            }
            presets.appendChild(opt);
        })
        opt = document.createElement('option');
        opt.value = "";
        opt.innerHTML = "--- My Customs ---";
        opt.disabled = true;
        presets.appendChild(opt);

        let d = getCookie("discord_link")
        if(d){
            discord_user = JSON.parse(getCookie("discord_link"))
            document.getElementById("discord_avatar").src = `https://cdn.discordapp.com/avatars/${discord_user['id']}/${discord_user['avatar']}`
            $("#discord_avatar").addClass("avatar")
            document.getElementById("discord_name").innerHTML = `${discord_user['username']}<br><div class="logout" onclick="unlink();">Logout</div>`
            $("#discord_login").hide()
            $("#discord_name").show()
            $("#discord-save").show()

            fetch(`https://nickfara.github.io/new-book-for-phasmophobia/zn/difficulties/${discord_user['id']}`, {signal: AbortSignal.timeout(6000)})
            .then(data => data.json())
            .then(data => {
                data.forEach(dif => {
                    var opt = document.createElement('option');
                    opt.value = dif.url_id;
                    opt.innerHTML = dif.name;
                    presets.appendChild(opt);
                })
                
            })
            .then(() => {
                document.getElementById("saved-ids").value = document.getElementById("url_id_input").value
            })

            $("#saved-title").hide()
            $("#delete-ids").show()
            document.getElementById("saved-ids").style.marginLeft = "0px"
            document.getElementById("saved-ids").style.width = "calc(100% - 35px)"
        }
    } catch(Error){
        console.error(Error)
    }
}

function unlink(){
    discord_user = {}
    setCookie("discord_link","",-1)
    window.location.href = window.location.href.split("?")[0]
}

function load_difficulty(src){
    let short_url = document.getElementById(src).value

    if ([
        "4614-5391-2947",
        "2559-7606-8997",
        "3296-6279-3676",
        "6331-4569-3229",
        "6301-2384-6644",
        "3709-4288-1492",
        "0447-9557-6774",
        "7581-5017-4211"
    ].includes(short_url)){
        $("#delete-ids").addClass("disabled")
    }
    else{
        $("#delete-ids").removeClass("disabled")
    }

    fetch(`https://nickfara.github.io/new-book-for-phasmophobia/zn/lookup/${short_url}`, {signal: AbortSignal.timeout(6000)})
    .then(data => data.json())
    .then(data => {
        let encoded_data = data['data']

        encoded_data.split(',').forEach(param => {
            let id = param.split('.')[0]
            let value = param.split('.')[1]
            let option = document.getElementById(id)

            for(let i = 0; i < option.options.length; i++) {
                if(option.options[i].value === value) {
                    option.selectedIndex = i
                    break
                }
            }

            if(id[1] !== 's'){       
                let set = id[0]=="p" ? all_settings.player[id] : id[0]=="g" ? all_settings.ghost[id] : all_settings.contract[id]
                let mod = set.options[option.value]
                let num_subsettings = 0

                if(mod.hasOwnProperty('subsetting'))
                    num_subsettings = parseInt(mod['subsetting'])

                // Check for subsettings
                if(set.hasOwnProperty('subsettings')){
                    let prev_obj = option
                    for (var i = 0; i < set.max_subsettings; i++){
                        Object.entries(set.subsettings).forEach(([id,value]) => {
                            if(i < num_subsettings){
                                if(!document.getElementById(`${id}--${i}`)){
                                    let temp_title = parser.parseFromString(`<div class="option_title" id="${id}--${i}-label">${value.setting}${value.hasOwnProperty('index') && value.index === true ? " #"+(i+1): ''}:<img id="${id}--${i}-icon" class="option-icon" src="imgs/warn.png" style="display:none;" onmouseenter="show_conflict('${id}--${i}',event);" onmousemove="move_conflict(event);" onmouseout="hide_conflict();"></div>`, 'text/html');

                                    let contract_html = `
                                        <select class="option_picker" name="${id}" id="${id}--${i}" onchange="calculate_difficulty()">
                                        ${build_options(value.options)}
                                        </select><br>
                                    `
                                    let temp_option = parser.parseFromString(contract_html,"text/html")

                                    prev_obj.after(temp_option.body.firstChild)
                                    prev_obj.after(temp_title.body.firstChild)
                                }
                                prev_obj = document.getElementById(`${id}--${i}`)
                            }
                            else{
                                if(document.getElementById(`${id}--${i}`)){
                                    document.getElementById(`${id}--${i}-label`).remove()
                                    document.getElementById(`${id}--${i}`).remove()
                                }
                            }
                        })
                    }
                }
            }
        })
    })
    .then(() => {
        calculate_difficulty()
        if(src === "saved-ids"){
            document.getElementById("url_id_input").value = short_url
            document.getElementById("name_input").value = ""
        }
            
        if(src === "url_id_input"){
            document.getElementById("saved-ids").value = ""
            document.getElementById("name_input").value = ""
        }
            
    })
    .then(() => {
        setCookie("custom-id",short_url,30)
        flash_message("Loaded!")
    })
    .catch(err => {
        console.error(err)
    })
}

function save_difficulty(){
    let name = document.getElementById("name_input").value

    if(!name){
        flash_message("Please enter a valid name!")
        return
    }

    let encoded_data = ""

    let options = document.getElementById("player_data").querySelectorAll("select")
    options.forEach(option => {
        encoded_data += `${option.id}.${option.value},`
    })

    options = document.getElementById("ghost_data").querySelectorAll("select")
    options.forEach(option => {
        encoded_data += `${option.id}.${option.value},`
    })

    options = document.getElementById("contract_data").querySelectorAll("select")
    options.forEach(option => {
        encoded_data += `${option.id}.${option.value},`
    })

    fetch(`https://nickfara.github.io/new-book-for-phasmophobia/zn/shorten/${encoded_data.slice(0,-1)}`, {signal: AbortSignal.timeout(6000)})
    .then(data => data.json())
    .then(data => {
        let url_id = data['data']
        let discord_id = discord_user.id
        document.getElementById("url_id_input").value = data['data']
        fetch(`https://nickfara.github.io/new-book-for-phasmophobia/zn/difficulties/${discord_id}/${url_id}?name=${encodeURIComponent(name)}`, {method:"POST",signal: AbortSignal.timeout(6000)})
        .then(data => {
            let presets = document.getElementById("saved-ids")
            var opt = document.createElement('option');
            opt.value = url_id;
            opt.innerHTML = name;
            presets.appendChild(opt);

            document.getElementById("saved-ids").value = url_id
            document.getElementById("name_input").value = ""
            setCookie("custom-id",url_id,30)

            flash_message("Difficulty Saved!")
        })
        .catch(err => {
            console.error(err)
        })
        
    })
    .catch(err => {
        console.error(err)
    })
}

function clear_controls(){
    document.getElementById("saved-ids").value = ""
    document.getElementById("name_input").value = ""
    document.getElementById("url_id_input").value = ""
}