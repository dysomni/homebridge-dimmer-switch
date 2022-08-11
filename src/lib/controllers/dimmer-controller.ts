
import { Platform } from '../platform';
import { Homebridge, Characteristic } from 'homebridge-framework';
import { DimmerConfiguration } from '../configuration/dimmer-configuration';

const unused_value = (values1: Array<number>, values2: Array<number>) => {
  const hundred = Array.apply(null, Array(101)).map(function (_, i) {return i;})
  const unused = hundred.filter(n => !values1.includes(n) && !values2.includes(n))
  return unused[0]
}

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
        this.sceneValues = dimmerConfiguration.sceneValues || dimmerConfiguration.values
        this.unusedNumber = unused_value(this.values, this.sceneValues)
        this.currentIdx = 0
        this.sceneIdx = this.sceneValues.length - 1

        let lightBulbService = accessory.useService(Homebridge.Services.Lightbulb, `${dimmerConfiguration.name}`)
        this.bulbOnCharacteristic = lightBulbService.useCharacteristic<boolean>(Homebridge.Characteristics.On);
        this.bulbBrightnessCharacteristic = lightBulbService.useCharacteristic<number>(Homebridge.Characteristics.Brightness)

        let reportService = accessory.useService(Homebridge.Services.Lightbulb, `${dimmerConfiguration.name} Report`, `${dimmerConfiguration.name}-report-lightbulb`)
        this.reportOnCharacteristic = reportService.useCharacteristic<boolean>(Homebridge.Characteristics.On);
        this.reportBrightnessCharacteristic = reportService.useCharacteristic<number>(Homebridge.Characteristics.Brightness)

        let sceneService = accessory.useService(Homebridge.Services.Lightbulb, `${dimmerConfiguration.name} Scene`, `${dimmerConfiguration.name}-scene-lightbulb`)
        this.sceneOnCharacteristic = sceneService.useCharacteristic<boolean>(Homebridge.Characteristics.On);
        this.sceneBrightnessCharacteristic = sceneService.useCharacteristic<number>(Homebridge.Characteristics.Brightness)

        let incSwitchName = `${dimmerConfiguration.name} Increment`
        let decSwitchName = `${dimmerConfiguration.name} Decrement`
        let toggleSwitchName = `${dimmerConfiguration.name} Toggle`
        let activateSceneSwitchName = `${dimmerConfiguration.name} Activate Scene`
        let deactivateSceneSwitchName = `${dimmerConfiguration.name} Deactivate Scene`
        let disableSceneSwitchName = `${dimmerConfiguration.name} Disable Scene`

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



        platform.logger.info(`[${dimmerConfiguration.name}] Adding scene activator switch ${activateSceneSwitchName}`);
        let activateSceneSwitchService = accessory.useService(Homebridge.Services.Switch, activateSceneSwitchName, `${activateSceneSwitchName}-switch`);
        this.activateSceneOnCharacteristic = activateSceneSwitchService.useCharacteristic<boolean>(Homebridge.Characteristics.On);

        platform.logger.info(`[${dimmerConfiguration.name}] Adding scene deactivator switch ${deactivateSceneSwitchName}`);
        let deactivateSceneSwitchService = accessory.useService(Homebridge.Services.Switch, deactivateSceneSwitchName, `${deactivateSceneSwitchName}-switch`);
        this.deactivateSceneOnCharacteristic = deactivateSceneSwitchService.useCharacteristic<boolean>(Homebridge.Characteristics.On);

        platform.logger.info(`[${dimmerConfiguration.name}] Adding scene disabler switch ${disableSceneSwitchName}`);
        let disableSceneSwitchService = accessory.useService(Homebridge.Services.Switch, disableSceneSwitchName, `${disableSceneSwitchName}-switch`);
        this.disableSceneOnCharacteristic = disableSceneSwitchService.useCharacteristic<boolean>(Homebridge.Characteristics.On);


        const setBulbBrightness = (brightness: number, callback?: () => any) => {
          setTimeout(() => {
            if (brightness === this.bulbBrightnessCharacteristic.value) { // if its already set, we need to reset it
              this.bulbBrightnessCharacteristic.value = this.unusedNumber
            }

            setTimeout(() => {
              this.bulbBrightnessCharacteristic.value = brightness
            }, 50)

            if (callback) callback()
          }, 50);
        }



        this.incOnCharacteristic.valueChanged = newValue => {
            if (newValue === false) {
              return
            }
            platform.logger.info(`[${incSwitchName}] switch activated`);
            platform.logger.info(`current index is ${this.currentIdx}`);
            if (this.currentIdx < this.values.length - 1) {
              this.currentIdx = this.currentIdx + 1;
              setBulbBrightness(this.values[this.currentIdx])
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
            setBulbBrightness(this.values[this.currentIdx])
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
          setBulbBrightness(this.values[this.currentIdx])
          setTimeout(() => this.toggleOnCharacteristic.value = false, 50);
        };


        this.activateSceneOnCharacteristic.valueChanged = newValue => {
          if (newValue === false) {
            return
          }
          platform.logger.info(`[${activateSceneSwitchName}] switch activated`);
          platform.logger.info(`current index is ${this.currentIdx}`);
          if (this.currentIdx === 0 && !this.disableSceneOnCharacteristic.value) {
            setBulbBrightness(this.sceneValues[this.sceneIdx])
            //TODO might have to add function to update currentIdx
            setTimeout(() => this.reportBrightnessCharacteristic.value = this.sceneValues[this.sceneIdx], 50);
          }
          setTimeout(() => this.activateSceneOnCharacteristic.value = false, 50);
        };

        this.deactivateSceneOnCharacteristic.valueChanged = newValue => {
          if (newValue === false) {
            return
          }
          platform.logger.info(`[${deactivateSceneSwitchName}] switch activated`);
          platform.logger.info(`current index is ${this.currentIdx}`);
          if (this.currentIdx > 0 && !this.disableSceneOnCharacteristic.value) {
            this.currentIdx = 0;
            setBulbBrightness(this.values[this.currentIdx])
          }
          setTimeout(() => this.deactivateSceneOnCharacteristic.value = false, 50);
        };

        // @ts-ignore
        this.disableSceneOnCharacteristic.valueChanged = newValue => {
          platform.logger.info(`[${disableSceneSwitchName}] switch toggled`);
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


        this.sceneBrightnessCharacteristic.valueChanged = newValue => {
          platform.logger.info(`new [${dimmerConfiguration.name} scene] brightness reported`);
          const closest = this.sceneValues.reduce(function(prev, curr) {
            return (Math.abs(curr - newValue) < Math.abs(prev - newValue) ? curr : prev);
          });
          const closestIdx = this.sceneValues.findIndex(x => x === closest);
          platform.logger.info(`new index is ${closestIdx}`);
          this.sceneIdx = closestIdx;
        };

        this.sceneOnCharacteristic.valueChanged = newValue => {
          if (!newValue) {
            platform.logger.info(`new [${dimmerConfiguration.name} scene] brightness reported`);
            const closest = this.sceneValues.reduce(function(prev, curr) {
              return (Math.abs(curr - 0) < Math.abs(prev - 0) ? curr : prev);
            });
            const closestIdx = this.sceneValues.findIndex(x => x === closest);
            platform.logger.info(`new index is ${closestIdx}`);
            this.sceneIdx = closestIdx;
          }
        };



        accessory.removeUnusedServices();
        setTimeout(() => this.incOnCharacteristic.value = false, 50);
        setTimeout(() => this.decOnCharacteristic.value = false, 50);
        setTimeout(() => this.activateSceneOnCharacteristic.value = false, 50);
        setTimeout(() => this.deactivateSceneOnCharacteristic.value = false, 50);
        setTimeout(() => this.disableSceneOnCharacteristic.value = false, 50);
        setTimeout(() => this.toggleOnCharacteristic.value = false, 50);
        setTimeout(() => this.bulbBrightnessCharacteristic.value = this.values[this.currentIdx], 50);
        setTimeout(() => this.sceneBrightnessCharacteristic.value = this.values[this.values.length - 1], 50);
    }

    private values: Array<number>;
    private sceneValues: Array<number>;
    private currentIdx: number;
    private sceneIdx: number;
    private unusedNumber: number;

    private incOnCharacteristic: Characteristic<boolean>;
    private decOnCharacteristic: Characteristic<boolean>;
    private toggleOnCharacteristic: Characteristic<boolean>;


    private activateSceneOnCharacteristic: Characteristic<boolean>;
    private deactivateSceneOnCharacteristic: Characteristic<boolean>;
    private disableSceneOnCharacteristic: Characteristic<boolean>;

    // @ts-ignore
    private bulbOnCharacteristic: Characteristic<boolean>;
    private bulbBrightnessCharacteristic: Characteristic<number>;
    private reportOnCharacteristic: Characteristic<boolean>;
    private reportBrightnessCharacteristic: Characteristic<number>;
    // @ts-ignore
    private sceneOnCharacteristic: Characteristic<boolean>;
    // @ts-ignore
    private sceneBrightnessCharacteristic: Characteristic<number>;

}
