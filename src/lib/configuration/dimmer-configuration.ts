
/**
 * Represents a group of switches that acts as a radio button group.
 */
export interface DimmerConfiguration {

    /**
     * Gets or sets the name of the group.
     */
    name: string;

    /**
     * Gets or sets a value that determines whether outlets should be exposed instead of switches.
     */
    values: Array<number>;
}
