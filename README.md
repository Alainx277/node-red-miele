# node-red-miele

A node-red plugin to receive events from Miele appliances.

## Usage

1. You must have a Miele@home account, and have your devices registered to it
2. Create a Miele developer account [here](https://www.miele.com/f/com/en/register_api.aspx).
You will get an email after a few minutes.
Follow the link in it and write down your Client Id and Client Secret.
3. Add a miele-appliance node into your flow and edit it
4. Click the edit button next to "Add new miele-config"
5. Here you enter the client data you wrote down earlier, and your normal account username and password. You must also select the correct country for your account.
6. After you finished adding the configuration, you can select your device from the id dropdown.

More documentation can be found in the node help inside node-red.
