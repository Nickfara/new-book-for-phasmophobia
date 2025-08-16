let discord_user = {}

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
}
function getLink(){
    try{
        let d = getCookie("discord_link")
        if(d){
            discord_user = JSON.parse(getCookie("discord_link"))
            document.getElementById("discord_avatar").src = `https://cdn.discordapp.com/avatars/${discord_user['id']}/${discord_user['avatar']}`
            $("#discord_avatar").addClass("avatar")
            document.getElementById("discord_name").innerHTML = `${discord_user['username']}<br><div class="logout" onclick="unlink();">Logout</div>`
            $("#discord_login").hide()
            $("#discord_name").show()
            $("#discord-save").show()
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