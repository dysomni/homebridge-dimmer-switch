# homebridge-dimmer-switch
Homebridge plugin that exposes a dimmer switch with increment and decrement switches.

Each dimmer switch creates TODO UPDATE 5 different accessories in a group.

The plain dimmer bulb is used for hooking functionality to. Use apps like Home+ to automate a scene when the dimmer is set to a specific value.

The report dimmer bulb is used to update the dimmer switch state so that it knows when controlling it after a manual scene has been set. For example, if I have a scene that manually sets the lights to a specific brightness aside from using the dimmer switch, I would want that scene to also update the "report" dimmer so that the dimmer knows how to dim from then on.

The increment switch moves to the next value in the list, based on where it was last placed.

The decrement switch moves to the previous value in the list, based on where it was last placed.

The toggle switch sets it to either the first or last value in the list. If it is currently somewhere in the middle, it defaults to the first value.

## Installation

This plugin is currently not published with npm. Please install the plugin after cloning the repository. Then after entering into the directory, run the following commands:

```
npm run build
npm install -g .
```

## Configuration

```json
{
    "dimmers": [
        {
            "name": "Bedroom Dimmer",
            "values": [
                0,
                1,
                25,
                50,
                75,
                100
            ]
        },
        {
            "name": "Kitchen Dimmer",
            "values": [
                0,
                1,
                25,
                50,
                75,
                100
            ]
        }
    ],
    "platform": "DimmerSwitchPlatform"
}
```

**dimmers**: Array of all dimmers that should be exposed to HomeKit. Each dimmer is a separate set of accessories.

**name**: The name of the dimmer, that is initially used as the display name.

**values**: List of values that the dimmer will move through. Increment moves to values later in the list, and Decrement moves to values earlier in the list.

**dimmerValues**: List of values TODO
