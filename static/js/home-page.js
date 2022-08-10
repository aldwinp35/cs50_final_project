// Post container
const postSection = document.querySelector('#post-section');

if (postSection !== null)
{
    // Sortable js library
    const sortable = new Sortable(postSection, {
        animation: 150,
        ghostClass: 'dragging',
        filter: '.filtered',
        async onUnchoose(e) {
            // Get indexes
            const newIndex = [...postSection.children].indexOf(e.item);
            const oldIndex = e.oldIndex;

            // Set normal size to post
            e.item.style.scale = 1;
            e.item.style.cursor = 'pointer';

            // Prepare and send data
            const data = {
                "start": {"index": oldIndex},
                "end": {"index": newIndex},
            }
            const alert = document.querySelector('.alert');
            const response = await request('/', 'POST', data);
            if (!response.ok) console.error('Could not change post date!\n', 'error_datail: ', response.msg);
            if (response.ok)
            {
                response.dates.forEach((date, index) => postSection.children[index].querySelector('.image-text').textContent = date);
                alert.textContent = response.msg;
                alert.className = 'alert alert-info';
            }

            e.item.classList.add('filtered');
        },
    });

    // Add event listener to each post
    const posts = document.querySelectorAll('.post-box');
    for (const post of posts)
    {
        post.classList.add('filtered');
        post.style.cursor = 'pointer';

        // Click event
        post.addEventListener('click', e => {
            e.preventDefault();

            // Only fired when filtered class is present
            if (e.target.classList.contains('filtered'))
            {
                const postId = e.target.querySelector('#post-id').value;
                location.href = `${location.href}post/edit/${postId}`;
            }
        });

        // Long press event when more than one post
        if (posts.length > 1)
        {
            post.addEventListener('long-press', e => {
                e.preventDefault();

                e.target.classList.remove('filtered');
                e.target.querySelector('.image-text').textContent = 'move';
                e.target.style.scale = 0.9;
                e.target.style.cursor = 'move';
            });
        }
    }
}