let  image = null;
const alert = document.querySelector('.alert');
const flushHeadingOne = document.getElementById('flush-headingOne').children[0];
const inputFileWrapper = document.querySelector('#input-file-wrapper');
const inputFile = document.querySelector('#input-file');
const uploadPreview = document.querySelector('.upload-preview');
const savePostBtn = document.querySelector('#save-post-button');
const inputDate = document.querySelector('#date');
const inputCaption = document.querySelector('#caption');

const options = {
    content: 'Date to publish on instagram. No longer than 50 days',
    placement: 'top',
    trigger: 'focus',
}
const popover = new bootstrap.Popover(inputDate, options)

// Set min, max date for inputDate
const date = new Date();
const minDate = getIsoDate(date);
const maxDate = getIsoDate(addDays(date, 50));
inputDate.setAttribute('min', minDate);
inputDate.setAttribute('max', maxDate);

// Click to show file first
window.addEventListener('DOMContentLoaded', e => {
    flushHeadingOne.click();
});

// Support for mobile browser: https://stackoverflow.com/questions/20321202/not-showing-placeholder-for-input-type-date-field
if (window.innerWidth <= 768)
{
    // Make input readonly when input:type=text, not show keyboard on ios
    inputDate.setAttribute('readonly', true);
    inputDate.style.backgroundColor = '#fff';

    // Change input to datetime-local
    inputDate.addEventListener('mouseenter', () => {
        inputDate.click();
        inputDate.type = 'datetime-local';
        inputDate.removeAttribute('readonly');
    });

    // If input is empty, change it to text and readonly
    inputDate.addEventListener('mouseout', () => {
        // Hide popover
        popover.hide();

        if (inputDate.value == '')
        {
            inputDate.type = 'text';
            inputDate.setAttribute('readonly', true);
        }
    });
}
else
{
    inputDate.type = 'datetime-local';
}

// Add file
inputFile.addEventListener('change', inputFileHandler);
async function inputFileHandler(e)
{
    // Get image
    image = e.target.files[0];

    // Make sure image is jpg, jpeg
    if (image.type != "image/jpg" && image.type != "image/jpeg")
    {
        alert.classList.remove('d-none');
        alert.classList.add('alert-danger');
        alert.textContent = "File type not supported";
        return;
    }

    // Render image with cropper js
    const cropImage = new CropImage(uploadPreview, inputFileWrapper, image);
    cropImage.display();

} // inputFileHandler

// Save post button
savePostBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    // Make sure input date is not empty
    if (!validateInput(inputDate))
    {
        showInputError(inputDate);
        return;
    }

    // Make sure image is not null
    if (!validateInput(image))
    {
        alert.classList.remove('d-none');
        alert.classList.add('alert-danger');
        alert.textContent = "File is required";
        return;
    }

    // Image max. size 8 MB.
    const maxSize = 8 * 1000 * 1000;
    if (image.size > maxSize)
    {
        alert.classList.remove('d-none');
        alert.classList.add('alert-danger');
        alert.textContent = "File is too large";
        return;
    }

    const fd = new FormData();
    fd.append('date', inputDate.value);
    fd.append('caption', inputCaption.value);
    fd.append('image', image);

    // Send data
    try {
        const req = await fetch('/post/add', {
            method: 'POST',
            body: fd
        });

        const res = await req.json();

        if (res.ok)
        {
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