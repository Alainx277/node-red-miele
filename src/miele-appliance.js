
module.exports = function(RED) {
    const axios = require('axios').default;

    class MieleAppliance {
        constructor(config) {
            RED.nodes.createNode(this, config);
            this.config = config;
            this.api = RED.nodes.getNode(config.config);
            this.status({fill:"yellow",shape:"dot",text:"waiting for authentication"});
            this.api.ready(() => this.start());
        }

        async start() {
            try {
                const events = this.api.listen(`/devices/${this.config.id}/events`);
                events.onAnyMessage = (type, data) => this.handleEvent(type, data);
                events.onErr = (e) => this.log(e);
            } catch (e) {
                this.error(e);
                this.status({fill:"red",shape:"dot",text:"error fetching device"});
            }
        }

        handleEvent(type, data) {
            if (type === "ping") {
                this.status({fill:"green",shape:"dot",text:"device ready"});
                return;
            } else if (type === "error") {
                this.error(`Event stream error: ${JSON.stringify(data)}`);
                this.status({fill:"red",shape:"dot",text:"event stream error"});
                return;
            } else if (type === "open") {
                return;
            }
            if (data.data != null) {
                this.send({ payload: { type, data: JSON.parse(data.data) } } )
            } else {
                this.send({ payload: {type, data} });
            }
            // this.log(JSON.stringify({type, data}));
        }
    }
    RED.nodes.registerType("miele-appliance", MieleAppliance);
}
