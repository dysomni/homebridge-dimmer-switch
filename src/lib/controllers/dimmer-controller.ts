
import { Platform } from '../platform';
import { Homebridge, Characteristic } from 'homebridge-framework';
import { DimmerConfiguration } from '../configuration/dimmer-configuration';

const unused_value = (values: Array<number>) => {
  const hundred = Array.apply(null, Array(101)).map(function (_, i) { return i; })
  const unused = hundred.filter(n => !values.includes(n))
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

    this.sceneValues = dimmerConfiguration.sceneValues
    this.unusedNumber = unused_value(this.sceneValues)
    this.sceneIdx = this.sceneValues.length - 1

    let lightBulbService = accessory.useService(Homebridge.Services.Lightbulb, `${dimmerConfiguration.name}`)
    this.bulbOnCharacteristic = lightBulbService.useCharacteristic<boolean>(Homebridge.Characteristics.On);
    this.bulbBrightnessCharacteristic = lightBulbService.useCharacteristic<number>(Homebridge.Characteristics.Brightness)


    let sceneService = accessory.useService(Homebridge.Services.Lightbulb, `${dimmerConfiguration.name} Scene`, `${dimmerConfiguration.name}-scene-lightbulb`)
    this.sceneOnCharacteristic = sceneService.useCharacteristic<boolean>(Homebridge.Characteristics.On);
    this.sceneBrightnessCharacteristic = sceneService.useCharacteristic<number>(Homebridge.Characteristics.Brightness)

    // Creates all switches of the controller

    let toggleSwitchName = `${dimmerConfiguration.name} Toggle`
    platform.logger.info(`[${dimmerConfiguration.name}] Adding toggle switch ${toggleSwitchName}`);
    let toggleSwitchService = accessory.useService(Homebridge.Services.Switch, toggleSwitchName, `${toggleSwitchName}-switch`);
    this.toggleOnCharacteristic = toggleSwitchService.useCharacteristic<boolean>(Homebridge.Characteristics.On);

    let activateSceneSwitchName = `${dimmerConfiguration.name} Activate Scene`
    platform.logger.info(`[${dimmerConfiguration.name}] Adding scene activator switch ${activateSceneSwitchName}`);
    let activateSceneSwitchService = accessory.useService(Homebridge.Services.Switch, activateSceneSwitchName, `${activateSceneSwitchName}-switch`);
    this.activateSceneOnCharacteristic = activateSceneSwitchService.useCharacteristic<boolean>(Homebridge.Characteristics.On);

    let deactivateSceneSwitchName = `${dimmerConfiguration.name} Deactivate Scene`
    platform.logger.info(`[${dimmerConfiguration.name}] Adding scene deactivator switch ${deactivateSceneSwitchName}`);
    let deactivateSceneSwitchService = accessory.useService(Homebridge.Services.Switch, deactivateSceneSwitchName, `${deactivateSceneSwitchName}-switch`);
    this.deactivateSceneOnCharacteristic = deactivateSceneSwitchService.useCharacteristic<boolean>(Homebridge.Characteristics.On);


    const isDisabled = () => {
      const sceneValue = this.sceneValues[this.sceneIdx]
      return sceneValue === 0;
    }

    const currentBrightness = () => {
      const bulbBrightness = this.bulbBrightnessCharacteristic.value
      return bulbBrightness || 0
    }

    const setBulbBrightness = (brightness: number, callback?: () => any) => {
      setTimeout(() => {
        platform.logger.info(`setting brightness to ${brightness}`);
        platform.logger.info(`current brightness is ${currentBrightness()}`);
        var timer = 50
        if (brightness === currentBrightness()) { // if its already set, we need to reset it
          this.bulbBrightnessCharacteristic.value = this.unusedNumber
          timer = 1000
        }

        setTimeout(() => {
          this.bulbBrightnessCharacteristic.value = brightness
          if (brightness === 0) {
            this.bulbOnCharacteristic.value = false
          } else {
            this.bulbOnCharacteristic.value = true
          }
        }, timer)

        if (callback) callback()
      }, 50);
    }

    this.toggleOnCharacteristic.valueChanged = newValue => {
      if (newValue === false || isDisabled()) {
        return
      }
      platform.logger.info(`[${toggleSwitchName}] switch activated`);
      platform.logger.info(`current index is ${this.sceneIdx}`);
      if (currentBrightness() > 0) {
        setBulbBrightness(0)
      } else {
        setBulbBrightness(this.sceneValues[this.sceneIdx])
      }

      setTimeout(() => this.toggleOnCharacteristic.value = false, 50);
    };


    this.activateSceneOnCharacteristic.valueChanged = newValue => {
      if (newValue === false || isDisabled()) {
        return
      }
      platform.logger.info(`[${activateSceneSwitchName}] switch activated`);
      platform.logger.info(`current index is ${this.sceneIdx}`);

      setBulbBrightness(this.sceneValues[this.sceneIdx])

      setTimeout(() => this.activateSceneOnCharacteristic.value = false, 50);
    };

    this.deactivateSceneOnCharacteristic.valueChanged = newValue => {
      if (newValue === false || isDisabled()) {
        return
      }
      platform.logger.info(`[${deactivateSceneSwitchName}] switch activated`);
      platform.logger.info(`current index is ${this.sceneIdx}`);

      setBulbBrightness(0)

      setTimeout(() => this.deactivateSceneOnCharacteristic.value = false, 50);
    };

    this.sceneBrightnessCharacteristic.valueChanged = newValue => {
      platform.logger.info(`new [${dimmerConfiguration.name} scene] brightness reported`);
      const closest = this.sceneValues.reduce(function (prev, curr) {
        return (Math.abs(curr - newValue) < Math.abs(prev - newValue) ? curr : prev);
      });
      const closestIdx = this.sceneValues.findIndex(x => x === closest);
      platform.logger.info(`new index is ${closestIdx}`);
      this.sceneIdx = closestIdx;
    };

    this.sceneOnCharacteristic.valueChanged = newValue => {
      if (!newValue) {
        platform.logger.info(`new [${dimmerConfiguration.name} scene] brightness reported`);
        const closest = this.sceneValues.reduce(function (prev, curr) {
          return (Math.abs(curr - 0) < Math.abs(prev - 0) ? curr : prev);
        });
        const closestIdx = this.sceneValues.findIndex(x => x === closest);
        platform.logger.info(`new index is ${closestIdx}`);
        this.sceneIdx = closestIdx;
      }
    };



    accessory.removeUnusedServices();
    setTimeout(() => this.activateSceneOnCharacteristic.value = false, 50);
    setTimeout(() => this.deactivateSceneOnCharacteristic.value = false, 50);
    setTimeout(() => this.toggleOnCharacteristic.value = false, 50);
    setTimeout(() => this.bulbBrightnessCharacteristic.value = this.sceneValues[this.sceneIdx], 50);
    setTimeout(() => this.sceneBrightnessCharacteristic.value = this.sceneValues[this.sceneIdx], 50);
  }

  private sceneValues: Array<number>;
  private sceneIdx: number;
  private unusedNumber: number;

  private toggleOnCharacteristic: Characteristic<boolean>;


  private activateSceneOnCharacteristic: Characteristic<boolean>;
  private deactivateSceneOnCharacteristic: Characteristic<boolean>;

  // @ts-ignore
  private bulbOnCharacteristic: Characteristic<boolean>;
  private bulbBrightnessCharacteristic: Characteristic<number>;
  // @ts-ignore
  private sceneOnCharacteristic: Characteristic<boolean>;
  // @ts-ignore
  private sceneBrightnessCharacteristic: Characteristic<number>;

}
