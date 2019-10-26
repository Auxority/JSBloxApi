# JSBlox
Roblox JS Library made by Auxority#5595


# Usage
```JS
const JSBlox = require("./JSBlox");
const cookie = require("./cookie.json").cookie;

(async() => {
    let eUser = new JSBlox.User(cookie);
    await eUser.authenticateUser();
    let eGroup = new JSBlox.Group(eUser, 4537409);
    let eGame = new JSBlox.Game(eUser, 771845391);
    let eChat = new JSBlox.Chat(eUser);

    console.log(await eUser.getPlayerInfo());
})();
```
