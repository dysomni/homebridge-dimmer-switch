
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
            if (dimmerConfiguration.name && dimmerConfiguration.switches) {

                // Checks whether the switches are configured properly
                if (dimmerConfiguration.switches.some(s => !s.name)) {
                    this.logger.warn(`[${dimmerConfiguration.name}] Switches are not configured properly.`);
                    continue;
                }
                if (dimmerConfiguration.switches.filter(s => s.isDefaultOn).length > 1) {
                    this.logger.warn(`[${dimmerConfiguration.name}] Multiple switches are set as default on. This is not a valid configuration.`);
                    continue;
                }

                // Creates a new controller for the group
                const groupController = new DimmerController(this, dimmerConfiguration);
                this.controllers.push(groupController);
            } else {
                this.logger.warn(`Group name missing in the configuration.`);
            }
        }
    }
}
