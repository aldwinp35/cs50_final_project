let files = [];
const alert = document.querySelector('.alert');
const flushHeadingOne = document.getElementById('flush-headingOne').children[0];
const mediaFilesWrapper = document.querySelector('#media-files-wrapper');
const add_media_files = document.querySelector('#add-media-files');
const upload_preview = document.querySelector('.upload-preview');
const btnSendForm = document.querySelector('#btnSendForm');
const inputDate = document.querySelector('#date');
const inputCaption = document.querySelector('#caption');

// Remove any file reference before reload
window.addEventListener('beforeunload', e => {
    removeBlob();
});

// Click to show file first
window.addEventListener('DOMContentLoaded', e => {
    flushHeadingOne.click();
});

// Popover instruction for date
const options = {
    content: 'Date to publish on instagram. No longer than 50 days',
    placement: 'top',
}
const popover = new bootstrap.Popover(inputDate, options)

// Hide popover on focusout
inputDate.addEventListener('focusout', () => {
    popover.hide();
});

// Set min date for inputDate
// const minDateObject = new Date();
// minDateObject.toLocaleString('en-US', {timeZone: 'America/Los_Angeles'});
// const minDate = minDateObject.toISOString().substring(0, minDateObject.toISOString().lastIndexOf(":"))
// inputDate.setAttribute('min', minDate);

add_media_files.addEventListener('change', mediaFilesHandler);
async function mediaFilesHandler(e)
{
    // Get file
    files.push(e.target.files[0]);

    // Validate files type (jpg, jpeg) are allowed
    if (!validateInputFile(files))
        return;

    // Hide "select media" area
    mediaFilesWrapper.classList.add('d-none');
    mediaFilesWrapper.parentElement.classList.remove('p-3');

    // Create a property URL for each File in files array
    for (let file of files)
    {
        file.url = URL.createObjectURL(file);
    }

    const cropImg = new CropImage(upload_preview, files);
    cropImg.display();

} // input file: add_media_files handler

// SEND DATA WITH POST REQUEST
btnSendForm.addEventListener('click', async (e) => {
    e.preventDefault();

    // Validate file size
    const maxSize = 8 * 1000 * 1000;
    if (files[0].size > maxSize)
    {
        alert.classList.remove('d-none');
        alert.classList.add('alert-danger');
        alert.textContent = "File is too large";
        return;
    }

    // Validate input date
    if (!validateInput(inputDate))
    {
        showInputError(inputDate);
        return;
    }

    // References: https://developer.mozilla.org/en-US/docs/Web/API/FormData
    const fd = new FormData();
    fd.append('date', inputDate.value);
    fd.append('caption', inputCaption.value);

    // Append every file in the formData
    for (let i = 0; i < files.length; i++)
    {
        fd.append('file' + i, files[i]);
    }

    // Send request
    try {
        const req = await fetch('/post/add', {
            method: 'POST',
            body: fd
        });

        const res = await req.json();

        if (res.ok)
        {
            // Remove file reference
            removeBlob();

            // Redirect to home page
            location.href = location.origin;
        }
        else
        {
            alert.classList.remove('d-none');
            alert.classList.add('alert-danger');
            alert.textContent =  res.msg;

            if (res.msg.toLowerCase().includes("file")) flushHeadingOne.click();
        }
    }

    catch (error)
    {
        console.error('Error:', error)
    }
});

// Remove blob reference from memory
function removeBlob()
{
    if (files.length > 0) {
        for (let f of files) {
            URL.revokeObjectURL(f.url);
        }
    }
}