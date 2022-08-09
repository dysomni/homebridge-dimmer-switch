
/**
 * Represents a group of switches that acts as a radio button group.
 */
export interface DimmerConfiguration {

    /**
     * Gets or sets the name of the group.
     */
    name: string;

    values: Array<number>;

    sceneValues: Array<number>;
}
