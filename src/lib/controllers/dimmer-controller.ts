
import { Platform } from '../platform';
import { Homebridge, Characteristic, Service } from 'homebridge-framework';
import { DimmerConfiguration } from '../configuration/dimmer-configuration';

/**
 * Represents a controller for a single group. A group consists of multiple switches and acts as a radio button group.
 */
export class DimmerController {

    /**
     * Initializes a new GroupController instance.
     * @param platform The plugin platform.
     * @param groupConfiguration The configuration of the group that is represented by this controller.
     */
    constructor(private platform: Platform, private dimmerConfiguration: DimmerConfiguration) {
        platform.logger.info(`[${dimmerConfiguration.name}] Initializing...`);

        // Creates the accessory
        const accessory = platform.useAccessory(dimmerConfiguration.name, `${dimmerConfiguration.name}-group`);
        accessory.setInformation({
            manufacturer: 'Dimmer',
            model: 'Dimmer Switches',
            serialNumber: dimmerConfiguration.name,
            firmwareRevision: null,
            hardwareRevision: null
        });

        this.values = dimmerConfiguration.values;
        this.currentIdx = 0

        let lightBulbService: Service
        lightBulbService = accessory.useService(Homebridge.Services.Lightbulb, `${dimmerConfiguration.name}`)
        this.bulbOnCharacteristic = lightBulbService.useCharacteristic<boolean>(Homebridge.Characteristics.On);
        this.bulbBrightnessCharacteristic = lightBulbService.useCharacteristic<number>(Homebridge.Characteristics.Brightness)


        let incSwitchName = `${dimmerConfiguration.name} Increment`
        let decSwitchName = `${dimmerConfiguration.name} Decrement`
        // Creates all switches of the controller
        platform.logger.info(`[${dimmerConfiguration.name}] Adding increment switch ${incSwitchName}`);
        let incSwitchService = accessory.useService(Homebridge.Services.Switch, incSwitchName, `${incSwitchName}-switch`);
        this.incOnCharacteristic = incSwitchService.useCharacteristic<boolean>(Homebridge.Characteristics.On);

        platform.logger.info(`[${dimmerConfiguration.name}] Adding decrement switch ${decSwitchName}`);
        let decSwitchService = accessory.useService(Homebridge.Services.Switch, decSwitchName, `${decSwitchName}-switch`);
        this.decOnCharacteristic = decSwitchService.useCharacteristic<boolean>(Homebridge.Characteristics.On);

        this.incOnCharacteristic.valueChanged = newValue => {
            if (newValue === false) {
              return
            }
            platform.logger.info(`[${incSwitchName}] switch activated`);
            if (this.currentIdx < this.values.length - 1) {
              this.currentIdx = this.currentIdx + 1;
              this.bulbBrightnessCharacteristic.value = this.values[this.currentIdx];
            }
            this.incOnCharacteristic.value = false;
        };
        this.decOnCharacteristic.valueChanged = newValue => {
          if (newValue === false) {
            return
          }
          platform.logger.info(`[${decSwitchName}] switch activated`);
          if (this.currentIdx > 0) {
            this.currentIdx = this.currentIdx - 1;
            this.bulbBrightnessCharacteristic.value = this.values[this.currentIdx];
          }
          this.incOnCharacteristic.value = false;
      };

        accessory.removeUnusedServices();
        this.incOnCharacteristic.value = false;
        this.decOnCharacteristic.value = false;
        this.bulbBrightnessCharacteristic.value = this.values[this.currentIdx];
    }

    private values: Array<number>;
    private currentIdx: number;

    private incOnCharacteristic: Characteristic<boolean>;
    private decOnCharacteristic: Characteristic<boolean>;
    private bulbOnCharacteristic: Characteristic<boolean>;
    private bulbBrightnessCharacteristic: Characteristic<number>;

}
