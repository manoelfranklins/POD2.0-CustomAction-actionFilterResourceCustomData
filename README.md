# Filter Resource Custom Data Action

A POD 2.0 Custom Action that extracts a specific attribute value from a resource's `customValues` array and stores it in PodContext.

<img width="994" height="399" alt="image" src="https://github.com/user-attachments/assets/0b5ee660-beaf-4e34-844a-42b411c786a1" />

## Use Case

This action is useful when you need to filter and extract custom values by attribute in SAP Digital Manufacturing POD 2.0.

## Configuration Properties

| Property | Description | Example |
|----------|-------------|---------|
| **Custom Values Path** | PodContext path to the customValues array. **Use plain path, NOT bind expression** | `/filter/resources/0/customValues` |
| **Attribute Name** | The attribute name to search for | `OEE_KPI_TARGET` |
| **Output Context Path** | PodContext path where the result will be stored | `kpiTarget` |
| **Default Value** | Value to return if attribute not found (optional) | `N/A` |

<img width="994" height="399" alt="image" src="https://github.com/user-attachments/assets/0b5ee660-beaf-4e34-844a-42b411c786a1" />

### ⚠️ Important: Custom Values Path

**Use a plain path string, NOT a bind expression:**

✅ **Correct:** `/filter/resources/0/customValues`

❌ **Incorrect:** `{/filter/resources/0/customValues}`

The action will automatically strip braces if you accidentally include them, but for clarity, use the plain path.

**Why?** Bind expressions like `{/path}` work for single values (strings, numbers), but arrays don't resolve properly through action property binding. The action reads the array directly from PodContext using `PodContext.get()`.

## Installation

### Step 1: Create ZIP Package

Ensure the folder structure is:

```
filterResourceCustomData.zip/
├── extension.json          ← At root level!
└── action/
    └── FilterResourceCustomDataAction.js
```

### Step 2: Upload to Manage PODs 2.0

1. Open **SAP Digital Manufacturing**
2. Navigate to **Manage PODs 2.0**
3. Select the **Extensions** tab
4. Click **Upload**
5. Fill in:
   - **Name**: `Filter Resource Custom Data`
   - **Namespace**: `custom/filtercustomdata`
   - **Source Code**: Upload the ZIP file
6. Click **Save**

## Configuration

Using any Event, (‘Enter Page’ for example) attach the custom Action and configure accordingly:

<img width="1918" height="580" alt="image" src="https://github.com/user-attachments/assets/1c55c43d-acc6-49ce-b699-c7a456fc4587" />

So, as soon as the event is triggered, the Value of the configured Attribute will be available in POD context via ‘Output Context Path’, in this case {/resourceAttribute}:

<img width="764" height="362" alt="image" src="https://github.com/user-attachments/assets/e77ea79d-9fb4-417b-8570-90d50c02175d" />

For my test resource, the value of ‘OEE_LB_KPI_TARGET’ is ‘Manoel Costa’

<img width="1268" height="515" alt="image" src="https://github.com/user-attachments/assets/ca6d77cd-7508-4e4b-96ae-4a9775f06d62" />

So when I give it a try, I see:

<img width="420" height="236" alt="image" src="https://github.com/user-attachments/assets/87bb416a-2255-47d9-a780-3f80a1bc0204" />

## Usage Example

### Scenario: Filter and Extract Resource Custom Value by Attribute

1. Add the action to your POD in the POD Designer
2. Configure the action properties:
   - **Custom Values Path**: `/filter/resources/0/customValues` *(plain path, no braces!)*
   - **Attribute Name**: `OEE_KPI_TARGET`
   - **Output Context Path**: `oeeKpiTarget`
   - **Default Value**: `0`

3. Trigger the action (e.g., on button click or page load)

4. The extracted value will be available at:
   - `/oeeKpiTarget` - The value (e.g., `OEE_LB_KPI_TARGET`)
   
### Using the Result in Other Widgets

Other widgets can access the extracted value using:
- Bind expression: `{/oeeKpiTarget}`
- Programmatically: `PodContext.get("/oeeKpiTarget")`

## Output

### Success Case

```javascript
// /oeeKpiTarget
"OEE_LB_KPI_TARGET"

// /oeeKpiTarget_details
{
    "found": true,
    "value": "OEE_LB_KPI_TARGET",
    "attribute": "OEE_KPI_TARGET"
}
```

### Not Found Case

```javascript
// /oeeKpiTarget
"0" // (default value)

// /oeeKpiTarget_details
{
    "found": false,
    "value": "0",
    "attribute": "UNKNOWN_ATTRIBUTE",
    "availableAttributes": ["OEE_KPI_TARGET", "AVAILABILITY_KPI_TARGET", ...]
}
```

## Multiple Extractions

To extract multiple attributes, add multiple instances of this action with different configurations:

| Action Instance | Attribute Name | Output Context Path |
|-----------------|---------------|---------------------|
| Action 1 | `OEE_KPI_TARGET` | `oeeKpiTarget` |
| Action 2 | `AVAILABILITY_KPI_TARGET` | `availabilityKpiTarget` |
| Action 3 | `PERFORMANCE_KPI_TARGET` | `performanceKpiTarget` |
| Action 4 | `QUALITY_KPI_TARGET` | `qualityKpiTarget` |

## Debugging

Open browser console to see debug logs:

```
[FilterResourceCustomDataAction] Input customValues: [...]
[FilterResourceCustomDataAction] Looking for attribute: OEE_KPI_TARGET
[FilterResourceCustomDataAction] Result: {found: true, value: "OEE_LB_KPI_TARGET", ...}
[FilterResourceCustomDataAction] Stored value at: /oeeKpiTarget = OEE_LB_KPI_TARGET
```

## Error Handling

The action handles the following error cases:
- Invalid or missing customValues array
- Invalid or missing attribute name
- Missing output context path
- Runtime errors

In all error cases, the default value is stored in the output context path.

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | February 2026 | Initial release |

---

👨‍💻 Author
Manoel Costa http://manoelcosta.com/

Disclaimer: This is a community extension and is not officially supported by SAP. Use at your own discretion.
