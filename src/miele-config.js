const BASE_URL = "https://api.mcs3.miele.com/v1";
const axios = require('axios').default;
const qs = require('querystring');
const EventSource = require('./lib/eventsource');

async function getToken(clientId, clientSecret, username, password, country) {
    let response = await axios.post("https://api.mcs3.miele.com/thirdparty/token", qs.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "password",
        vg: country,
        username,
        password,
    }));
    let expires = new Date();
    expires.setSeconds(expires.getSeconds() + response.data.expires_in);
    return { token: response.data.access_token, expires };
}

module.exports = function(RED) {

    class MieleConfig {
        constructor(config) {
            RED.nodes.createNode(this, config);
            this.config = config;
            this.readyCallbacks = [];
            this.start();
        }
        async start() {
            try {
                this.acquireToken();
                this.log("Authenticated with Miele API");
                this.status({fill:"green",shape:"dot",text:"authenticated"});
            } catch (e) {
                this.error(e);
                this.status({fill:"red",shape:"dot",text:"authentication error"});
                setTimeout(() => this.start(), 60 * 10);
            }
        }

        async get(url, params) {
            return await this.client.get(url, qs.stringify(params));
        }

        listen(url) {
            return new EventSource(BASE_URL + url, { headers: {
                Authorization: `Bearer ${this.token}`
            } });
        }

        ready(callback) {
            this.readyCallbacks.push(callback);
        }

        async acquireToken() {
            const context = this.context();
            let authInfo = context.get("auth");
            if (authInfo == null) {
                this.log("Fetching Miele API token");
                authInfo = await getToken(this.config.clientId, this.config.clientSecret, this.config.username, this.config.password, this.config.country);
                context.set("auth", authInfo);
            }

            this.token = authInfo.token;
            this.client = axios.create({
                baseURL: BASE_URL,
                headers: {
                    Authorization: `Bearer ${authInfo.token}`
                }
            });
            for (const c of this.readyCallbacks) {
                c();
            }

            let now = new Date();
            let expiresInDay = authInfo.expires.getTime() - now.getTime() - 1000*60*60*24 <= 0;
            if (expiresInDay) {
                this.log("Refreshing Miele API token");
                context.set("auth", null);
                this.acquireToken();
            }
        }

        async getDevices() {
            return (await this.get("/short/devices")).data;
        }
    }
    RED.nodes.registerType("miele-config", MieleConfig);

    RED.httpAdmin.get("/miele/devices", async (req, res, next) => {
        const config = RED.nodes.getNode(req.query.config);
        try {
            const devices = await config.getDevices();
            res.end(JSON.stringify(devices));
        } catch(e) {
            res.status(500).send(JSON.stringify(e));
        }
    });
}
