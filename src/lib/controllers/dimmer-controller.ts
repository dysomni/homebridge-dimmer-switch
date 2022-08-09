
import { Platform } from '../platform';
import { Homebridge, Characteristic } from 'homebridge-framework';
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
    // @ts-ignore
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

        let lightBulbService = accessory.useService(Homebridge.Services.Lightbulb, `${dimmerConfiguration.name}`)
        this.bulbOnCharacteristic = lightBulbService.useCharacteristic<boolean>(Homebridge.Characteristics.On);
        this.bulbBrightnessCharacteristic = lightBulbService.useCharacteristic<number>(Homebridge.Characteristics.Brightness)

        let reportService = accessory.useService(Homebridge.Services.Lightbulb, `${dimmerConfiguration.name} Report`, `${dimmerConfiguration.name}-report-lightbulb`)
        this.reportOnCharacteristic = reportService.useCharacteristic<boolean>(Homebridge.Characteristics.On);
        this.reportBrightnessCharacteristic = reportService.useCharacteristic<number>(Homebridge.Characteristics.Brightness)


        let incSwitchName = `${dimmerConfiguration.name} Increment`
        let decSwitchName = `${dimmerConfiguration.name} Decrement`
        let toggleSwitchName = `${dimmerConfiguration.name} Toggle`

        // Creates all switches of the controller
        platform.logger.info(`[${dimmerConfiguration.name}] Adding increment switch ${incSwitchName}`);
        let incSwitchService = accessory.useService(Homebridge.Services.Switch, incSwitchName, `${incSwitchName}-switch`);
        this.incOnCharacteristic = incSwitchService.useCharacteristic<boolean>(Homebridge.Characteristics.On);

        platform.logger.info(`[${dimmerConfiguration.name}] Adding decrement switch ${decSwitchName}`);
        let decSwitchService = accessory.useService(Homebridge.Services.Switch, decSwitchName, `${decSwitchName}-switch`);
        this.decOnCharacteristic = decSwitchService.useCharacteristic<boolean>(Homebridge.Characteristics.On);

        platform.logger.info(`[${dimmerConfiguration.name}] Adding toggle switch ${toggleSwitchName}`);
        let toggleSwitchService = accessory.useService(Homebridge.Services.Switch, toggleSwitchName, `${toggleSwitchName}-switch`);
        this.toggleOnCharacteristic = toggleSwitchService.useCharacteristic<boolean>(Homebridge.Characteristics.On);

        this.incOnCharacteristic.valueChanged = newValue => {
            if (newValue === false) {
              return
            }
            platform.logger.info(`[${incSwitchName}] switch activated`);
            platform.logger.info(`current index is ${this.currentIdx}`);
            if (this.currentIdx < this.values.length - 1) {
              this.currentIdx = this.currentIdx + 1;
              setTimeout(() => this.bulbBrightnessCharacteristic.value = this.values[this.currentIdx], 50);
            }
            setTimeout(() => this.incOnCharacteristic.value = false, 50);
        };

        this.decOnCharacteristic.valueChanged = newValue => {
          if (newValue === false) {
            return
          }
          platform.logger.info(`[${decSwitchName}] switch activated`);
          platform.logger.info(`current index is ${this.currentIdx}`);
          if (this.currentIdx > 0) {
            this.currentIdx = this.currentIdx - 1;
            setTimeout(() => this.bulbBrightnessCharacteristic.value = this.values[this.currentIdx], 50);
          }
          setTimeout(() => this.decOnCharacteristic.value = false, 50);
        };

        this.toggleOnCharacteristic.valueChanged = newValue => {
          if (newValue === false) {
            return
          }
          platform.logger.info(`[${toggleSwitchName}] switch activated`);
          platform.logger.info(`current index is ${this.currentIdx}`);
          if (this.currentIdx > 0) {
            this.currentIdx = 0;
          } else {
            this.currentIdx = this.values.length - 1
          }
          setTimeout(() => this.bulbBrightnessCharacteristic.value = this.values[this.currentIdx], 50);
          setTimeout(() => this.toggleOnCharacteristic.value = false, 50);
        };

        this.reportBrightnessCharacteristic.valueChanged = newValue => {
          platform.logger.info(`new [${dimmerConfiguration.name}] brightness reported`);
          const closest = this.values.reduce(function(prev, curr) {
            return (Math.abs(curr - newValue) < Math.abs(prev - newValue) ? curr : prev);
          });
          const closestIdx = this.values.findIndex(x => x === closest);
          platform.logger.info(`new index is ${closestIdx}`);
          this.currentIdx = closestIdx;
        };

        this.reportOnCharacteristic.valueChanged = newValue => {
          if (!newValue) {
            platform.logger.info(`new [${dimmerConfiguration.name}] brightness reported`);
            const closest = this.values.reduce(function(prev, curr) {
              return (Math.abs(curr - 0) < Math.abs(prev - 0) ? curr : prev);
            });
            const closestIdx = this.values.findIndex(x => x === closest);
            platform.logger.info(`new index is ${closestIdx}`);
            this.currentIdx = closestIdx;
          }
        };

        accessory.removeUnusedServices();
        setTimeout(() => this.incOnCharacteristic.value = false, 50);
        setTimeout(() => this.decOnCharacteristic.value = false, 50);
        setTimeout(() => this.toggleOnCharacteristic.value = false, 50);
        setTimeout(() => this.bulbBrightnessCharacteristic.value = this.values[this.currentIdx], 50);
    }

    private values: Array<number>;
    private currentIdx: number;

    private incOnCharacteristic: Characteristic<boolean>;
    private decOnCharacteristic: Characteristic<boolean>;
    private toggleOnCharacteristic: Characteristic<boolean>;
    // @ts-ignore
    private bulbOnCharacteristic: Characteristic<boolean>;
    private bulbBrightnessCharacteristic: Characteristic<number>;
    private reportOnCharacteristic: Characteristic<boolean>;
    private reportBrightnessCharacteristic: Characteristic<number>;

}
