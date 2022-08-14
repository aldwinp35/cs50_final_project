// Validate text/email inputs using regular expression
function validateInput(inputEl)
{
    // Validate email
    if (inputEl.type === "email")
    {

        const valid = inputEl.value.match(/[a-z\d]+\@[a-z\d]+\.com/g);
        if (valid === null || inputEl.value === "")
        {
            return false;
        }
    }

    if (inputEl.type === "number")
    {
        if (isNaN(inputEl.value) || inputEl.value < 1)
        {
            return false;
        }
    }

    // Validate text
    if (inputEl.value === "")
    {
        return false;
    }

    return true;
}

function avoidOverSizeFile(files, maxSize)
{
    let newFiles = [];

    for (let i = 0; i < files.length; i++)
    {
        if (files[i].size <= maxSize)
        {
            newFiles.push(files[i]);
        }
        else
        {
            console.log("File size is too big. File avoided: " + files[i].name);
        }
    }

    return newFiles;
}

function validateInputFile(files)
{

    if (files.length === 0)
    {
        alert.classList.remove('d-none');
        alert.classList.add('alert-danger');
        alert.textContent = "File is required";

        return false;
    }

    for (let i = 0; i < files.length; i++)
    {
        if (files[i].type !== "image/jpg" && files[i].type !== "image/jpeg")
        {
            alert.classList.remove('d-none');
            alert.classList.add('alert-danger');
            alert.textContent = "File type not supported";
            return false;
        }
    }

    return true;
}

// Add a red border around input element for 2 second
function showInputError(inputEl)
{
    inputEl.classList.add('input-text-error');

    setTimeout(() => {
        inputEl.classList.remove('input-text-error');
        inputEl.focus();
    }, 2000);
}

// Make http requests with fetch
async function request(url, method, data=null)
{
    if (method.toUpperCase() === "POST")
    {
        // POST request
        const headers = {'Content-Type': 'application/json'}

        try
        {
            const req = await fetch(url, {
                method,
                headers: headers,
                body: JSON.stringify(data)
            });

            return req.json();
        }
        catch (error)
        {
            console.error('Error:', error);
        }
    }
    else
    {
        // GET request
        try
        {
            const req = await fetch(url);
            return req.json();
        }
        catch (error)
        {
            console.error('Error', error);
        }
    }
}

/*
Parse string Nodes to HTML element

https://developer.mozilla.org/en-US/docs/Web/API/Range/createContextualFragment
https://developer.mozilla.org/en-US/docs/Web/API/Document/createRange
*/
function parseDom(html)
{
    const range = document.createRange();
    const nodes = range.createContextualFragment(html);
    return nodes;
}