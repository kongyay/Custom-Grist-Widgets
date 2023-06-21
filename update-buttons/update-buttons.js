const { createApp, ref, reactive } = Vue

function setup() {
    const BUTTONS_COLUMN = 'Buttons'
    const TARGET_COLUMN = 'Target'
    const tableId = ref();
    const rowId = ref();
    const colId = ref();
    const errMsg = ref('');
    const isLoading = ref(false);
    const choices = ref([]);
    const selectedValue = ref();
    const currentValue = ref();
    
    async function doAction(index) {
        if(!tableId.value || !rowId.value || !colId.value) {
            errMsg.value = "Incomplete Ids"
            return;
        }
        isLoading.value = true;
        try {
            const choice = choices.value[index]
            selectedValue.value = choice.value;
            const res = await grist.docApi.applyUserActions([ ['UpdateRecord', tableId.value, rowId.value, {
                [colId.value]: choice.value
              }]])
            console.log('Updated', tableId.value, rowId.value, colId.value, res);
        } catch (e) {
            console.error(e);
            errMsg.value = `Please grant full access for writing. (${e})`;
        }
        isLoading.value = false;
    }

    grist.onRecord((row, mappings) => {
        try {
            rowId.value = row.id
            errMsg.value = '';
            isLoading.value = false;
            if(!colId.value && !mappings?.[TARGET_COLUMN]) {
                throw new Error(`Need a visible column named "${TARGET_COLUMN}".`);
            }
            colId.value = mappings[TARGET_COLUMN];
            // If there is no mapping, test the original record.
            row = grist.mapColumnNames(row) || row;
            if (!row[BUTTONS_COLUMN]) {
                throw new Error(`Need a visible column named "${BUTTONS_COLUMN}".`);
            }
            const newChoices = row[BUTTONS_COLUMN];
            if(!Array.isArray(newChoices)) {
                throw new Error(`Column "${BUTTONS_COLUMN}" is not an array`);
            }
            for(let i=0; i < newChoices.length; i+=1) {
                const keys = ['label', 'value'];
                const choice = newChoices[i]
                if (!choice || keys.some(k => !choice[k])) {
                    const allKeys = keys.map(k => JSON.stringify(k)).join(", ");
                    const missing = keys.filter(k => !choice?.[k]).map(k => JSON.stringify(k)).join(", ");
                    const buttonColumnId = mappings?.[BUTTONS_COLUMN] || BUTTONS_COLUMN;
                    throw new Error(`
                        "${buttonColumnId}" index=${i} should contain an object with keys ${allKeys}. 
                        Missing keys: ${missing}.
                    `);
                }
            }
            choices.value = newChoices;
            currentValue.value = row[TARGET_COLUMN];
        } catch (err) {
            console.error('ERROR', err);
            errMsg.value = err;
        }
    });

    // Update the widget anytime the document data changes.
    grist.ready({ columns: [{ name: BUTTONS_COLUMN }, { name: TARGET_COLUMN }] });

    grist.on('message', (e) => {
        if (e.tableId) { tableId.value = e.tableId; }
    });

    return {
        errMsg,
        isLoading,
        choices,
        selectedValue,
        currentValue,
        doAction
    }
}

function init() {
    createApp({ setup }).mount('#app')
}

if (document.readyState !== 'loading'){
    init();
} else {
    document.addEventListener('DOMContentLoaded', init);
}