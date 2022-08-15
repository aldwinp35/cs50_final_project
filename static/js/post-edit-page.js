const alert = document.querySelector('.alert');
const postId = document.getElementById('post_id');
const captionSection = document.querySelector('.caption-section');
const inputDate = document.getElementById('date');
const inputCaption = captionSection.querySelector('textarea');
const captionIcon = captionSection.querySelector('i');
const btnRemovePost = document.querySelector('.edit-remove-post');
const btnPostNow = document.querySelector('.edit-post-now');
const btnSaveChange = document.querySelector('.edit-save-change');
const form = document.querySelector('form');

// Set min, max date for inputDate
const date = new Date();
const minDate = getIsoDate(date);
const maxDate = getIsoDate(addDays(date, 50));
inputDate.setAttribute('min', minDate);
inputDate.setAttribute('max', maxDate);

// Edit caption button
captionIcon.addEventListener('click', e => {

    if (e.target.classList.contains('bi-x-lg'))
    {
        e.target.classList.remove('bi-x-lg');
        e.target.classList.add('bi-pencil-fill');

        inputCaption.classList.add('readonly-textarea');
        inputCaption.setAttribute('readonly', '');
        return;
    }

    e.target.classList.remove('bi-pencil-fill');
    e.target.classList.add('bi-x-lg');

    inputCaption.classList.remove('readonly-textarea');
    inputCaption.removeAttribute('readonly');
    inputCaption.focus();
});

btnPostNow.addEventListener('click', submitFormHandler);
btnSaveChange.addEventListener('click', submitFormHandler);
btnRemovePost.addEventListener('click', submitFormHandler);

async function submitFormHandler(e)
{
    e.preventDefault();

    if (e.target == btnPostNow)
    {
        // Validate input date
        if (!validateInput(inputDate))
        {
            showInputError(inputDate);
            return;
        }

        form.action = `${location.origin}/post/publish/${postId.value}`;
        form.submit();
    }
    else if (e.target == btnRemovePost)
    {
        form.action = `${location.origin}/post/remove/${postId.value}`;
        form.submit();
    }

    // Send by fetch request
    // References: https://developer.mozilla.org/en-US/docs/Web/API/FormData
    const formData = new FormData(form);

    // Validate input date
    if (!validateInput(inputDate))
    {
        showInputError(inputDate);
        return;
    }

    try {
        const req = await fetch(`/post/edit/${postId.value}`, {
            method: 'POST',
            body: formData
        });

        const res = await req.json();

        if (res.ok)
        {
            location.href = location.origin;
        }
        else
        {
            alert.classList.remove('d-none');
            alert.classList.add('alert-danger');
            alert.textContent =  res.msg;
        }
    }

    catch (error)
    {
        console.error('Error:', error)
    }
}