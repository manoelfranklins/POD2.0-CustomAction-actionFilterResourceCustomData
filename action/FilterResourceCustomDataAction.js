sap.ui.define([
    "sap/dm/dme/pod2/action/Action",
    "sap/dm/dme/pod2/action/metadata/ActionProperty",
    "sap/dm/dme/pod2/context/PodContext",
    "sap/dm/dme/pod2/propertyeditor/StringPropertyEditor"
],
/**
 * @param {typeof sap.dm.dme.pod2.action.Action} Action
 * @param {typeof sap.dm.dme.pod2.action.metadata.ActionProperty} ActionProperty
 * @param {typeof sap.dm.dme.pod2.context.PodContext} PodContext
 * @param {typeof sap.dm.dme.pod2.propertyeditor.StringPropertyEditor} StringPropertyEditor
 */
(Action, ActionProperty, PodContext, StringPropertyEditor) => {
    "use strict";

    const PropertyId = Object.freeze({
        CustomValuesPath: "customValuesPath",
        AttributeName: "attributeName",
        OutputContextPath: "outputContextPath",
        DefaultValue: "defaultValue"
    });

    /**
     * Custom Action to filter resource customValues array and extract a specific attribute's value.
     * 
     * This action is useful for extracting KPI targets or other custom data from resource configurations.
     * 
     * Input customValues structure:
     * [
     *   { "attribute": "OEE_KPI_TARGET", "value": "OEE_LB_KPI_TARGET" },
     *   { "attribute": "AVAILABILITY_KPI_TARGET", "value": "AVLB_KPI_TARGET" },
     *   ...
     * ]
     * 
     * @alias custom.filtercustomdata.action.FilterResourceCustomDataAction
     * @extends sap.dm.dme.pod2.action.Action
     */
    class FilterResourceCustomDataAction extends Action {
        
        /**
         * PodContext path to the customValues array (e.g., {/filter/resources/0/customValues})
         * @type {string}
         */
        #sCustomValuesPath = null;
        
        /**
         * The attribute name to search for in the customValues array
         * @type {string}
         */
        #sAttributeName = null;
        
        /**
         * PodContext path where the result will be stored
         * @type {string}
         */
        #sOutputContextPath = null;
        
        /**
         * Default value to return if attribute is not found
         * @type {string}
         */
        #sDefaultValue = null;

        /**
         * Gets the display name to show in the action palette of the POD Designer.
         * @override
         * @returns {string}
         */
        static getDisplayName() {
            return "Filter Resource Custom Data";
        }

        /**
         * Gets a description of the action.
         * @override
         * @returns {string}
         */
        static getDescription() {
            return "Extracts a specific attribute value from a resource's customValues array and stores it in PodContext.";
        }

        /**
         * Creates a new instance of the FilterResourceCustomDataAction.
         * @override
         * @param {sap.dm.dme.pod2.action.Action.ActionConfig} oConfig The action configuration.
         */
        constructor(oConfig) {
            super(oConfig);
            this.#sCustomValuesPath = this.getPropertyValue(PropertyId.CustomValuesPath);
            this.#sAttributeName = this.getPropertyValue(PropertyId.AttributeName);
            this.#sOutputContextPath = this.getPropertyValue(PropertyId.OutputContextPath);
            this.#sDefaultValue = this.getPropertyValue(PropertyId.DefaultValue);
        }

        /**
         * Extracts the value for a given attribute from a customValues array.
         * 
         * @param {Array<{attribute: string, value: string}>} aCustomValues - Array of custom value objects
         * @param {string} sAttributeName - The attribute name to search for
         * @param {string} sDefaultValue - Default value if attribute not found
         * @returns {{found: boolean, value: string, attribute: string}} Result object with found status and value
         * @private
         */
        #getCustomValueByAttribute(aCustomValues, sAttributeName, sDefaultValue = "") {
            // Validate inputs
            if (!aCustomValues || !Array.isArray(aCustomValues)) {
                console.warn("[FilterResourceCustomDataAction] customValues is not a valid array");
                return {
                    found: false,
                    value: sDefaultValue,
                    attribute: sAttributeName,
                    error: "customValues is not a valid array"
                };
            }

            if (!sAttributeName || typeof sAttributeName !== "string") {
                console.warn("[FilterResourceCustomDataAction] attributeName is not a valid string");
                return {
                    found: false,
                    value: sDefaultValue,
                    attribute: sAttributeName,
                    error: "attributeName is not a valid string"
                };
            }

            // Find matching attribute (case-insensitive search option)
            const oMatch = aCustomValues.find(oCustomValue => {
                if (!oCustomValue || typeof oCustomValue.attribute !== "string") {
                    return false;
                }
                return oCustomValue.attribute === sAttributeName;
            });

            if (oMatch) {
                return {
                    found: true,
                    value: oMatch.value || "",
                    attribute: sAttributeName
                };
            }

            return {
                found: false,
                value: sDefaultValue,
                attribute: sAttributeName,
                availableAttributes: aCustomValues
                    .filter(cv => cv && cv.attribute)
                    .map(cv => cv.attribute)
            };
        }

        /**
         * Executes the action - filters customValues and stores result in PodContext.
         * 
         * @override
         * @param {sap.dm.dme.pod2.action.ActionContext} oActionContext - The action context
         * @returns {Promise<void>}
         */
        async execute(oActionContext) {
            // Only execute in run mode
            if (!PodContext.isRunMode()) {
                return;
            }

            // Validate required properties
            if (!this.#sAttributeName) {
                console.error("[FilterResourceCustomDataAction] Attribute Name property is required");
                return;
            }

            if (!this.#sOutputContextPath) {
                console.error("[FilterResourceCustomDataAction] Output Context Path property is required");
                return;
            }

            try {
                // Get customValues from PodContext
                // The path should be provided as a plain string like "/filter/resources/0/customValues"
                // NOT as a bind expression like "{/filter/resources/0/customValues}"
                let sContextPath = this.#sCustomValuesPath;
                
                // Remove bind expression braces if present (user might have used {path} syntax)
                if (sContextPath && sContextPath.startsWith("{") && sContextPath.endsWith("}")) {
                    sContextPath = sContextPath.slice(1, -1);
                    console.log("[FilterResourceCustomDataAction] Removed bind expression braces, path is now:", sContextPath);
                }
                
                // Ensure path starts with /
                if (sContextPath && !sContextPath.startsWith("/")) {
                    sContextPath = "/" + sContextPath;
                }

                console.log("[FilterResourceCustomDataAction] Reading from PodContext path:", sContextPath);
                
                // Try to get the customValues array directly from PodContext
                let aCustomValues = sContextPath ? PodContext.get(sContextPath) : null;
                
                // If still undefined, try to check if the input was already resolved (for single values)
                if (aCustomValues === undefined && this.#sCustomValuesPath) {
                    // Check if the property value itself is already an array (resolved bind expression)
                    if (Array.isArray(this.#sCustomValuesPath)) {
                        aCustomValues = this.#sCustomValuesPath;
                        console.log("[FilterResourceCustomDataAction] Property was already resolved to array");
                    }
                }

                console.log("[FilterResourceCustomDataAction] Input customValues:", aCustomValues);
                console.log("[FilterResourceCustomDataAction] Type of customValues:", typeof aCustomValues, Array.isArray(aCustomValues) ? "(is array)" : "(not array)");
                console.log("[FilterResourceCustomDataAction] Looking for attribute:", this.#sAttributeName);

                // Extract the value
                const oResult = this.#getCustomValueByAttribute(
                    aCustomValues,
                    this.#sAttributeName,
                    this.#sDefaultValue || ""
                );

                console.log("[FilterResourceCustomDataAction] Result:", oResult);

                // Store result in PodContext
                let sOutputPath = this.#sOutputContextPath;
                if (sOutputPath && !sOutputPath.startsWith("/")) {
                    sOutputPath = "/" + sOutputPath;
                }

                // Store the value (or the full result object for debugging)
                PodContext.set(sOutputPath, oResult.value);

                // Optionally store full result object for debugging/advanced use cases
                PodContext.set(sOutputPath + "_details", oResult);

                console.log("[FilterResourceCustomDataAction] Stored value at:", sOutputPath, "=", oResult.value);

            } catch (oError) {
                console.error("[FilterResourceCustomDataAction] Error:", oError);
                
                // Store error state
                if (this.#sOutputContextPath) {
                    let sOutputPath = this.#sOutputContextPath;
                    if (!sOutputPath.startsWith("/")) {
                        sOutputPath = "/" + sOutputPath;
                    }
                    PodContext.set(sOutputPath, this.#sDefaultValue || "");
                    PodContext.set(sOutputPath + "_details", {
                        found: false,
                        value: this.#sDefaultValue || "",
                        error: oError.message
                    });
                }
            }
        }

        /**
         * Gets the configurable properties of the action.
         * @override
         * @returns {Array<sap.dm.dme.pod2.action.metadata.ActionProperty>}
         */
        getProperties() {
            return [
                new ActionProperty({
                    displayName: "Custom Values Path",
                    description: "PodContext path to the customValues array (e.g., /filter/resources/0/customValues). Can use bind expressions like {/filter/resources/0/customValues}",
                    propertyEditor: new StringPropertyEditor(this, PropertyId.CustomValuesPath)
                }),
                new ActionProperty({
                    displayName: "Attribute Name",
                    description: "The attribute name to search for (e.g., OEE_KPI_TARGET, AVAILABILITY_KPI_TARGET). Can use bind expressions.",
                    propertyEditor: new StringPropertyEditor(this, PropertyId.AttributeName)
                }),
                new ActionProperty({
                    displayName: "Output Context Path",
                    description: "PodContext path where the extracted value will be stored (e.g., /kpiTarget). Do not include leading slash.",
                    propertyEditor: new StringPropertyEditor(this, PropertyId.OutputContextPath)
                }),
                new ActionProperty({
                    displayName: "Default Value",
                    description: "Value to use if the attribute is not found (optional, defaults to empty string)",
                    propertyEditor: new StringPropertyEditor(this, PropertyId.DefaultValue)
                })
            ];
        }
    }

    return FilterResourceCustomDataAction;
});