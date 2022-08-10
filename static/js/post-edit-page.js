const postId = document.getElementById('post_id');
const captionSection = document.querySelector('.caption-section');
const captionIcon = captionSection.querySelector('i');
const textarea = captionSection.querySelector('textarea');
const editPostNow = document.querySelector('.edit-post-now');
const editSaveChange = document.querySelector('.edit-save-change');
const editRemovePost = document.querySelector('.edit-remove-post');
const date = document.getElementById('date');
const form = document.querySelector('form');

// Set min date for inputDate
// const minDateObject = new Date();
// const minDate = minDateObject.toISOString().substring(0, minDateObject.toISOString().lastIndexOf(":"))
// date.setAttribute('min', minDate);


captionIcon.addEventListener('click', e => {

    if (e.target.classList.contains('bi-x-lg'))
    {
        e.target.classList.remove('bi-x-lg');
        e.target.classList.add('bi-pencil-fill');

        textarea.classList.add('readonly-textarea');
        textarea.setAttribute('readonly', '');
        return;
    }

    e.target.classList.remove('bi-pencil-fill');
    e.target.classList.add('bi-x-lg');

    textarea.classList.remove('readonly-textarea');
    textarea.removeAttribute('readonly');
    textarea.focus();
});

editPostNow.addEventListener('click', submitFormHandler);
editSaveChange.addEventListener('click', submitFormHandler);
editRemovePost.addEventListener('click', submitFormHandler);

async function submitFormHandler(e)
{
    e.preventDefault();

        // Validate input date
    if (!validateInput(date))
    {
        showInputError(date);
        return;
    }

    if (e.target == editPostNow)
    {
        console.log('Publish on instagram\n Not implemented yet');
        // form.action = `${location.origin}/post/publish/${postId.value}`;
        return;
    }
    else if (e.target == editRemovePost)
    {
        form.action = `${location.origin}/post/remove/${postId.value}`;
    }

    form.submit();
}