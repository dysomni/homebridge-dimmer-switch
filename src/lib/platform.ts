
import { HomebridgePlatform } from 'homebridge-framework';
import { Configuration } from './configuration/configuration';
import { DimmerController } from './controllers/dimmer-controller';

/**
 * Represents the platform of the plugin.
 */
export class Platform extends HomebridgePlatform<Configuration> {

    /**
     * Contains a list of all group controllers.
     */
    private controllers: Array<DimmerController> = new Array<DimmerController>();

    /**
     * Gets the name of the plugin.
     */
    public get pluginName(): string {
        return 'homebridge-dimmer-switch';
    }

    /**
     * Gets the name of the platform which is used in the configuration file.
     */
    public get platformName(): string {
        return 'DimmerSwitchPlatform';
    }

    /**
     * Is called when the platform is initialized.
     */
    public initialize() {
        this.logger.info(`Initializing platform...`);

        // Sets the API configuration
	    this.configuration.dimmers = this.configuration.dimmers || [];

        // Cycles over all configured groups and creates the corresponding controllers
        for (let dimmerConfiguration of this.configuration.dimmers) {
            if (dimmerConfiguration.name && dimmerConfiguration.values) {

                // Creates a new controller for the group
                const dimmerController = new DimmerController(this, dimmerConfiguration);
                this.controllers.push(dimmerController);
            } else {
                this.logger.warn(`Dimmer name missing in the configuration.`);
            }
        }
    }
}
