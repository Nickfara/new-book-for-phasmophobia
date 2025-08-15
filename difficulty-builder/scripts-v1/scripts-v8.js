function getCookie(e){let t=e+"=",i=decodeURIComponent(document.cookie).split(";");for(let n=0;n<i.length;n++){let o=i[n];for(;" "==o.charAt(0);)o=o.substring(1);if(0==o.indexOf(t))return o.substring(t.length,o.length)}return""}
function setCookie(e,t,i){let n=new Date;n.setTime(n.getTime()+864e5*i);let o="expires="+n.toUTCString();document.cookie=e+"="+t+";"+o+";path=/"}

const ops_lookup = {
    "eq":"&#61;",
    "gt":"&#62;",
    "gteq":"&#8805;",
    "lt":"&#60;",
    "lteq":"&#8804;",
    "neq":"&#8800;"
}

const parser = new DOMParser();

var all_settings;
var global_conflict_message = ""

function round(number, precision){
    const v = Math.pow(10, Number(precision) + 2)
    return (Number(number) + (1/v)).toFixed(precision)
}

function show_conflict(id,event){

    if(id[1] !== 's'){     
        let option = document.getElementById(id)  
        let set = id[0]=="p" ? all_settings.player[id] : id[0]=="g" ? all_settings.ghost[id] : all_settings.contract[id]
        let mod = set.options[option.value]

        let conflict_reasons = []
        if(mod.hasOwnProperty("global")){
 
            mod.global.conditions.forEach(cond => {
                let ext = cond['setting']
                let op = cond['op']

                if(cond.hasOwnProperty("setting2")){
                    let ext2 = cond['setting2']
                    if(calculate(document.getElementById(ext).value,op,document.getElementById(ext2).value))
                        conflict_reasons.push(`${document.getElementById(ext+"-title").innerHTML.split(":")[0]} ${ops_lookup[op]} ${document.getElementById(ext2+"-title").innerHTML.split(":")[0]}`)
                }
                else{
                    let val = cond['value']
                    if(calculate(document.getElementById(ext).value,op,val))
                        conflict_reasons.push(`${document.getElementById(ext+"-title").innerHTML.split(":")[0]} ${ops_lookup[op]} ${val}`)
                }
            })

            document.getElementById("hover_info").innerHTML = `Multiplier is being reduced by:<br>${conflict_reasons.join('<br>')}`
        }

        if(mod.hasOwnProperty('halved_at')){
            document.getElementById("hover_info").innerHTML = `Additional multipliers above x${mod.halved_at} will only add<br>50% of their values`
        }

        if(mod.hasOwnProperty('max')){
            document.getElementById("hover_info").innerHTML = `Multiplier is being clamped by:<br>${document.getElementById(option.id+"-title").innerHTML.split(":")[0]} = ${option.value}`
        }
    }

    let conflict_div = $("#hover_info")
    conflict_div.css({
        top: Math.min(window.scrollY + window.innerHeight - conflict_div.height() - 20,Math.max(window.scrollY,window.scrollY + event.clientY - conflict_div.height() - 25)), 
        left: Math.min(window.innerWidth - conflict_div.width() - 20,Math.max(0,event.clientX - (conflict_div.width()/4)))
    })
    conflict_div.show()
}

function show_global_conflict(event){

    if(global_conflict_message === "")
        return

    document.getElementById("hover_info").innerHTML = global_conflict_message

    let conflict_div = $("#hover_info")
    conflict_div.css({
        top: Math.min(window.scrollY + window.innerHeight - conflict_div.height() - 20,Math.max(window.scrollY,window.scrollY + event.clientY - conflict_div.height() - 25)), 
        left: Math.min(window.innerWidth - conflict_div.width() - 20,Math.max(0,event.clientX - (conflict_div.width()/4)))
    })
    conflict_div.show()
}

function move_conflict(event){
    let conflict_div = $("#hover_info")
    conflict_div.css({
        top: Math.min(window.scrollY + window.innerHeight - conflict_div.height() - 20,Math.max(window.scrollY,window.scrollY + event.clientY - conflict_div.height() - 25)), 
        left: Math.min(window.innerWidth - conflict_div.width() - 20,Math.max(0,event.clientX - (conflict_div.width()/4)))
    })
}

function hide_conflict(){
    $("#hover_info").hide()
}

function load_custom(){
    fetch("https://nickfara.github.io/new-book-for-phasmophobia/phasmo-cheat-sheet/difficulty-builder/data/settings.json")
    .then(data => data.json())
    .then(data => {
        all_settings = data

        let player_html = ""
        Object.entries(data['player']).forEach(([id,value]) => {
            player_html += `
                <div id="${id}-title" class="option_title">${value.setting}:<img id="${id}-icon" class="option-icon" src="imgs/warn.png" style="display:none;" onmouseenter="show_conflict('${id}',event);" onmousemove="move_conflict(event);" onmouseout="hide_conflict();"></div>
                <select class="option_picker" name="${id}" id="${id}" onchange="calculate_difficulty();clear_controls();">
                ${build_options(value.options)}
                </select><br>
            `
        })

        document.getElementById("player_data").innerHTML = player_html;

        let ghost_html = ""
        Object.entries(data['ghost']).forEach(([id,value]) => {
            ghost_html += `
                <div id="${id}-title" class="option_title">${value.setting}:<img id="${id}-icon" class="option-icon" src="imgs/warn.png" style="display:none;" onmouseenter="show_conflict('${id}',event);" onmousemove="move_conflict(event);" onmouseout="hide_conflict();"></div>
                <select class="option_picker" name="${id}" id="${id}" onchange="calculate_difficulty();clear_controls();">
                ${build_options(value.options)}
                </select><br>
            `
        })

        document.getElementById("ghost_data").innerHTML = ghost_html;

        let contract_html = ""
        Object.entries(data['contract']).forEach(([id,value]) => {
            contract_html += `
                <div id="${id}-title" class="option_title">${value.setting}:<img id="${id}-icon" class="option-icon" src="imgs/warn.png" style="display:none;" onmouseenter="show_conflict('${id}',event);" onmousemove="move_conflict(event);" onmouseout="hide_conflict();"></div>
                <select class="option_picker" name="${id}" id="${id}" onchange="calculate_difficulty();clear_controls();">
                ${build_options(value.options)}
                </select><br>
            `
        })

        document.getElementById("contract_data").innerHTML = contract_html;
    })
    .then(() => {
        parse_url()
    })
    .then(() => {
        calculate_difficulty()
    })
    .then(() => {
        getLink()
    })
}

function build_options(options){
    let options_html = ""
    Object.entries(options).forEach(([id, value]) => {
        options_html += `
            <option value="${id}"${value.hasOwnProperty("default") ? 'selected="selected"' : ''}>${id}</option>
        `
    })
    return options_html
}

function unique_options(id,options,selected){
    let select = document.getElementById(id)
    let di = 0;

    for (let i = 0; i < select.options.length; i++) {
        if(select.options[i].value === selected)
            di = i
        select.options[i].disabled = false
        if(options.includes(select.options[i].value)){
            if(select.options[i].selected){
                select.selectedIndex = di
            }
            select.options[i].disabled = true
        }
    }
}

function calculate_difficulty(){
    let difficulty = 1.0
    let multiplier = 1.0
    let max_mod = 20.00
    let halved_at = 15.00
    let halved_at_message = ""
    let max_mod_message = ""
    let post_checks = []

    let options = document.getElementById("player_data").querySelectorAll("select")
    options.forEach(option => {
        if(!all_settings.player.hasOwnProperty(option.id))
            return

        let set = all_settings.player[option.id]
        let mod = all_settings.player[option.id].options[option.value]
        let alt_modifier = 20.00
        let num_subsettings = 0

        if(mod.hasOwnProperty('subsetting'))
            num_subsettings = parseInt(mod['subsetting'])

        $(option).removeClass(['increase','decrease','conflict','clamp'])
        $(document.getElementById(`${option.id}-icon`)).hide()

        if(mod.hasOwnProperty('halved_at')){
            if (mod.halved_at < halved_at){
                halved_at = mod.halved_at
                halved_at_message = `${set.setting} = ${option.value}<br>Additional multipliers above x${mod.halved_at} will only add<br>50% of their values`
            }
            post_checks.push({"id":option.id,"value":mod.halved_at,"class":"conflict","image":"imgs/warn.png"})
        }

        if(mod.hasOwnProperty("global")){
            let is_and = mod.global.op ?? 'or' === 'and'
            let cond_met = is_and ? true : false
            mod.global.conditions.forEach(cond => {
                let ext = cond['setting']
                let op = cond['op']

                if(cond.hasOwnProperty("setting2")){
                    let ext2 = cond['setting2']
                    if(calculate(document.getElementById(ext).value,op,document.getElementById(ext2).value)){
                        if(!is_and) cond_met = true
                    }
                    else{
                        if(is_and) cond_met = false
                    }     
                }
                else{
                    let val = cond['value']
                    if(calculate(document.getElementById(ext).value,op,val)){
                        if(!is_and) cond_met = true 
                    }
                    else{
                        if(is_and) cond_met = false
                    }
                }
            }) 
            if(cond_met)
                alt_modifier = parseFloat(mod.global['modifier'])
        }

        if(mod.hasOwnProperty('type') && mod.type === "mult"){
            multiplier *= parseFloat(alt_modifier === 20.00 ? mod.modifier : alt_modifier)
            if(alt_modifier !== 20.00 && alt_modifier < mod.modifier) {
                $(option).addClass('conflict')
                $(document.getElementById(`${option.id}-icon`)).attr("src","imgs/warn.png")
                $(document.getElementById(`${option.id}-icon`)).show()
            }
            if(mod.modifier > 1.00) $(option).addClass('increase')
            if(mod.modifier < 1.00) $(option).addClass('decrease')
        }
        else{
            difficulty += parseFloat(alt_modifier === 20.00 ? mod.modifier : alt_modifier)
            if(alt_modifier !== 20.00 && alt_modifier < mod.modifier) {
                $(option).addClass('conflict')
                $(document.getElementById(`${option.id}-icon`)).attr("src","imgs/warn.png")
                $(document.getElementById(`${option.id}-icon`)).show()
            }
            if(mod.modifier > 0.00) $(option).addClass('increase')
            if(mod.modifier < 0.00) $(option).addClass('decrease')
        }

        if(mod.hasOwnProperty('max')){
            if(mod.max <= max_mod){
                max_mod_message = `Multiplier is being clamped by:<br>${document.getElementById(option.id+"-title").innerHTML.split(":")[0]} = ${option.value}`
                max_mod = Math.min(max_mod,parseFloat(mod.max))
            }
            post_checks.push({"id":option.id,"value":mod.max,"class":"clamp","image":"imgs/clamp.png"})
        }

        // Check for subsettings
        if(set.hasOwnProperty('subsettings')){
            let selected = []
            let selected_default = ""
            let prev_obj = option
            for (var i = 0; i < set.max_subsettings; i++){
                Object.entries(set.subsettings).forEach(([id,value]) => {
                    if(i < num_subsettings){
                        if(!document.getElementById(`${id}--${i}`)){
                            let temp_title = parser.parseFromString(`<div class="option_title" id="${id}--${i}-label">${value.setting}${value.hasOwnProperty('index') && value.index === true ? " #"+(i+1): ''}:<img id="${id}--${i}-icon" class="option-icon" src="imgs/warn.png" style="display:none;" onmouseenter="show_conflict('${id}--${i}',event);" onmousemove="move_conflict(event);" onmouseout="hide_conflict();"></div>`, 'text/html');

                            let player_html = `
                                <select class="option_picker" name="${id}" id="${id}--${i}" onchange="calculate_difficulty();clear_controls();">
                                ${build_options(value.options)}
                                </select><br>
                            `
                            let temp_option = parser.parseFromString(player_html,"text/html")

                            prev_obj.after(temp_option.body.firstChild)
                            prev_obj.after(temp_title.body.firstChild)

                            prev_obj = document.getElementById(`${id}--${i}`)
                        }

                        let sub_value = document.getElementById(`${id}--${i}`).value
                        let sub_mod = all_settings.player[option.id].subsettings[id].options[sub_value]
                        let sub_alt_modifier = 20.00

                        if(sub_mod.hasOwnProperty('default') && sub_mod.default === true)
                            selected_default = sub_value

                        if(value.hasOwnProperty('unique') && value.unique === true){
                            unique_options(`${id}--${i}`,selected,selected_default)
                            if(sub_value !== selected_default)
                                selected.push(sub_value)
                        }
                        
                        if(sub_mod.hasOwnProperty('halved_at'))
                            halved_at = sub_mod['halved_at']

                        if(sub_mod.hasOwnProperty("global")){
                            let sub_is_and = sub_mod.global.op ?? 'or' === 'and'
                            let sub_cond_met = sub_is_and ? true : false
                            sub_mod.global.conditions.forEach(cond => {
                                let sub_ext = cond['setting']
                                let sub_op = cond['op']

                                if(cond.hasOwnProperty("setting2")){
                                    let sub_ext2 = cond['setting2']
                                    if(calculate(document.getElementById(sub_ext).value,sub_op,document.getElementById(sub_ext2).value)){
                                        if(!sub_is_and) sub_cond_met = true
                                    }
                                    else{
                                        if(sub_is_and) sub_cond_met = false
                                    }     
                                }
                                else{
                                    let sub_val = cond['value']
                                    if(calculate(document.getElementById(sub_ext).value,sub_op,sub_val)){
                                        if(!sub_is_and) sub_cond_met = true
                                    }
                                    else{
                                        if(sub_is_and) sub_cond_met = false
                                    }
                                }
                            }) 
                            if(sub_cond_met)
                                sub_alt_modifier = parseFloat(sub_mod.global['modifier'])
                        }

                        let sub_option = document.getElementById(`${id}--${i}`)
                        $(sub_option).removeClass(['increase','decrease','conflict','clamp'])
                        $(document.getElementById(`${id}--${i}-icon`)).hide()
                        if(sub_mod.hasOwnProperty('type') && sub_mod.type === "mult"){
                            multiplier *= parseFloat(sub_alt_modifier === 20.00 ? sub_mod.modifier : sub_alt_modifier)
                            if(sub_alt_modifier !== 20.00 && sub_alt_modifier < sub_mod.modifier) {
                                $(sub_option).addClass('conflict')
                                $(document.getElementById(`${id}--${i}-icon`)).attr("src","imgs/warn.png")
                                $(document.getElementById(`${id}--${i}-icon`)).show()
                            }
                            if(sub_mod.modifier > 1.00) $(sub_option).addClass('increase')
                            if(sub_mod.modifier < 1.00) $(sub_option).addClass('decrease')
                        }
                        else{
                            difficulty += parseFloat(sub_alt_modifier === 20.00 ? sub_mod.modifier : sub_alt_modifier)
                            if(sub_alt_modifier !== 20.00 && sub_alt_modifier < sub_mod.modifier) {
                                $(sub_option).addClass('conflict')
                                $(document.getElementById(`${id}--${i}-icon`)).attr("src","imgs/warn.png")
                                $(document.getElementById(`${id}--${i}-icon`)).show()
                            }
                            if(sub_mod.modifier > 0.00) $(sub_option).addClass('increase')
                            if(sub_mod.modifier < 0.00) $(sub_option).addClass('decrease')
                        }

                        if(sub_mod.hasOwnProperty('max')){
                            max_mod = Math.min(max_mod,parseFloat(sub_mod.max))
                            $(sub_option).removeClass(['increase','decrease','conflict','clamp'])
                            $(sub_option).addClass('clamp')
                            $(document.getElementById(`${id}--${i}-icon`)).attr("src","imgs/clamp.png")
                            $(document.getElementById(`${id}--${i}-icon`)).show()
                        }
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
            
    })

    options = document.getElementById("ghost_data").querySelectorAll("select")
    options.forEach(option => {
        if(!all_settings.ghost.hasOwnProperty(option.id))
            return

        let set = all_settings.ghost[option.id]
        let mod = all_settings.ghost[option.id].options[option.value]
        let alt_modifier = 20.00
        let num_subsettings = 0

        if(mod.hasOwnProperty('subsetting'))
            num_subsettings = parseInt(mod['subsetting'])
        
        $(option).removeClass(['increase','decrease','conflict','clamp'])
        $(document.getElementById(`${option.id}-icon`)).hide()

        if(mod.hasOwnProperty('halved_at')){
            if (mod.halved_at < halved_at){
                halved_at = mod.halved_at
                halved_at_message = `${set.setting} = ${option.value}<br>Additional multipliers above x${mod.halved_at} will only add<br>50% of their values`
            }
            post_checks.push({"id":option.id,"value":mod.halved_at,"class":"conflict","image":"imgs/warn.png"})
        }

        if(mod.hasOwnProperty("global")){
            let is_and = mod.global.op ?? 'or' === 'and'
            let cond_met = is_and ? true : false
            mod.global.conditions.forEach(cond => {
                let ext = cond['setting']
                let op = cond['op']

                if(cond.hasOwnProperty("setting2")){
                    let ext2 = cond['setting2']
                    if(calculate(document.getElementById(ext).value,op,document.getElementById(ext2).value)){
                        if(!is_and) cond_met = true
                    }
                    else{
                        if(is_and) cond_met = false
                    }     
                }
                else{
                    let val = cond['value']
                    if(calculate(document.getElementById(ext).value,op,val)){
                        if(!is_and) cond_met = true 
                    }
                    else{
                        if(is_and) cond_met = false
                    }
                }
            }) 
            if(cond_met)
                alt_modifier = parseFloat(mod.global['modifier'])
        }

        if(mod.hasOwnProperty('type') && mod.type === "mult"){
            multiplier *= parseFloat(alt_modifier === 20.00 ? mod.modifier : alt_modifier)
            if(alt_modifier !== 20.00 && alt_modifier < mod.modifier) {
                $(option).addClass('conflict')
                $(document.getElementById(`${option.id}-icon`)).attr("src","imgs/warn.png")
                $(document.getElementById(`${option.id}-icon`)).show()
            }
            if(mod.modifier > 1.00) $(option).addClass('increase')
            if(mod.modifier < 1.00) $(option).addClass('decrease')
        }
        else{
            difficulty += parseFloat(alt_modifier === 20.00 ? mod.modifier : alt_modifier)
            if(alt_modifier !== 20.00 && alt_modifier < mod.modifier) {
                $(option).addClass('conflict')
                $(document.getElementById(`${option.id}-icon`)).attr("src","imgs/warn.png")
                $(document.getElementById(`${option.id}-icon`)).show()
            }
            if(mod.modifier > 0.00) $(option).addClass('increase')
            if(mod.modifier < 0.00) $(option).addClass('decrease')
        }

        if(mod.hasOwnProperty('max')){
            if(mod.max <= max_mod){
                max_mod_message = `Multiplier is being clamped by:<br>${document.getElementById(option.id+"-title").innerHTML.split(":")[0]} = ${option.value}`
                max_mod = Math.min(max_mod,parseFloat(mod.max))
            }
            post_checks.push({"id":option.id,"value":mod.max,"class":"clamp","image":"imgs/clamp.png"})
        }

        // Check for subsettings
        if(set.hasOwnProperty('subsettings')){
            let selected = []
            let selected_default = ""
            let prev_obj = option
            for (var i = 0; i < set.max_subsettings; i++){
                Object.entries(set.subsettings).forEach(([id,value]) => {
                    if(i < num_subsettings){
                        if(!document.getElementById(`${id}--${i}`)){
                            
                            let temp_title = parser.parseFromString(`<div class="option_title" id="${id}--${i}-label">${value.setting}${value.hasOwnProperty('index') && value.index === true ? " #"+(i+1): ''}:<img id="${id}--${i}-icon" class="option-icon" src="imgs/warn.png" style="display:none;" onmouseenter="show_conflict('${id}--${i}',event);" onmousemove="move_conflict(event);" onmouseout="hide_conflict();"></div>`, 'text/html');

                            let ghost_html = `
                                <select class="option_picker" name="${id}" id="${id}--${i}" onchange="calculate_difficulty();clear_controls();">
                                ${build_options(value.options)}
                                </select><br>
                            `
                            let temp_option = parser.parseFromString(ghost_html,"text/html")

                            prev_obj.after(temp_option.body.firstChild)
                            prev_obj.after(temp_title.body.firstChild)

                            prev_obj = document.getElementById(`${id}--${i}`)
                        }

                        let sub_value = document.getElementById(`${id}--${i}`).value
                        let sub_mod = all_settings.ghost[option.id].subsettings[id].options[sub_value]
                        let sub_alt_modifier = 20.00

                        if(sub_mod.hasOwnProperty('default') && sub_mod.default === true)
                            selected_default = sub_value

                        if(value.hasOwnProperty('unique') && value.unique === true){
                            unique_options(`${id}--${i}`,selected,selected_default)
                            if(sub_value !== selected_default)
                                selected.push(sub_value)
                        }
                        
                        if(sub_mod.hasOwnProperty('halved_at'))
                            halved_at = sub_mod['halved_at']

                        if(sub_mod.hasOwnProperty("global")){
                            let sub_is_and = sub_mod.global.op ?? 'or' === 'and'
                            let sub_cond_met = sub_is_and ? true : false
                            sub_mod.global.conditions.forEach(cond => {
                                let sub_ext = cond['setting']
                                let sub_op = cond['op']

                                if(cond.hasOwnProperty("setting2")){
                                    let sub_ext2 = cond['setting2']
                                    if(calculate(document.getElementById(sub_ext).value,sub_op,document.getElementById(sub_ext2).value)){
                                        if(!sub_is_and) sub_cond_met = true
                                    }
                                    else{
                                        if(sub_is_and) sub_cond_met = false
                                    }     
                                }
                                else{
                                    let sub_val = cond['value']
                                    if(calculate(document.getElementById(sub_ext).value,sub_op,sub_val)){
                                        if(!sub_is_and) sub_cond_met = true
                                    }
                                    else{
                                        if(sub_is_and) sub_cond_met = false
                                    }
                                }
                            }) 
                            if(sub_cond_met)
                                sub_alt_modifier = parseFloat(sub_mod.global['modifier'])
                        }

                        let sub_option = document.getElementById(`${id}--${i}`)
                        $(sub_option).removeClass(['increase','decrease','conflict','clamp'])
                        $(document.getElementById(`${id}--${i}-icon`)).hide()
                        if(sub_mod.hasOwnProperty('type') && sub_mod.type === "mult"){
                            multiplier *= parseFloat(sub_alt_modifier === 20.00 ? sub_mod.modifier : sub_alt_modifier)
                            if(sub_alt_modifier !== 20.00 && sub_alt_modifier < sub_mod.modifier) {
                                $(sub_option).addClass('conflict')
                                $(document.getElementById(`${id}--${i}-icon`)).attr("src","imgs/warn.png")
                                $(document.getElementById(`${id}--${i}-icon`)).show()
                            }
                            if(sub_mod.modifier > 1.00) $(sub_option).addClass('increase')
                            if(sub_mod.modifier < 1.00) $(sub_option).addClass('decrease')
                        }
                        else{
                            difficulty += parseFloat(sub_alt_modifier === 20.00 ? sub_mod.modifier : sub_alt_modifier)
                            if(sub_alt_modifier !== 20.00 && sub_alt_modifier < sub_mod.modifier) {
                                $(sub_option).addClass('conflict')
                                $(document.getElementById(`${id}--${i}-icon`)).attr("src","imgs/warn.png")
                                $(document.getElementById(`${id}--${i}-icon`)).show()
                            }
                            if(sub_mod.modifier > 0.00) $(sub_option).addClass('increase')
                            if(sub_mod.modifier < 0.00) $(sub_option).addClass('decrease')
                        }

                        if(sub_mod.hasOwnProperty('max')){
                            max_mod = Math.min(max_mod,parseFloat(sub_mod.max))
                            $(sub_option).removeClass(['increase','decrease','conflict','clamp'])
                            $(sub_option).addClass('clamp')
                            $(document.getElementById(`${id}--${i}-icon`)).attr("src","imgs/clamp.png")
                            $(document.getElementById(`${id}--${i}-icon`)).show()
                        }
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

    })

    options = document.getElementById("contract_data").querySelectorAll("select")
    options.forEach(option => {
        if(!all_settings.contract.hasOwnProperty(option.id))
            return
        let set = all_settings.contract[option.id]
        let mod = all_settings.contract[option.id].options[option.value]
        let alt_modifier = 20.00
        let num_subsettings = 0

        if(mod.hasOwnProperty('subsetting'))
            num_subsettings = parseInt(mod['subsetting'])
        
        $(option).removeClass(['increase','decrease','conflict','clamp'])
        $(document.getElementById(`${option.id}-icon`)).hide()

        if(mod.hasOwnProperty('halved_at')){
            if (mod.halved_at < halved_at){
                halved_at = mod.halved_at
                halved_at_message = `${set.setting} = ${option.value}<br>Additional multipliers above x${mod.halved_at} will only add<br>50% of their values`
            }
            post_checks.push({"id":option.id,"value":mod.halved_at,"class":"conflict","image":"imgs/warn.png"})
        }

        if(mod.hasOwnProperty("global")){
            let is_and = mod.global.op ?? 'or' === 'and'
            let cond_met = is_and ? true : false
            mod.global.conditions.forEach(cond => {
                let ext = cond['setting']
                let op = cond['op']

                if(cond.hasOwnProperty("setting2")){
                    let ext2 = cond['setting2']
                    if(calculate(document.getElementById(ext).value,op,document.getElementById(ext2).value)){
                        if(!is_and) cond_met = true
                    }
                    else{
                        if(is_and) cond_met = false
                    }     
                }
                else{
                    let val = cond['value']
                    if(calculate(document.getElementById(ext).value,op,val)){
                        if(!is_and) cond_met = true 
                    }
                    else{
                        if(is_and) cond_met = false
                    }
                }
            }) 
            if(cond_met)
                alt_modifier = parseFloat(mod.global['modifier'])
        }

        if(mod.hasOwnProperty('type') && mod.type === "mult"){
            multiplier *= parseFloat(alt_modifier === 20.00 ? mod.modifier : alt_modifier)
            if(alt_modifier !== 20.00 && alt_modifier < mod.modifier) {
                $(option).addClass('conflict')
                $(document.getElementById(`${option.id}-icon`)).attr("src","imgs/warn.png")
                $(document.getElementById(`${option.id}-icon`)).show()
            }
            if(mod.modifier > 1.00) $(option).addClass('increase')
            if(mod.modifier < 1.00) $(option).addClass('decrease')
        }
        else{
            difficulty += parseFloat(alt_modifier === 20.00 ? mod.modifier : alt_modifier)
            if(alt_modifier !== 20.00 && alt_modifier < mod.modifier) {
                $(option).addClass('conflict')
                $(document.getElementById(`${option.id}-icon`)).attr("src","imgs/warn.png")
                $(document.getElementById(`${option.id}-icon`)).show()
            }
            if(mod.modifier > 0.00) $(option).addClass('increase')
            if(mod.modifier < 0.00) $(option).addClass('decrease')
        }

        if(mod.hasOwnProperty('max')){
            if(mod.max <= max_mod){
                max_mod_message = `Multiplier is being clamped by:<br>${document.getElementById(option.id+"-title").innerHTML.split(":")[0]} = ${option.value}`
                max_mod = Math.min(max_mod,parseFloat(mod.max))
            }
            post_checks.push({"id":option.id,"value":mod.max,"class":"clamp","image":"imgs/clamp.png"})
        }

        // Check for subsettings
        if(set.hasOwnProperty('subsettings')){
            let selected = []
            let selected_default = ""
            let prev_obj = option
            for (var i = 0; i < set.max_subsettings; i++){
                Object.entries(set.subsettings).forEach(([id,value]) => {
                    if(i < num_subsettings){
                        if(!document.getElementById(`${id}--${i}`)){
                            let temp_title = parser.parseFromString(`<div class="option_title" id="${id}--${i}-label">${value.setting}${value.hasOwnProperty('index') && value.index === true ? " #"+(i+1): ''}:<img id="${id}--${i}-icon" class="option-icon" src="imgs/warn.png" style="display:none;" onmouseenter="show_conflict('${id}--${i}',event);" onmousemove="move_conflict(event);" onmouseout="hide_conflict();"></div>`, 'text/html');

                            let contract_html = `
                                <select class="option_picker" name="${id}" id="${id}--${i}" onchange="calculate_difficulty();clear_controls();">
                                ${build_options(value.options)}
                                </select><br>
                            `
                            let temp_option = parser.parseFromString(contract_html,"text/html")

                            prev_obj.after(temp_option.body.firstChild)
                            prev_obj.after(temp_title.body.firstChild)

                        }
                        prev_obj = document.getElementById(`${id}--${i}`)

                        let sub_value = document.getElementById(`${id}--${i}`).value
                        let sub_mod = all_settings.contract[option.id].subsettings[id].options[sub_value]
                        let sub_alt_modifier = 20.00

                        if(sub_mod.hasOwnProperty('default') && sub_mod.default === true)
                            selected_default = sub_value

                        if(value.hasOwnProperty('unique') && value.unique === true){
                            unique_options(`${id}--${i}`,selected,selected_default)
                            if(sub_value !== selected_default)
                                selected.push(sub_value)
                        }
                        
                        if(sub_mod.hasOwnProperty('halved_at'))
                            halved_at = sub_mod['halved_at']

                        if(sub_mod.hasOwnProperty("global")){
                            let sub_is_and = sub_mod.global.op ?? 'or' === 'and'
                            let sub_cond_met = sub_is_and ? true : false
                            sub_mod.global.conditions.forEach(cond => {
                                let sub_ext = cond['setting']
                                let sub_op = cond['op']

                                if(cond.hasOwnProperty("setting2")){
                                    let sub_ext2 = cond['setting2']
                                    if(calculate(document.getElementById(sub_ext).value,sub_op,document.getElementById(sub_ext2).value)){
                                        if(!sub_is_and) sub_cond_met = true
                                    }
                                    else{
                                        if(sub_is_and) sub_cond_met = false
                                    }     
                                }
                                else{
                                    let sub_val = cond['value']
                                    if(calculate(document.getElementById(sub_ext).value,sub_op,sub_val)){
                                        if(!sub_is_and) sub_cond_met = true
                                    }
                                    else{
                                        if(sub_is_and) sub_cond_met = false
                                    }
                                }
                            }) 
                            if(sub_cond_met)
                                sub_alt_modifier = parseFloat(sub_mod.global['modifier'])
                        }

                        let sub_option = document.getElementById(`${id}--${i}`)
                        $(sub_option).removeClass(['increase','decrease','conflict','clamp'])
                        $(document.getElementById(`${id}--${i}-icon`)).hide()
                        if(sub_mod.hasOwnProperty('type') && sub_mod.type === "mult"){
                            multiplier *= parseFloat(sub_alt_modifier === 20.00 ? sub_mod.modifier : sub_alt_modifier)
                            if(sub_alt_modifier !== 20.00 && sub_alt_modifier < sub_mod.modifier) {
                                $(sub_option).addClass('conflict')
                                $(document.getElementById(`${id}--${i}-icon`)).attr("src","imgs/warn.png")
                                $(document.getElementById(`${id}--${i}-icon`)).show()
                            }
                            if(sub_mod.modifier > 1.00) $(sub_option).addClass('increase')
                            if(sub_mod.modifier < 1.00) $(sub_option).addClass('decrease')
                        }
                        else{
                            difficulty += parseFloat(sub_alt_modifier === 20.00 ? sub_mod.modifier : sub_alt_modifier)
                            if(sub_alt_modifier !== 20.00 && sub_alt_modifier < sub_mod.modifier) {
                                $(sub_option).addClass('conflict')
                                $(document.getElementById(`${id}--${i}-icon`)).attr("src","imgs/warn.png")
                                $(document.getElementById(`${id}--${i}-icon`)).show()
                            }
                            if(sub_mod.modifier > 0.00) $(sub_option).addClass('increase')
                            if(sub_mod.modifier < 0.00) $(sub_option).addClass('decrease')
                        }

                        if(sub_mod.hasOwnProperty('max')){
                            max_mod = Math.min(max_mod,parseFloat(sub_mod.max))
                            $(sub_option).removeClass(['increase','decrease','conflict','clamp'])
                            $(sub_option).addClass('clamp')
                            $(document.getElementById(`${id}--${i}-icon`)).attr("src","imgs/clamp.png")
                            $(document.getElementById(`${id}--${i}-icon`)).show()
                        }
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
        
    })

    let pre_edit_modifier = round(difficulty*multiplier,2)
    let final_modifier = Math.min(15.00,Math.max(0.00,max_mod === 20.00 ? difficulty*multiplier : Math.min(max_mod,difficulty*multiplier)))

    if(halved_at !== 15.00 && final_modifier > halved_at)
        final_modifier = halved_at + ((final_modifier-halved_at)*0.5)

    final_modifier = round(final_modifier,2)

    document.getElementById("multiplier-value").innerText = `x${final_modifier}`

    post_checks.forEach(obj => {
        if((obj.class !== "clamp" && obj.value <= final_modifier) || (obj.class === "clamp" && ((obj.value < pre_edit_modifier && obj.value <= max_mod)|| obj.value <= 1.00))){
            $(document.getElementById(`${obj.id}`)).removeClass(['increase', 'decrease', 'conflict', 'clamped'])
            $(document.getElementById(`${obj.id}`)).addClass(obj.class)
            $(document.getElementById(`${obj.id}-icon`)).attr("src",obj.image)
            $(document.getElementById(`${obj.id}-icon`)).show()
        }
    })

    $("#multiplier-value").removeClass(['global-conflict','global-clamp'])
    if(max_mod !== 20.00 && pre_edit_modifier > max_mod){
        $("#multiplier-value").addClass('global-clamp')
        global_conflict_message = max_mod_message
    }
    else if(halved_at !== 15.00 && final_modifier > halved_at){
        $("#multiplier-value").addClass('global-conflict')
        global_conflict_message = halved_at_message
    }
    else{
        global_conflict_message = ""
    }

    if(final_modifier >= 15.00){
        $("#apoc-icon").attr("src","imgs/apoc3.png")
        $("#apoc-icon").show()
    }
    else if(final_modifier >= 10.00){
        $("#apoc-icon").attr("src","imgs/apoc2.png")
        $("#apoc-icon").show()
    }
    else if(final_modifier >= 6.00){
        $("#apoc-icon").attr("src","imgs/apoc1.png")
        $("#apoc-icon").show()
    }
    else{
        $("#apoc-icon").hide()
    }
}

function calculate(value1,op,value2){
    if(op === "eq")
        return value1 === value2
    if(op === "gt")
        return parseFloat(value1) > parseFloat(value2)
    if(op === "gteq")
        return parseFloat(value1) >= parseFloat(value2)
    if(op === "lt")
        return parseFloat(value1) < parseFloat(value2)
    if(op === "lteq")
        return parseFloat(value1) <= parseFloat(value2)
    if(op === "neq")
        return value1 !== value2

    return false
}

function build_url(){
    let share_url = window.location.href.split('?')[0] + "?share="
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
        share_url += data['data']
        document.getElementById("url_id_input").value = data['data']
        navigator.clipboard.writeText(share_url)
    })
    .catch(err => {
        console.error(err)
    })
}

function parse_url(){
    params = new URL(window.location.href).searchParams
    if (params.get("id")){
        discord_link = {
            "id":params.get("id"),
            "username":params.get("username"),
            "avatar":params.get("avatar"),
            "last_linked":params.get("last_linked")
        }
        setCookie("discord_link",JSON.stringify(discord_link),30)
        window.location.href = window.location.href.split("?")[0]
        $("#saved-title").hide()
        $("#delete-ids").show()
    }
    var short_url = getCookie("custom-id")
    
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

    if (params.get("share") || short_url){
        short_url = params.get('share') ? params.get('share') : short_url
        setCookie("custom-id",short_url,30)
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
                                            <select class="option_picker" name="${id}" id="${id}--${i}" onchange="calculate_difficulty();clear_controls();">
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
            document.getElementById("saved-ids").value = short_url
            document.getElementById("url_id_input").value = short_url
            calculate_difficulty()
        })
        .catch(err => {
            console.error(err)
        })
        .finally(() => {
            let url = new URL(window.location.href)
            url.searchParams.delete("share")
            history.replaceState(history.state,"",url.href)
            $("#flash_message").fadeOut(500,() => {$("#flash_message").innerHTML = ""})
        })

        
    }
    else{
        $("#flash_message").hide()
        $("#flash_message").innerHTML = ""
    }
}

function flash_message(message){
    document.getElementById("flash_message").innerText = message
    $("#flash_message").fadeIn(500,function () {
        $("#flash_message").delay(500).fadeOut(500);
    });
}

function verify_delete(){
    let dif_name = document.getElementById("saved-ids").options[document.getElementById("saved-ids").selectedIndex].text

    document.getElementById("url-to-delete").innerText = dif_name

    $("#verify_delete").fadeIn(500)
}

function close_delete(){
    $("#verify_delete").fadeOut(500)
}

function run_delete(){
    let discord_id = discord_user.id
    let url_id = document.getElementById("saved-ids").value
    fetch(`https://nickfara.github.io/new-book-for-phasmophobia/zn/difficulties/${discord_id}/${url_id}`, {method:"DELETE",signal: AbortSignal.timeout(6000)})
    .then(data => {
        $(`#saved-ids option[value='${url_id}']`).remove();
        url_id = "3296-6279-3676"
        document.getElementById("saved-ids").value = url_id
        document.getElementById("name_input").value = ""
        setCookie("custom-id",url_id,30)
        load_difficulty("saved-ids")
    })

    $("#verify_delete").fadeOut(500)
}