const request = require("request-promise");
const util = require(`${__dirname}/util.js`);
let [parseJSON, handleError, createRequest, validateId, pageBrowser] = [util.parseJSON, util.handleError, util.createRequest, util.validateId, util.pageBrowser];

class Chat {
    constructor(User) {
        this.user = User;
    }

    /**
     * @returns {Object} Chat settings of the authenticated user
     */
    async getChatSettings() {
        let res = await createRequest("GET", `https://chat.roblox.com/v2/chat-settings`, this.user.cookie);
        if (res) {
            return res;
        }
        return {};
    }

    /**
     * @returns {Array} Conversations
     * @param {Number | Array <number>} conversationIds Roblox conversation ids 
     */
    async getSelectConversations(conversationIds) {
        if (Array.isArray(conversationIds) || typeof(conversationIds) === "number") {
            let queryConversationIds = "";
            if (typeof(conversationIds) !== "number") {
                queryConversationIds = conversationIds.join("&conversationIds=");
            } else if (typeof(conversationIds) === "number") {
                queryConversationIds = conversationIds;
            }
            let jsonResponse = parseJSON(await createRequest("GET", `https://chat.roblox.com/v2/?conversationIds=${queryConversationIds}`, this.user.cookie));
            if (jsonResponse) {
                return jsonResponse;
            }
        } else {
            handleError("getConversations", "Invalid conversation id(s) provided");
        }
        return [];
    }

    /**
     * @returns {Array} Current conversations
     */
    async getConversations() {
        let jsonResponse = parseJSON(await createRequest("GET", `https://chat.roblox.com/v2/get-user-conversations?pageNumber=1&pageSize=100000`, this.user.cookie));
        if (jsonResponse) {
            return jsonResponse;
        }
        return [];
    }

    /**
     * @returns {Array} Messages in the conversation
     * @param {Number} conversationId Roblox conversation id 
     */
    async getMessages(conversationId) {
        if (typeof(conversationId) === "number") {
            let jsonResponse = parseJSON(await createRequest("GET", `https://chat.roblox.com/v2/get-messages?pageSize=100000&conversationId=${conversationId}`, this.user.cookie));
            if (jsonResponse) {
                return jsonResponse;
            }
        } else {
            handleError("getMessages", "Invalid conversation id provided");
        }
        return [];
    }

    /**
     * @returns {Array} Unread messages
     * @param {Number | Array <number>} conversationIds Roblox conversation ids 
     */
    async getUnreadMessages(conversationIds) {
        if (Array.isArray(conversationIds) === true || typeof(conversationIds) === "number") {
            let queryConversationIds = "";
            if (typeof(conversationIds) !== "number") {
                queryConversationIds = conversationIds.join("&conversationIds=");
            } else if (typeof(conversationIds) === "number") {
                queryConversationIds = conversationIds;
            }
            let jsonResponse = await createRequest("GET", `https://chat.roblox.com/v2/get-unread-messages/?conversationIds=${queryConversationIds}&pageSize=100000`, this.user.cookie);
            if (jsonResponse) {
                return jsonResponse;
            }
        } else {
            handleError("getUnreadMessages", "Invalid conversation id(s) provided");
        }
        return [];
    }
    
    /**
     * @returns {Boolean} true / false
     * @param {Array <number>} userIds Roblox user ids
     * @param {String} title Title of chat conversation 
     */
    async createGroupConversation(userIds, title) {
        if (Array.isArray(userIds) === true || typeof(userIds) === "number") {
            let isValidToken = await this.user.validateToken();
            if (isValidToken) {
                if (typeof(title) !== "string") {
                    title = "";
                }
                if (typeof(userIds) === "number") {
                    userIds = [userIds];
                }
                return await createRequest("POST", `https://chat.roblox.com/v2/start-group-conversation`, this.user.cookie, this.user.token, {participantUserIds: userIds, title: title}) !== false;
            }
        }
        handleError("createGroupConversations", "Invalid user id(s) provided");
        return false;
    }
}


class Game {
    /**
     * @param {Class} User Instance of JSBlox User Class
     * @param {Number} UniverseId Roblox universe id
     */
    constructor(User, UniverseId) {
        this.user = User;
        this.id = UniverseId;
    }

    /**
     * @returns {Array} Place Details
     * @param {Object} User JSBlox User object
     * @param {Number | Array <number>} placeIds Roblox place id or place Ids 
     */
    static async getPlaceDetails(User, placeIds) {
        if (Array.isArray(placeIds) === false) {
            if (typeof(placeIds) === "number") {
                placeIds = [placeIds];
            } else {
                return [];
            }
        }
        let queryPlaceIds = placeIds.join("&placeIds=");
        return parseJSON(await createRequest("GET", `https://games.roblox.com/v1/games/multiget-place-details?placeIds=${queryPlaceIds}`, User.cookie));
    }

    /**
     * @returns {Array} Place Details
     * @param {Object} User JSBlox User object
     * @param {Number} placeId Roblox place id
     */
    static async getUniverseId(User, placeId) {
        let placeDetails = await this.getPlaceDetails(User, placeId);
        if (placeDetails && placeDetails.length > 0) {
            return placeDetails[0].universeId;
        }
    }

    /**
     * @returns {Array} Details about the game
     */
    async getDetails() {
        let jsonResponse = parseJSON(await createRequest("GET", `https://games.roblox.com/v1/games`));
        if (jsonResponse) {
            return jsonResponse.data;
        }
        return [];
    }

    /**
     * 
     * @param {Number} placeId Roblox place id
     * @param {String} serverType Public | Friend | VIP
     */
    async getServers(placeId, serverType) {
        if (placeId) {
            serverType = serverType.toLowerCase();
            if (serverType === "public" || serverType === "friend") {
                serverType = serverType[0].toUpperCase() + serverType.slice(1);
            } else if (serverType === "vip") {
                serverType = "VIP";
            } else {
                serverType = "Public";
            }
            let servers = await pageBrowser("GET", `https://games.roblox.com/v1/games/${placeId}/servers/${serverType}?sortOrder=Asc&limit=100`);
            return servers;
        }
        handleError("getServers", "Missing parameters");
        return false;
    }

    /**
     * @returns {Array} Badge info
     * @param {Number} badgeId Roblox badge id
     */
    async getBadgeInfo(badgeId) {
        if (badgeId && typeof(badgeId) === "number") {
            let res = await createRequest("GET", `https://badges.roblox.com/v1/badges/${badgeId}`);
            let jsonResponse = parseJSON(res);
            if (jsonResponse) {
                return jsonResponse;
            }
        }
        return [];
    }

    /**
     * @returns {Boolean} true / false
     * @param {Number} badgeId Roblox badge id
     * @param {String} name New badge name
     * @param {String} description New badge description
     * @param {Boolean} enabled Whether the badge should be enabled or not
     */
    async updateBadge(badgeId, name, description, enabled) {
        if (!enabled || !description || !name || !badgeId) {
            handleError("updateBadge", "Missing arguments");
            return false;
        }
        let isValidToken = await this.user.validateToken();
        if (!isValidToken) {
            return false;
        }
        return await createRequest("PATCH", `https://badges.roblox.com/v1/badges/${badgeId}`, this.user.cookie, this.user.token, {name: name, description: description, enabled: enabled}) !== false;
    }

    /**
     * @returns {Array} Badges of the game
     */
    async getBadges() {
        return await pageBrowser("GET", `https://badges.roblox.com/v1/universes/${this.id}/badges?sortOrder=Asc&limit=100`);
    }

    /**
     * @returns {Array} Media of the game
     */
    async getGameMedia() {
        let res = parseJSON(await createRequest("GET", `https://games.roblox.com/v2/games/${this.id}/media`));
        if (res) {
            return res.data;
        }
        return [];
    }

    /**
     * @returns {Array} Products sold by the game
     */
    async getPaidAccessInfo() {
        let res = parseJSON(await createRequest("GET", `https://games.roblox.com/v1/games/games-product-info?universeIds=${this.id}`));
        if (res) {
            return res.data;
        }
        return [];
    }

    /**
     * @returns {Number} Amount of favorites
     */
    async getFavorites() {
        let jsonResponse = parseJSON(await createRequest("GET", `https://games.roblox.com/v1/games/${this.id}/favorites/count`));
        if (jsonResponse) {
            return jsonResponse.favoritesCount;
        }
        handleError("getFavorites", "Failed to get favorites on the game.");
        return 0;
    }

    /**
     * @returns {Array} All gamepasses made by the game
     */
    async getGamepasses() {
        let gamepasses = pageBrowser("GET", `https://games.roblox.com/v1/games/${this.id}/game-passes?sortOrder=Asc&limit=50`);
        if (gamepasses && Array.isArray(gamepasses)) {
            return gamepasses;
        }
        return [];
    }

    /**
     * Need to check if this works later
     * @returns {Boolean} true / false
     * @param {Number} vipServerId Roblox vip server id
     * @param {String} name New name for the vip server
     * @param {Boolean} renewJoinCode Roblox vip server id
     * @param {Boolean} active Roblox vip server id
     */
    async updateVipServer(vipServerId, newName, activated, renewJoinCode) {
        if (vipServerId && typeof(vipServerId) === "number") {
            let isValidToken = await this.validateToken();
            if (isValidToken) {
                let newSettings = {
                    "name": newName,
                    "newJoinCode": renewJoinCode || false,
                    "active": activated
                };
                if (!newName || typeof(renewJoinCode) !== "boolean" || typeof(active) !== "boolean") {
                    let currentSettings = await this.getVipServer(vipServerId);
                    if (currentSettings && currentSettings.id) {
                        if (!newName) {
                            newSettings.name = currentSettings.name;
                        }
                        if (!activated) {
                            newSettings.active = currentSettings.active;
                        }
                    }
                }
                return await createRequest("PATCH", `https://games.roblox.com/v1/vip-servers/${vipServerId}`, this.user.cookie, this.user.token, newSettings) !== false;
            }
        }
        return {};
    }

    /**
     * Need to check if this works later
     * @returns {Boolean} true / false
     * @param {String} name Name of the vip server
     * @param {Number} price Amount of robux it costs to create a vip server for the specific game 
     */
    async createVipServer(universeId, name, price) {
        let isValidToken = await this.validateToken();
        if (!isValidToken) {
            return false;
        }
        if (universeId && typeof(universeId) === "number" && name && (typeof(name) === "string" || typeof(name) === "number") && price && typeof(price) === "number") {
            return await createRequest("POST", `https://games.roblox.com/v1/games/vip-servers/${universeId}`, this.user.cookie, this.user.token, {name: name, expectedPrice: price}) !== false;
        }
        handleError("createVipServer", "Failed to create vip server because arguments were missing");
        return false;
    }

    /**
     * @returns {Object} Vote information
     */
    async getGameVoteStatus() {
        let jsonResponse = parseJSON(await createRequest("GET", `https://games.roblox.com/v1/games/${this.id}/votes/user`, this.user.cookie));
        if (jsonResponse) {
            return jsonResponse;
        }
        return {};
    }

    /**
     * @returns {Boolean} true / false
     * @param {Boolean} isLiked Whether the game should receive an upvote or downvote (true / false)
     */
    async setGameVote(isLiked) {
        if (typeof(isLiked) !== "boolean") {
            isLiked = true;
        }
        let isValidToken = await this.validateToken();
        if (!isValidToken) {
            return false;
        }
        return await createRequest("PATCH", `https://games.roblox.com/v1/games/${this.id}/user-votes`, this.user.cookie, this.user.token, {vote: isLiked}) !== false;
    }

    /**
     * Need to check if this works later
     * @returns {Object} information about the vip server
     * @param {Number} vipServerId Roblox vip server id
     */
    async getVipServer(vipServerId) {
        if (vipServerId && typeof(vipServerId) === "number") {
            let jsonResponse = parseJSON(await createRequest("GET", `https://games.roblox.com/v1/vip-servers/${vipServerId}`), this.user.cookie);
            if (jsonResponse) {
                return jsonResponse;
            }
        }
        return {};
    }

    /**
     * @returns {Boolean} true / false
     * @param {Number} vipServerId Roblox vip server id 
     * @param {{clanAllowed: boolean, enemyClanId: Number, friendsAllowed: boolean, usersToAdd: [number], usersToRemove: [number]}} settings 
     */
    async updateVipServerPermissions(vipServerId, settings) {
        if (vipServerId && typeof(vipServerId) === "number") {
            let isValidToken = await this.validateToken();
            if (!isValidToken) {
                return false;
            }
            let newSettings = {
                clanAllowed: settings.clanAllowed || true,
                enemyClanId: settings.enemyClanId || 0,
                friendsAllowed: settings.friendsAllowed || true,
                usersToAdd: settings.usersToAdd || [],
                usersToRemove: settings.usersToRemove || []
            }
            return await createRequest("PATCH", `https://games.roblox.com/v1/vip-servers/${vipServerId}/permissions`, this.user.cookie, this.user.token, newSettings) !== false;
        }
        handleError("updateVipServerPermissions", "No vip server id provided");
        return false;
    }

    /**
     * @returns {Boolean} true / false
     * @param {Number} vipServerId Roblox vip server id
     * @param {Boolean} activated If the vip server should be activated
     * @param {Number} price The price of the vip server in robux
     */
    async updateVipServerSubscription(vipServerId, activated, price) {
        if (vipServerId && typeof(vipServerId) === "number") {
            return await createRequest("PATCH", `https://games.roblox.com/v1/vip-servers/${vipServerId}`, this.user.cookie, this.user.token, {active: activated, price: price}) !== false;
        }
        return false;
    }

    /**
     * @returns {Boolean} true / false
     */
    async isFavoriteGame() {
        let jsonResponse = parseJSON(await createRequest("GET", `https://games.roblox.com/v1/games/${this.id}/favorites`, this.user.cookie));
        if (jsonResponse.isFavorited === true) {
            return true;
        }
        return false;
    }

    /**
     * @returns {Boolean} true / false
     * @param {Boolean} doFavorite Whether the game should be favorited or not
     */
    async favoriteGame(doFavorite) {
        let isValidToken = await this.validateToken();
        if (!isValidToken) {
            return false;
        }
        return await createRequest("POST", `https://games.roblox.com/v1/games/${this.id}/favorites`, this.user.cookie, this.user.token, {"isFavorited": doFavorite}) !== null;
    }
}


class Group {
    /**
     * @param {Class} User Instance of JSBlox User Class
     * @param {Number} GroupId Roblox group id
     */
    constructor(User, GroupId) {
        this.user = User;
        this.id = GroupId;
    }

    /**
     * @returns {Object} Group info
     */
    async getInfo() {
        let res = await createRequest("GET", `https://groups.roblox.com/v1/groups/${this.id}`);
        let jsonResponse = parseJSON(res);
        if (jsonResponse) {
            return jsonResponse;
        }
        return {};
    }

    /**
     * @returns {Array} Audit logs
     * @param {Number} userId Roblox user id
     */
    async getAuditLogs(userId) {
        return await pageBrowser("GET", `https://groups.roblox.com/v1/groups/${this.id}/audit-log?sortOrder=Asc&limit=100&userId=${userId}`);
    }

    /**
     * @returns {Object} Group settings
     */
    async getSettings() {
        let res = await createRequest("GET", `https://groups.roblox.com/v1/groups/${this.id}/settings`, this.user.cookie);
        let jsonResponse = parseJSON(res);
        if (jsonResponse) {
            return jsonResponse;
        }
        return {};
    }

    /**
     * @returns {Boolean} true / false
     * @param {{approvalRequired: boolean, membershipRequired: boolean, enemiesEnabled: boolean, fundsVisible: boolean, gamesVisible: boolean}} groupSettings New group settings
     */
    async updateSettings(groupSettings) {
        let isValidToken = await this.user.validateToken();
        if (!isValidToken) {
            return false;
        }
        let currentSettings = await this.getSettings();
        if (currentSettings) {
            let newSettings = {
                isApprovalRequired: groupSettings.approvalRequired || currentSettings["IsApprovalRequired"],
                isBuildersClubRequired: groupSettings.membershipRequired || currentSettings["isBuildersClubRequired"],
                areEnemiesAllowed: groupSettings.enemiesEnabled || currentSettings["areEnemiesAllowed"],
                areGroupFundsVisible: groupSettings.fundsVisible || currentSettings["areGroupFundsVisible"],
                areGroupGamesVisible: groupSettings.gamesVisible || currentSettings["areGroupGamesVisible"]
            };
            return await createRequest("PATCH", `https://groups.roblox.com/v1/groups/${this.id}/settings`, this.user.cookie, this.user.token, newSettings) !== false;
        }
        handleError("updateSettings", "Failed to get current settings");
        return false;
    }

    /**
     * @returns {Boolean} true / false
     * @param {String} message 
     */
    async shout(message) {            
        let isValidToken = await this.user.validateToken();
        if (!isValidToken) {
            return false;
        }
        return await createRequest("PATCH", `https://groups.roblox.com/v1/groups/${this.id}/status`, this.user.cookie, this.user.token, {message: message}) !== false;
    }

    /**
     * @returns {Boolean} true / false
     * @param {String} description 
     */
    async setDescription(description) {
        let isValidToken = await this.user.validateToken();
        if (!isValidToken) {
            return false;
        }
        return await createRequest("PATCH", `https://groups.roblox.com/v1/groups/${this.id}/description`, this.user.cookie, this.user.token, {description: description}) !== false;
    }

    /**
     * @returns {Boolean} true / false
     * @param {Buffer} file Buffer of image //fs.createReadStream("filePath")
     */
    async setGroupIcon(file) {
        let isValidToken = await this.user.validateToken();
        if (!isValidToken) {
            return false;
        }
        return new Promise(resolve => {
            request.patch(`https://groups.roblox.com/v1/groups/icon?groupId=${this.id}`, {headers: {"Cookie": `.ROBLOSECURITY=${this.user.cookie}`, "x-csrf-token": this.user.token}, formData: {
                "request.files": file
            }}).then(() => {
                return resolve(true);
            }).catch(err => {
                handleError("setGroupIcon", err);
                return resolve(false);
            });
        });
    }

    /**
     * @returns {Array} Join Requests
     */
    async getJoinRequests() {
        let joinRequests = [];
        let joinData = await pageBrowser("GET", `https://groups.roblox.com/v1/groups/${this.id}/join-requests`, this.user.cookie);
        if (joinData && joinData.length > 0) {
            joinData.map(e => {
                joinRequests.push({
                    userId: e.requester.userId,
                    username: e.requester.username,
                    timestamp: new Date(e.created).getTime()
                });
                return e;
            });
        }
        return joinRequests;
    }

    /**
     * @returns {Boolean} true / false
     * @param {Number} userId Roblox user id
     */
    async checkJoinRequest(userId) {
        userId = validateId(userId, this.user.id);
        return await createRequest("GET", `https://groups.roblox.com/v1/groups/${this.id}/join-requests/users/${userId}`, this.user.cookie) !== false;
    }

    /**
     * @returns {Boolean} true / false
     * @param {Number} userId Roblox user id
     */
    async acceptJoinRequest(userId) {
        let isValidToken = await this.user.validateToken();
        if (!isValidToken) {
            return false;
        }
        let isValid = await this.checkJoinRequest(userId);
        if (isValid) {
            return await createRequest("POST", `https://groups.roblox.com/v1/groups/${this.id}/join-requests/users/${userId}`, this.user.cookie, this.user.token) !== false;
        }
        return false;
    }

    /**
     * @returns {Boolean} true / false
     * @param {Number} userId Roblox user id
     */
    async declineJoinRequest(userId) {
        let isValidToken = await this.user.validateToken();
        if (!isValidToken) {
            return false;
        }
        let isValid = await this.checkJoinRequest(userId);
        if (isValid) {
            return await createRequest("DELETE", `https://groups.roblox.com/v1/groups/${this.id}/join-requests/users/${userId}`, this.user.cookie, this.user.token);
        }
        return false;
    }

    /**
     * @returns {Object} Group roles
     */
    async getRoles() {
        let res = await createRequest("GET", `https://groups.roblox.com/v1/groups/${this.id}/roles`);
        let jsonResponse = parseJSON(res);
        if (jsonResponse) {
            return jsonResponse.roles;
        }
        return {};
    }

    /**
     * @returns {Array} Array of users with specified role id
     * @param {Number} roleId Group role id
     */
    async getUsersWithRole(roleId) {
        let isValidToken = await this.user.validateToken();
        if (!isValidToken) {
            return [];
        }
        if (!roleId) {
            handleError("getUsersWithRole", "No role Id provided");
            return [];
        }
        let [isDone, cursor, userList] = [false, "", []];
        while (!isDone) {
            let res = await createRequest("GET", `https://groups.roblox.com/v1/groups/${this.id}/roles/${roleId}/users?sortOrder=Asc&limit=100?cursor=${cursor}`, this.user.cookie);
            let jsonResponse = parseJSON(res);
            if (jsonResponse && jsonResponse.data) {
                jsonResponse.data.map(e => {
                    userList.push(e);
                    return e;
                });
                if (jsonResponse.nextPageCursor) {
                    cursor = jsonResponse.nextPageCursor;
                } else {
                    isDone = true;
                }
            }
        }
        return userList;
    }

    /**
     * @returns {Boolean} true / false
     * @param {Number} userId Roblox user id 
     */
    async removeMember(userId) {
        let isValidToken = await this.user.validateToken();
        if (!isValidToken) {
            return false;
        }
        userId = validateId(userId, this.user.id);
        return await createRequest("DELETE", `https://groups.roblox.com/v1/groups/${this.id}/users/${userId}`, this.user.cookie, this.user.token) !== false;       
    }

    /**
     * 
     * @param {Number} userId Roblox user id
     * @param {Number} roleId Group role id
     */
    async setUserRole(userId, roleId) {
        let isValidToken = await this.user.validateToken();
        if (!isValidToken) {
            return false;
        }
        let currentGroupRoles = await this.getRoles();
        if (currentGroupRoles && currentGroupRoles.length > 0 && currentGroupRoles.find(x => x.id === roleId)) {
            return await createRequest("PATCH", `https://groups.roblox.com/v1/groups/${this.id}/users/${userId}`, this.user.cookie, this.user.token, {roleId: roleId}) !== false;  
        }
        return false;
    }

    /**
     * @returns {Array} Array of current payouts
     */
    async getPayouts() {
        let res = await createRequest("GET", `https://groups.roblox.com/v1/groups/${this.id}/payouts`, this.user.cookie);
        let jsonResponse = parseJSON(res);
        if (jsonResponse) {
            return jsonResponse.data;
        }
        return [];
    }

    /**
     * @returns {Boolean} true / false
     * @param {Number | Array <number>} userIds Array of user ids
     * @param {Number} amount Amount of robux
     */
    async payoutRobux(userIds, amount) {
        let isValidToken = await this.user.validateToken();
        if (!isValidToken) {
            return false;
        }
        if (typeof(userIds) === "number") {
            userIds = [userIds];
        }
        let recipients = [];
        userIds.map(e => {
            recipients.push({              
                "recipientId": e,
                "recipientType": "User",
                "amount": amount
            });
            return e;
        });
        let res = await createRequest("POST", `https://groups.roblox.com/v1/groups/${this.id}/payouts`, this.user.cookie, this.user.token, {
            "PayoutType": "FixedAmount",
            "Recipients": recipients
        });
        return res;
    }

    /**
     * @returns {Object} Group role permissions
     * @param {Number} roleId Group role id
     */
    async getRolePermissions(roleId) {
        let res = await createRequest("GET", `https://groups.roblox.com/v1/groups/${this.id}/roles/${roleId}/permissions`, this.user.cookie);
        let jsonResponse = parseJSON(res);
        if (jsonResponse) {
            return jsonResponse.permissions;
        }
        return {};
    }

    /**
     * @returns {Boolean} true / false
     * @param {Number} roleId Group role id
     * @param {Boolean} canDeleteWallPosts true / false
     * @param {Boolean} canPostToWall true / false
     * @param {Boolean} canInviteMembers true / false
     * @param {Boolean} canChangeStatus true / false
     * @param {Boolean} canRemoveMembers true / false
     * @param {Boolean} canViewStatus true / false
     * @param {Boolean} canViewWall true / false
     * @param {Boolean} canChangeRank true / false
     * @param {Boolean} canAdvertise true / false
     * @param {Boolean} canManageRelationships true / false
     * @param {Boolean} canAddGroupPlaces true / false
     * @param {Boolean} canViewAuditLogs true / false
     * @param {Boolean} canCreateItems true / false
     * @param {Boolean} canManageItems true / false
     * @param {Boolean} canSpendGroupFunds true / false
     * @param {Boolean} canManageClan true / false
     * @param {Boolean} canManageGroupGames true / false
     */
    async setRolePermissions(roleId, canDeleteWallPosts, canPostToWall, canInviteMembers, canChangeStatus, canRemoveMembers, canViewStatus, canViewWall, canChangeRank, canAdvertise, canManageRelationships, canAddGroupPlaces, canViewAuditLogs, canCreateItems, canManageItems, canSpendGroupFunds, canManageClan, canManageGroupGames) {
        let isValidToken = await this.user.validateToken();
        if (!isValidToken) {
            return false;
        }
        let currentRoles = await this.getRoles();
        if (currentRoles && currentRoles.length > 0 && currentRoles.find(x => x.id === roleId)) {
            let permissionData = {
                "permissions": {
                    "DeleteFromWall": canDeleteWallPosts,
                    "PostToWall": canPostToWall,
                    "InviteMembers": canInviteMembers,
                    "PostToStatus": canChangeStatus,
                    "RemoveMembers": canRemoveMembers,
                    "ViewStatus": canViewStatus,
                    "ViewWall": canViewWall,
                    "ChangeRank": canChangeRank,
                    "AdvertiseGroup": canAdvertise,
                    "ManageRelationships": canManageRelationships,
                    "AddGroupPlaces": canAddGroupPlaces,
                    "ViewAuditLogs": canViewAuditLogs,
                    "CreateItems": canCreateItems,
                    "ManageItems": canManageItems,
                    "SpendGroupFunds": canSpendGroupFunds,
                    "ManageClan": canManageClan,
                    "ManageGroupGames": canManageGroupGames
                }
            };
            return await createRequest("PATCH", `https://groups.roblox.com/v1/groups/${this.id}/roles/${roleId}/permissions`, this.user.cookie, this.user.token, permissionData) !== false;
        }
        return false;
    }

    /**
     * @returns {Array} Group social links
     */
    async getSocialLinks() {
        let res = await createRequest("GET", `https://groups.roblox.com/v1/groups/${this.id}/social-links`, this.user.cookie);
        let jsonResponse = parseJSON(res);
        if (jsonResponse) {
            return jsonResponse.data;
        }
        return [];
    }

    /**
     * @returns {Boolean} true / false
     * @param {String} type Facebook | Twitter | Youtube | Twitch | Discord
     * @param {String} title The displayed title of the social link
     * @param {String} url The url of the profile / group 
     */
    async setSocialLink(type, title, url) {
        let isValidToken = await this.user.validateToken();
        if (!isValidToken) {
            return false;
        }
        type = type.toLowerCase();
        if (type === "facebook" || type === "twitter" || type === "youtube" || type === "twitch" || type === "discord") {
            type = type[0].toUpperCase() + type.slice(1);
            return await createRequest("POST", `https://groups.roblox.com/v1/groups/${this.id}/social-links`, this.user.cookie, this.user.token, {
                type: type,
                url: url,
                title: title
            }) !== false;
        }
        return false;
    }

    /**
     * @returns {Boolean} true / false
     * @param {Number} socialLinkId Group social link id
     */
    async deleteSocialLink(socialLinkId) {
        let isValidToken = await this.user.validateToken();
        if (!isValidToken) {
            return false;
        }
        return await createRequest("DELETE", `https://groups.roblox.com/v1/groups/${this.id}/social-links/${socialLinkId}`, this.user.cookie, this.user.token) !== false;
    }

    /**
     * @returns {Boolean} true / false
     * @param {String} newType Facebook | Twitter | Youtube | Twitch | Discord
     * @param {String} newTitle The new displayed title of the social link
     * @param {String} newUrl The new url of the profile / group 
     */
    async updateSocialLink(socialLinkId, newType, newTitle, newUrl) {
        let isValidToken = await this.user.validateToken();
        if (!isValidToken) {
            return false;
        }
        let currentSocialLinks = await this.getSocialLinks();
        if (currentSocialLinks) {
            for (let i = 0; i < currentSocialLinks.length; i++) {
                if (currentSocialLinks[i].id === socialLinkId) {
                    if (newType === undefined || newType === null) {
                        newType = currentSocialLinks[i].type
                    } else {
                        newType = newType.toLowerCase();
                        if (newType === "facebook" || newType === "twitter" || newType === "youtube" || newType === "twitch" || newType === "discord") {
                            newType = newType[0].toUpperCase() + newType.slice(1);
                        } else {
                            handleError("updateSocialLink", "Invalid newType provided");
                            return false;
                        }
                    }
                    if (!newUrl) {
                        newUrl = currentSocialLinks[i].url;
                    }
                    if (!newTitle) {
                        newTitle = currentSocialLinks[i].title;
                    }
                    return await createRequest("PATCH", `https://groups.roblox.com/v1/groups/${this.id}/social-links/${socialLinkId}`, this.user.cookie, this.user.token, {type: newType, url: newUrl, title: newTitle}) !== false;
                }
            }
        }
        return false;
    }

    /**
     * @returns {Array} Group wall posts
     */
    async getWallPosts(groupId) {
        groupId = validateId(groupId, this.id);
        let wallPosts = pageBrowser("GET", `https://groups.roblox.com/v2/groups/${groupId}/wall/posts?sortOrder=Asc&limit=100`);
        return wallPosts;
    }

    /**
     * @returns {Boolean} true / false
     * @param {Number} postId Group wall post id
     */
    async deleteWallPost(postId) {
        if (!postId) {
            handleError("deleteWallPost", "No postId provided");
            return false;
        }
        let isValidToken = await this.user.validateToken();
        if (!isValidToken) {
            return false;
        }
        return await createRequest("DELETE", `https://groups.roblox.com/v1/groups/${this.id}/wall/posts/${postId}`, this.user.cookie, this.user.token) !== false;
    }

    /**
     * @returns {Boolean} true / false
     * @param {Number} userId Roblox user id
     */
    async deletePostsByUser(userId) {
        userId = validateId(userId, this.user.id);
        let isValidToken = await this.user.validateToken();
        if (!isValidToken) {
            return false;
        }
        return await createRequest("DELETE", `https://groups.roblox.com/v1/groups/${this.id}/wall/users/${userId}/posts`, this.user.cookie, this.user.token) !== false;
    }
    
    /**
     * @returns {Array} Games created by the group
     */
    async getGames() {
        let games = await pageBrowser("GET", `https://games.roblox.com/v2/groups/${this.id}/games?accessFilter=All&sortOrder=Asc&limit=100`);
        if (games) {
            return games;
        }
        return [];
    }
}

class User {
    /**
     * Creates a new JSBlox User object
     * @param {String} cookie Roblox security cookie
     */
    constructor(cookie) {
        if (typeof(cookie) !== "string" && cookie.length > 0) {
            throw new Error("A valid cookie is required to create a new User Instance");
        }
        this.cookie = cookie;
    }
    
    /**
     * @returns {Array} User ids
     * @param {String | Array <string>} usernames 
     */
    static async getIdsFromUsernames(usernames) {
        if (typeof(usernames) === "string") {
            usernames = [usernames];
        } else if (Array.isArray(usernames) === false) {
            handleError("getIdsFromUsernames", "Incorrect usernames provided");
            return [];
        }
        let res = await createRequest("POST", `https://users.roblox.com/v1/usernames/users`, null, null, {usernames: usernames});
        if (res) {
            return res.data;
        }
        return [];
    }

    /**
     * Verifies user cookie and sets userId
     * @returns {Number} Roblox userId
     */
    async authenticateUser() {
        let tmpRes = await createRequest("GET", "https://www.roblox.com/users/profile/profileheader-json?userId=1", this.cookie);
        let tmpData = parseJSON(tmpRes);
        if (tmpData) {
            let res = await createRequest("GET", `https://www.roblox.com/users/profile/profileheader-json?userId=${tmpData.UserId}`);
            let jsonResponse = parseJSON(res);
            if (jsonResponse) {
                this.id = tmpData.UserId;
                return this.id;
            }
            console.error("Your cookie might be invalid");
        }
    }

    /**
     * Requests a x-csrf-token
     * @returns {String} x-csrf-token
     */
    async getCSRFToken() {
        return new Promise(resolve => {
            request.post("https://auth.roblox.com/v2/logout", {resolveWithFullResponse: true, headers: {"Cookie": `.ROBLOSECURITY=${this.cookie}`}}).then(res => {
                return resolve(res.headers["x-csrf-token"]);
            }).catch(err => {
                if (err.response) {
                    if (err.response.headers) {
                        let token = err.response.headers["x-csrf-token"];
                        if (token) {
                            this.token = token;
                            return resolve(token);
                        }
                    }
                }
                handleError("getCSRFToken", err);
                return resolve(null);
            });
        });
    }
    
    /**
     * Validates the x-csrf-token
     * @returns {Boolean} true / false
     */
    async validateToken() {
        if (this.token === undefined) {
            let token = await this.getCSRFToken();
            if (token) {
                this.token = String(token);
                return true;
            }
        } else {
            return true;
        }
        return false;
    }

    /**
     * @returns {Boolean} true / false
     * @param {Number} userId Roblox user id
     */
    async acceptFriendRequest(userId) {
        if (!userId) {
            handleError("acceptFriendRequest", "No user id provided");
            return false;
        }
        let isValidToken = await this.validateToken();
        if (!isValidToken) {
            return false;
        }
        return await createRequest("POST", `https://friends.roblox.com/v1/users/${userId}/accept-friend-request`, this.cookie, this.token) !== false;
    }

    /**
     * @returns {Boolean} true / false
     * @param {Number} userId Roblox user id
     */
    async declineFriendRequest(userId) {
        if (!userId) {
            handleError("declineFriendRequest", "No user id provided");
            return false;
        }
        let isValidToken = await this.validateToken();
        if (!isValidToken) {
            return false;
        }
        return await createRequest("POST", `https://friends.roblox.com/v1/users/${userId}/decline-friend-request`, this.cookie, this.token) !== false;
    }

    /**
     * @returns {Boolean} true / false
     * @param {Number} userId Roblox user id
     */
    async block(userId) {
        if (!userId) {
            handleError("block", "No user id provided");
            return false;
        }
        let isValidToken = await this.validateToken();
        if (!isValidToken) {
            return false;
        }
        return await createRequest("POST", `https://www.roblox.com/userblock/blockuser`, this.cookie, this.token, {blockeeId: userId}) !== false;
    }

    /**
     * @returns {Boolean} true / false
     * @param {Number} userId Roblox user id
     */
    async unblock(userId) {
        if (!userId) {
            handleError("unblock", "No user id provided");
            return false;
        }
        let isValidToken = await this.validateToken();
        if (!isValidToken) {
            return false;
        }
        return await createRequest("POST", `https://www.roblox.com/userblock/unblockuser`, this.cookie, this.token, {blockeeId: userId});
    }

    /**
     * @returns {String} User status
     * @param {Number} userId Roblox user id
     */
    static async getStatus(userId) {
        userId = validateId(userId, this.id);
        let jsonResponse = parseJSON(await createRequest("GET", `https://www.roblox.com/users/profile/profileheader-json?userId=${userId}`));
        if (jsonResponse) {
            return jsonResponse.UserStatus;
        }
        return ""; 
    }

    /**
     * @returns {String} User biography
     */
    async getBio() {
        let res = await createRequest("GET", `https://users.roblox.com/v1/users/${this.id}`);
        let jsonResponse = parseJSON(res);
        if (jsonResponse) {
            return jsonResponse.description;
        }
        return "";        
    }

    /**
     * @returns {Object} User information
     */
    async getPlayerInfo() {
        let res = await createRequest("GET", `https://www.roblox.com/users/profile/profileheader-json?userId=${this.id}`);
        let jsonResponse = parseJSON(res);
        if (jsonResponse) {
            let previousUsernames = jsonResponse.PreviousUserNames;
            if (previousUsernames.length > 0) {
                previousUsernames.split("\\r\\n");
            } else {
                previousUsernames = [];
            }
            let FollowingsCount = jsonResponse.FollowingsCount.replace("K+", "000");
            FollowingsCount = FollowingsCount.replace("M+", "000000");
            FollowingsCount = Number(FollowingsCount)
            let info = {
                id: jsonResponse.ProfileUserId,
                name: jsonResponse.ProfileUserName,
                status: jsonResponse.UserStatus,
                friendsCount: jsonResponse.FriendsCount,
                followersCount: jsonResponse.FollowersCount,
                followingsCount: FollowingsCount,
                presence: jsonResponse.UserPrecenceType,
                lastLocation: jsonResponse.LastLocation,
                avatar: jsonResponse.HeadShotImage.Url.replace(/150/g, "512"),
                previousUsernames: previousUsernames,
                membershipType: jsonResponse.UserMembershipType,
                hasPremium: jsonResponse.IsVieweePremiumOnlyUser
            };
            return info;
        }
        return {};
    }

    /**
     * @returns {Array} Array of friends
     */
    async getFriends() {
        let res = await createRequest("GET", `https://friends.roblox.com/v1/users/${this.id}/friends`);
        let jsonResponse = parseJSON(res);
        if (jsonResponse) {
            let friends = [];
            let friendsData = jsonResponse["data"];
            for (let i = 0; i < friendsData.length; i++) {
                friends.push({
                    "id": friendsData[i]["id"],
                    "name": friendsData[i]["name"],
                    "online": friendsData[i]["isOnline"],
                    "bio": friendsData[i]["description"],
                    "created": new Date(friendsData[i]["created"]).getTime(),
                    "banned": friendsData[i]["accountStatus"] === 3
                });
            }
            return friends;
        }
        return [];
    }

    /**
     * @returns {Boolean} true / false
     * @param {Number} userId Roblox user id
     */
    async addFriend(userId) {
        if (!userId) {
            handleError("addFriend", "No user id provided");
            return false;
        }
        let isValidToken = await this.validateToken();
        if (!isValidToken) {
            return false;
        }
        let res = await createRequest("POST", `https://www.roblox.com/api/friends/sendfriendrequest`, this.cookie, this.token, {targetUserID: String(userId)});
        if (res) {
            return true;
        }
        return false;
    }

    /**
     * @returns {Boolean} true / false
     * @param {Number} userId Roblox user id
     */
    async removeFriend(userId) {
        if (!userId) {
            handleError("removeFriend", "No user id provided");
            return false;
        }
        let isValidToken = await this.validateToken();
        if (!isValidToken) {
            return false;
        }
        let res = await createRequest("POST", `https://www.roblox.com/api/friends/removefriend`, this.cookie, this.token, {targetUserID: String(userId)});
        if (res) {
            return true;
        }
        return false;
    }

    /**
     * @returns {Boolean} true / false
     * @param {Number} userId Roblox user id
     */
    async follow(userId) {
        if (!userId) {
            handleError("follow", "No user id provided");
            return false;
        }
        let isValidToken = await this.validateToken();
        if (!isValidToken) {
            return false;
        }
        let res = await createRequest("POST", `https://www.roblox.com/user/follow`, this.cookie, this.token, {targetUserID: String(userId)});
        if (res) {
            return true;
        }
        return false;
    }

    /**
     * @returns {Boolean} true / false
     * @param {Number} userId Roblox user id
     */
    async unfollow(userId) {
        if (!userId) {
            handleError("unfollow", "No user id provided");
            return false;
        }
        let isValidToken = await this.validateToken();
        if (!isValidToken) {
            return false;
        }
        let res = await createRequest("POST", `https://www.roblox.com/user/unfollow`, this.cookie, this.token, {targetUserID: String(userId)});
        if (res) {
            return true;
        }
        return false;
    }

    /**
     * @returns {Boolean} true / false
     */
    async clearNotifications() {
        let res = await createRequest("POST", `https://notifications.roblox.com/v2/stream-notifications/clear-unread`, this.cookie, this.token);
        let jsonResponse = parseJSON(res);
        if (jsonResponse) {
            return true;
        }
        return false;
    }

    /**
     * @returns {Boolean} true / false
     * @param {Number} notificationId 
     */
    async readNotification(notificationId) {
        if (notificationId) {
            let res = await createRequest("POST", `https://notifications.roblox.com/v2/stream-notifications/mark-interacted`, this.cookie, this.token, {eventId: notificationId});
            let jsonResponse = parseJSON(res);
            if (jsonResponse) {
                return true;
            }
        }        
        return false;
    }

    /**
     * @returns {Array} Current notifications
     */
    async getNotifications() {
        let res = await createRequest("GET", `https://notifications.roblox.com/v2/stream-notifications/get-recent?maxRows=10&startIndex=0`, this.cookie);
        let jsonResponse = parseJSON(res);
        if (jsonResponse) {
            let notifications = [];
            for (let i = 0; i < jsonResponse.length; i++) {
                notifications.push({
                    notificationId: jsonResponse[i].id,
                    type: jsonResponse[i].notificationSourceType,
                    hasRead: jsonResponse[i].isInteracted,
                    author: {
                        id: jsonResponse[i].metadataCollection[0].AuthorUserId || jsonResponse[i].metadataCollection[0].AccepterUserId,
                        name: jsonResponse[i].metadataCollection[0].AuthorUserName || jsonResponse[i].metadataCollection[0].AccepterUserName
                    },
                    timestamp: new Date(jsonResponse[i].eventDate).getTime()
                });
            }
            return notifications;
        }
        return [];
    }

    /**
     * @returns {Array} The aliases of users
     * @param {Number | Array <number>} userIds user id or array of user ids
     */
    async getUserAlias(userIds) {
        if (typeof(userIds) === "number") {
            userIds = [userIds];
        } else if (Array.isArray(userIds) === false) {
            handleError("getUserAlias", "Invalid userIds provided");
            return [];
        }
        let isValidToken = await this.validateToken();
        if (!isValidToken) {
            return [];
        }
        let response = await createRequest("POST", `https://contacts.roblox.com/v1/user/get-tags`, this.cookie, this.token, {targetUserIds: userIds});
        if (response) {
            return response;
        }
        return [];
    }

    /**
     * @returns {Boolean} true / false
     * @param {Number} userId Roblox user id
     * @param {String} userTag 
     */
    async setUserAlias(userId, userTag) {
        if (!userId) {
            handleError("setUserAlias", "No user id provided");
            return false;
        }
        if (!userTag) {
            handleError("setUserAlias", "No user tag provided");
            return false;
        }
        let isValidToken = await this.validateToken();
        if (!isValidToken) {
            return false;
        }
        if (userTag.length > 20) {
            userTag = userTag.substring(0, 20);
        }
        return await createRequest("POST", `https://contacts.roblox.com/v1/user/tag`, this.cookie, this.token, {targetUserId: userId, userTag: userTag}) !== false;
    }

    /**
     * @returns {Array} Primary group info
     */
    async getPrimaryGroup() {
        let res = parseJSON(await createRequest("GET", `https://groups.roblox.com/v1/users/${this.id}/groups/primary/role`));
        if (res) {
            return res;
        }
        return {};
    }

    /**
     * @returns {Boolean} true / false
     */
    async removePrimaryGroup() {
        let isValidToken = await this.validateToken();
        if (!isValidToken) {
            return false;
        }
        return await createRequest("DELETE", `https://groups.roblox.com/v1/user/groups/primary`, this.cookie, this.token) !== false;
    }

    /**
     * @returns {Boolean} true / false
     * @param {Number} groupId 
     */
    async setPrimaryGroup(groupId) {
        groupId = validateId(groupId, this.id);
        let isValidToken = await this.validateToken();
        if (!isValidToken) {
            return false;
        }
        return await createRequest("POST", `https://groups.roblox.com/v1/user/groups/primary`, this.cookie, this.token, {groupId: groupId}) !== false;
    }

    /**
     * @returns {Object} Avatar information
     */
    async getAvatar() {
        let res = await createRequest("GET", `https://avatar.roblox.com/v1/avatar`, this.cookie);
        let jsonResponse = parseJSON(res);
        if (jsonResponse) {
            return jsonResponse;
        }
        return {};
    }
    
    /**
     * @returns {Array} Array of assets
     */
    async getWearingAssets() {
        let currentAvatar = await this.getAvatar();
        if (currentAvatar) {
            let assetList = currentAvatar.assets.map(e => {
                return e.id;
            });
            return assetList;
        }
        return [];
    }

    /**
     * @returns {Boolean} true / false
     * @param {Number | Array <number>} assetIds Asset ids the user will wear 
     */
    async setWearingAssets(assetIds) {
        if (typeof(assetIds) === "number") {
            assetIds = [assetIds];
        } else if (Array.isArray(assetIds) === false) {
            assetIds = [];
        }
        let isValidToken = await this.validateToken();
        if (!isValidToken) {
            return false;
        }
        return await createRequest("POST", `https://avatar.roblox.com/v1/avatar/set-wearing-assets`, this.cookie, this.token, {assetIds: assetIds}) !== false;
    }

    /**
     * @returns {Boolean} true / false
     * @param {Number} assetId The asset id to add to the user's avatar
     */
    async wearAsset(assetId) {
        if (!assetId) {
            handleError("wearAsset", "No asset id provided");
            return false;
        }
        let isValidToken = await this.validateToken();
        if (!isValidToken) {
            return false;
        }
        return parseJSON(await createRequest("POST", `https://avatar.roblox.com/v1/avatar/assets/${assetId}/wear`, this.cookie, this.token)) !== false;
    }

    /**
     * @returns {Boolean} true / false
     * @param {Number} assetId The asset id to remove from the user's avatar 
     */
    async removeWearingAsset(assetId) {
        if (!assetId) {
            handleError("wearAsset", "No asset id provided");
            return false;
        }
        let isValidToken = await this.validateToken();
        if (!isValidToken) {
            return false;
        }
        return await createRequest("POST", `https://avatar.roblox.com/v1/avatar/assets/${assetId}/remove`, this.cookie, this.token) !== false;
    }

    /**
     * @returns {Boolean} true / false
     */
    async redrawAvatarThumbnail() {
        let isValidToken = await this.validateToken();
        if (!isValidToken) {
            return false;
        }
        return await createRequest("POST", `https://avatar.roblox.com/v1/avatar/redraw-thumbnail`, this.cookie, this.token) !== false;
    }

    /**
     * @returns {Boolean} true / false
     */
    async switchAvatarType() {
        let currentAvatar = await this.getAvatar();
        if (currentAvatar) {
            let isValidToken = await this.validateToken();
            if (!isValidToken) {
                return false;
            }
            let avatarType = currentAvatar.playerAvatarType;
            let newAvatarType = "R15";
            if (avatarType && avatarType === "R15") {
                newAvatarType = "R6";
            }
            return await createRequest("POST", `https://avatar.roblox.com/v1/avatar/set-player-avatar-type`, this.cookie, this.token, {playerAvatarType: newAvatarType}) !== false;
        }
        return false;
    }

    /**
     * @returns {Boolean} true / false
     * @param {Number} height 0.9 - 1.05 | Increments of 0.01
     * @param {Number} width 0.7 - 1 | Increments of 0.01
     * @param {Number} head 0.95 - 1 | Increments of 0.01
     * @param {Number} depth Idk Yet
     * @param {Number} proportions 0 - 1 | Increments of 0.01
     * @param {Number} bodyType 0 - 1 | Increments of 0.01
     */
    async setBodyScales(height, width, head, proportions, bodyType) {
        let isValidToken = await this.validateToken();
        if (!isValidToken) {
            return false;
        }
        return await createRequest("POST", `https://avatar.roblox.com/v1/avatar/set-scales`, this.cookie, this.token, {
            "height": height || 1,
            "width": width || 1,
            "head": head || 1,
            "proportion": proportions || 1,
            "bodyType": bodyType || 1
        }) !== false;
    }

    /**
     * @returns {Boolean} true / false
     * @param {String} name Name of the new outfit
     */
    async createOutfit(name) {
        if (name) {
            let currentAvatar = await this.getAvatar();
            let isValidToken = await this.validateToken();
            if (!isValidToken) {
                return false;
            }
            let assetIds = currentAvatar.assets.map(e => e.id);
            return await createRequest("POST", `https://avatar.roblox.com/v1/outfits/create`, this.cookie, this.token, {
                "name": name,
                "bodyColors": currentAvatar.bodyColors,
                "assetIds": assetIds,
                "scale": currentAvatar.scales,
                "playerAvatarType": currentAvatar.playerAvatarType
            }) !== false;
        }
        handleError("createOutfit", "No outfit name provided");
        return false;
    }

    /**
     * @returns {Boolean} true / false
     * @param {Number} outfitId Roblox outfit id
     */
    async deleteOutfit(outfitId) {
        if (outfitId) {
            let isValidToken = await this.validateToken();
            if (!isValidToken) {
                return false;
            }
            return await createRequest("DELETE", `https://avatar.roblox.com/v1/outfits/${outfitId}/delete`, this.cookie, this.token) !== false;
        }
        handleError("createOutfit", "No outfit id provided");
        return false;
    }

    /**
     * @returns {Boolean} true / false
     * @param {Number} badgeId Roblox badge id 
     */
    async removeAwardedBadge(badgeId) {
        if (badgeId) {
            return await createRequest("DELETE", `https://badges.roblox.com/v1/user/badges/${badgeId}`) !== false;
        }
        handleError("removeAwardedBadge", "No badge id provided");
        return false;
    }

    /**
     * @returns {Array} Games created by the user
     */
    async getGames() {
        let res = await pageBrowser("GET", `https://games.roblox.com/v2/users/${this.id}/games`);
        if (res) {
            return res;
        }
        return [];
    }
}

module.exports = {
    Chat: Chat,
    User: User,
    Group: Group,
    Game: Game
};
