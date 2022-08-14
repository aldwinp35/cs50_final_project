let files = [];
const alert = document.querySelector('.alert');
const flushHeadingOne = document.getElementById('flush-headingOne').children[0];
const mediaFilesWrapper = document.querySelector('#media-files-wrapper');
const addMediaFiles = document.querySelector('#add-media-files');
const uploadPreview = document.querySelector('.upload-preview');
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

// Support for mobile browser: https://stackoverflow.com/questions/20321202/not-showing-placeholder-for-input-type-date-field
// Make input readonly when input:type=text, not show keyboard on ios
inputDate.setAttribute('readonly', true);
inputDate.style.backgroundColor = '#fff';

// Change input to datetime-local
inputDate.addEventListener('focus', () => {
    inputDate.type = 'datetime-local';
    inputDate.removeAttribute('readonly');
});

// If input is empty, change it to text and readonly
inputDate.addEventListener('blur', () => {
    // Hide popover
    popover.hide();

    if (inputDate.value == '')
    {
        inputDate.type = 'text';
        inputDate.setAttribute('readonly', true);
    }
});

// Set min, max date for inputDate
const date = new Date();
const minDate = getIsoDate(date);
const maxDate = getIsoDate(addDays(date, 50));
inputDate.setAttribute('min', minDate);
inputDate.setAttribute('max', maxDate);

// Add file
addMediaFiles.addEventListener('change', mediaFilesHandler);
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

    const cropImg = new CropImage(uploadPreview, files);
    cropImg.display();

} // input file: addMediaFiles handler

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