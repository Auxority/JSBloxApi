const request = require("request-promise");
request.defaults.rejectUnauthorized = false;

/**
 * @returns {Boolean} true / false
 * @param {String} str Non parsed JSON
 */
function parseJSON(str) {
    if (str === undefined) {
        return false;
    }
    try {
        return JSON.parse(str);
    } catch (e) {
        console.error(`Failed to parse JSON: ${e}`);
        return false;
    }
}

/**
 * 
 * @param {String} name Indication of where the error came from
 * @param {String} err Actual error 
 */
function handleError(name, err) {
    try {
        if (err.response) {
            if (err.response.body && (typeof(err.response.body) === "object" || parseJSON(err.response.body))) {
                throw new Error(`${err.response.statusCode} ${err.response.statusMessage}\n${name} error: ${err.response.statusMessage} (Code: ${err.response.statusCode})\nResponse: ${JSON.stringify(err.response.body)}`);
            } else {
                throw new Error(`${err.response.statusCode} ${err.response.statusMessage}\n${name} error: ${err.response.statusMessage} (Code: ${err.response.statusCode})`);
            }
        } else {
            throw new Error(`${name}\n${err}`);
        }
    } catch (e) {
        console.error(e);
        return false;
    }
}

/**
 * @returns Response data or false 
 * @param {String} method GET | POST | PATCH | DELETE
 * @param {String} url 
 * @param {String} cookie 
 * @param {String} token 
 * @param {Object} json 
 * @param {Boolean} fullResponse true / false
 */
function createRequest(method, url, cookie, token, json, fullResponse) {
    return new Promise(resolve => {
        let headers = {};
        if (cookie) {
            headers["Cookie"] = `.ROBLOSECURITY=${cookie}`;
        }
        if (token) {
            headers["x-csrf-token"] = token;
        }
        let resolveWithFullResponse = false;
        if (fullResponse) {
            resolveWithFullResponse = true;
        }
        request(url, {
            method: method,
            headers: headers,
            resolveWithFullResponse: resolveWithFullResponse,
            json: json
        }).then(response => {
            return resolve(response);
        }).catch(err => {
            handleError(`${method} ${url}`, err);
            return resolve(false);
        });
    });
}

/**
 * @returns {Number} Valid user id
 * @param {Number} providedId 
 * @param {Number} ownId 
 */
function validateId(providedId, ownId) {
    if (providedId && typeof(providedId) === "number" && providedId >= 0) {
        return providedId;
    }
    return ownId;
}

/**
 * 
 * @param {String} method 
 * @param {String} url 
 * @param {String} cookie 
 * @param {String} token 
 * @param {Object} json 
 * @param {Boolean} fullResponse
 */
async function pageBrowser(method, url, cookie, token, json, fullResponse) {
    let connector = null;
    let [isDone, cursor, data] = [false, "", []];
    if (url.includes("?") === true) {
        connector = "&";
    } else {
        connector = "?";
    }

    while (!isDone) {
        let newUrl = `${url}${connector}cursor=${cursor}`;
        let res = await createRequest(method, newUrl, cookie, token, json, fullResponse);
        let jsonResponse = parseJSON(res);
        if (jsonResponse && jsonResponse.data && jsonResponse.data.length > 0) {
            for (let i = 0; i < jsonResponse.data.length; i++) {
                data.push(jsonResponse.data[i]);
            }
            if (jsonResponse.nextPageCursor) {
                cursor = jsonResponse.nextPageCursor;
            } else {
                isDone = true;
            }
        } else {
            isDone = true;
        }
    }
    return data;
}

module.exports = {
    "parseJSON": parseJSON,
    "handleError": handleError,
    "createRequest": createRequest,
    "validateId": validateId,
    "pageBrowser": pageBrowser
};