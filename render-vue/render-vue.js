const { createApp, ref, reactive } = Vue

// Run every time after record change
function render(elemId, content) {
    const el = document.getElementById(elemId);
    if (!content) {
        el.style.display = 'none';
    } else {
        el.innerHTML = content;
        // If we are allowing scripts, let them execute, which doesn't
        // normally happen when adding script elements using innerHTML.
        Array.from(el.querySelectorAll("script")).forEach(oldScript => {
            const newScript = document.createElement("script");
            Array.from(oldScript.attributes)
                .forEach(attr => newScript.setAttribute(attr.name, attr.value));
            newScript.appendChild(document.createTextNode(oldScript.innerHTML));
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
        el.style.display = 'block';
    }
}

grist.ready({
    columns: ["Html"],
    requiredAccess: 'read table'
});

let lastId = undefined;
let lastData = undefined;

// Helper function that reads first value from a table with a single column.
function singleColumn(record) {
    const columns = Object.keys(record || {}).filter(k => k !== 'id');
    return columns.length === 1 ? record[columns[0]] : undefined;
}

grist.onNewRecord(() => {
    render("error", null);
    render("rendered", "");
    lastData = "";
    lastId = 0;
});

grist.onRecord(function (record) {
    // If user picked all columns, this helper function will return a mapped record.
    const mapped = grist.mapColumnNames(record);
    // We will fallback to reading a value from a single column to
    // support old way of mapping (exposing only a single column).
    // New widgets should only check if mapped object is truthy.
    const data = mapped ? mapped.Html : singleColumn(record);
    if (data === undefined) {
        render("error", "Please choose a column to show in the Creator Panel.");
    } else {
        render("error", null);
        if (lastId !== record.id || lastData !== data) {
            render("rendered", String(data || ''));
        }
        lastId = record.id;
        lastData = data;
    }
});