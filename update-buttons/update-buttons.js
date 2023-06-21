const { createApp, ref } = Vue

function setup() {
    const status = ref('waiting');
    const results = ref();
    const input = reactive({
        description: null,
        button: null,
        actions: null,
    });

    function handleError(err) {
        console.error('ERROR', err);
        status.value = String(err).replace(/^Error: /, '');
    }
    
    async function applyActions() {
        results.value = "Working...";
        try {
            await grist.docApi.applyUserActions(input.value.actions);
            message.value = 'Done';
        } catch (e) {
            message.value = `Please grant full access for writing. (${e})`;
        }
    }
    
    function onRecord(row, mappings) {
        try {
            status.value = '';
            results.value = null;
            // If there is no mapping, test the original record.
            row = grist.mapColumnNames(row) || row;
            if (!row.hasOwnProperty(column)) {
                throw new Error(`Need a visible column named "${column}". You can map a custom column in the Creator Panel.`);
            }
            const keys = ['button', 'description', 'actions'];
            if (!row[column] || keys.some(k => !row[column][k])) {
                const allKeys = keys.map(k => JSON.stringify(k)).join(", ");
                const missing = keys.filter(k => !row[column]?.[k]).map(k => JSON.stringify(k)).join(", ");
                const gristName = mappings?.[column] || column;
                throw new Error(`"${gristName}" cells should contain an object with keys ${allKeys}. ` +
                    `Missing keys: ${missing}`);
            }
            Object.assign(input, row[column]);
        } catch (err) {
            handleError(err);
        }
    }

    // Update the widget anytime the document data changes.
    grist.ready({ columns: [{ name: 'UpdateButtons', title: "UpdateButtons" }] });
    grist.onRecord(onRecord);

    return {
        status,
        result,
        input,
        applyActions
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