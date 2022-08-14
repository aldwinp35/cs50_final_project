class CropImage
{
    files;
    cropper;
    cropBtn;
    removeBtn;
    saveCropBtn;
    containerEl;
    currentMediaEl;
    currentMediaWrapperEl;

    MAX_WIDTH_SIZE = 1080;
    MAX_HEIGHT_SIZE = 1350;
    MIN_SIZE = 320;

    constructor(containerEl, files)
    {
        this.containerEl = containerEl;
        this.files = files;
    }

    display()
    {
        this.currentMediaWrapperEl = document.createElement('div');
        this.currentMediaWrapperEl.classList.add('current-media-wrapper');

        // Create currentMediaEl tag for cropping
        this.currentMediaEl = document.createElement('img');
        this.currentMediaEl.classList.add('current-media-crop');
        this.currentMediaEl.src = this.files[0].url;

        // Append elements to current media wrapper
        this.currentMediaWrapperEl.append(this.currentMediaEl);

        // Create buttons (remove, crop)
        this.removeBtn = document.createElement('button'); this.removeBtn.className = 'button button-remove';
        const removeBtnIcon = document.createElement('i'); removeBtnIcon.className = 'bi bi-trash3 button-icon-event';
        this.removeBtn.appendChild(removeBtnIcon);
        this.removeBtn.addEventListener('click', e => this.remove(e));

        this.cropBtn = document.createElement('button'); this.cropBtn.className = 'button button-crop';
        const cropBtnIcon = document.createElement('i'); cropBtnIcon.className = 'bi bi-crop button-icon-event';
        this.cropBtn.appendChild(cropBtnIcon);
        this.cropBtn.addEventListener('click', e => this.toggleCropButtons(e));

        this.saveCropBtn = document.createElement('button'); this.saveCropBtn.className = 'button button-save-crop d-none';
        const saveCropBtnIcon = document.createElement('i'); saveCropBtnIcon.className = 'bi bi-check2 button-icon-event';
        this.saveCropBtn.appendChild(saveCropBtnIcon);

        // Append buttons to container
        this.currentMediaWrapperEl.append(this.removeBtn, this.cropBtn, this.saveCropBtn);

        // Append elements to carousel container
        this.containerEl.appendChild(this.currentMediaWrapperEl);

        // Initialize cropperjs
        const _this = this;
        this.cropper = new Cropper(this.currentMediaEl, {
            aspectRatio: 1,
            autoCrop: false,
            viewMode: 1,
            dragMode: 'move',
            zoomOnWheel: false,
            toggleDragModeOnDblclick: false,
            cropBoxResizable: false,
            background: false,
            minCropBoxWidth: 320,
            movable: false,
            ready() {
                _this.checkLoadedImage();
            }
        });
    }

    // Remove current media
    remove(e)
    {
        e.preventDefault();

        // Remove file from memory
        URL.revokeObjectURL(this.files[0].url);
        this.files.pop();

        // Remove container items
        for (let i = 0; i < this.containerEl.childElementCount; i++)
        {
            this.containerEl.children[i].remove();
        }

        // This element is a child of containerEl, but because is not a class property containerEl don't recognized
        // That's why here we remove it manually.
        const btnRatioContainer = document.querySelector('.btn-ratio-container');
        if (btnRatioContainer != null)
            btnRatioContainer.remove();

        // Show input file again
        const mediaFilesWrapper = document.querySelector('#media-files-wrapper');
        mediaFilesWrapper.classList.remove('d-none');
        mediaFilesWrapper.parentElement.classList.add('p-3');
    }

    // Toogle between (remove, crop) and (close, saveCrop) buttons.
    // When the picture is loaded. (remove and crop) btn are shown.
    // When crop btn is clicked, (close, and save) will show
    // Also cropBox, and aspect ratio buttons will show too
    toggleCropButtons(e)
    {
        e.preventDefault();

        // Make sure only one click goes through
        if (!e.detail || e.detail == 1)
        {
            // Aspect ratio buttons
            const btnRatioContainer = document.querySelector('.btn-ratio-container');
            // When cropBtn is clicked, If aspect ratio buttons doesn't exist
            if (btnRatioContainer === null)
            {
                // Hide removeBtn
                this.removeBtn.classList.add('d-none');

                // Change cropBtn icon (crop to close icon) and move it all the way to the left side
                this.cropBtn.firstChild.classList.remove('bi-crop');
                this.cropBtn.firstChild.classList.add('bi-x-lg');
                this.cropBtn.style = 'left: 5px; right: unset;';

                // Show saveCropBtn that will appear at the right side
                this.saveCropBtn.classList.remove('d-none');

                // Show cropBox
                this.cropper.crop();

                // Create and show aspect ratio buttons
                this.aspectRatioButtons();

                // Click on the aspect ratio 1:1 (square) to make it show first
                document.querySelector('.ratio_square').parentElement.click();
            }

            // If aspect ratio buttons exists, but they are hidden
            else
            {
                if (btnRatioContainer.classList.contains('d-none'))
                {
                    // Hide removeBtn
                    this.removeBtn.classList.add('d-none');

                    // Change cropBtn icon (crop to close icon) and move it all the way to the left side
                    this.cropBtn.firstChild.classList.remove('bi-crop');
                    this.cropBtn.firstChild.classList.add('bi-x-lg');
                    this.cropBtn.style = 'left: 5px; right: unset;';

                    // Show saveCropBtn that will appear at the right side
                    this.saveCropBtn.classList.remove('d-none');

                    // Show aspect ratio buttons
                    btnRatioContainer.classList.remove('d-none');

                    // Show cropBox
                    this.cropper.crop();

                    // Click on default aspect ratio (square ratio)
                    document.querySelector('.ratio_square').parentElement.click();
                }

                // If aspect ratio buttons are shown
                else
                {
                    // Show removeBtn
                    this.removeBtn.classList.remove('d-none');

                    // Change cropBtn icon (close to crop icon) and move it all the way to the right side
                    this.cropBtn.firstChild.classList.add('bi-crop');
                    this.cropBtn.firstChild.classList.remove('bi-x-lg');
                    this.cropBtn.style = 'left: unset; right: 5px;';

                    // Hide saveCropBtn, aspect ratio buttons and cropBox
                    this.saveCropBtn.classList.add('d-none');
                    btnRatioContainer.classList.add('d-none');
                    this.cropper.clear();
                }
            }
        }
    }

    // Create and display aspect ratio buttons
    aspectRatioButtons(image=null)
    {
        // When cropImage method is used, it will re-create the aspect ratio buttons
        // With the new image size by calling this method again.
        // For that reason, if aspect ratio buttons container exist, it will remove it
        let btnRatioContainer = document.querySelector('.btn-ratio-container');
        if (btnRatioContainer !== null)
            btnRatioContainer.remove();

        if (image == null)
        {
            // Get image data from cropper
            image = this.cropper.getImageData();
        }

        // Aspect ratios object
        const aspectRatios = [
            { name: "Original", ratio: image.aspectRatio, class: "ratio_original" },
            { name: "Square", ratio: 1 / 1, class: "ratio_square" },
            { name: "4:5", ratio: 4 / 5, class: "ratio_4_5" },
            { name: "16:9", ratio: 16 / 9, class: "ratio_16_9" },
        ];

        // Image size
        let imageSize = {};

        // Create aspect ratio buttons container
        btnRatioContainer = document.createElement('div');
        btnRatioContainer.classList.add('btn-ratio-container');

        // Create aspect ratio buttons
        for (let i = 0; i < aspectRatios.length; i++)
        {
            // Create btn
            const div = document.createElement('div');
            div.classList.add(aspectRatios[i].class);

            const p = document.createElement('p');
            p.textContent = aspectRatios[i].name;

            const btn = document.createElement('button');
            btn.classList.add('btn-ratio');

            if (aspectRatios[i].class == 'ratio_square')
            {
                btn.classList.add('active');
            }

            btn.append(div, p);

            // Add click event listener to each btn
            btn.addEventListener('click', e => {
                e.preventDefault();

                // When one of the btn is clicked, find and remove active class
                [...btnRatioContainer.children].filter(el => el.classList.contains('active') ? el.classList.remove('active'): '');

                // And assign the active class to the clicked one
                e.target.classList.add('active');

                // Set the aspect ratio in cropBox
                this.cropper.setAspectRatio(aspectRatios[i].ratio);

                // Make cropBox data the same width as the container (Full width)
                this.cropper.setCropBoxData({ "width": this.cropper.getContainerData().width });

                // Get the new image size (size that the image going to be cropped)
                imageSize = this.getNewImageSize(image, aspectRatios[i].ratio);
            });

            // If original image aspect ratio is supported on instagram. Append its button to the container
            // https://help.instagram.com/1631821640426723
            if (aspectRatios[i].name.toLowerCase() === "original")
            {
                if (aspectRatios[i].ratio >= 0.8 && aspectRatios[i].ratio <= 1.91)
                    btnRatioContainer.appendChild(btn);
            }
            else
            {
                // Append aspect ratio buttons
                btnRatioContainer.appendChild(btn);
            }
        }

        // Prevent event listener to apply more than once on saveCropBtn
        if (!this.saveCropBtn.classList.contains('listener'))
        {
            this.saveCropBtn.addEventListener('click', e => this.cropImage(e, imageSize));
            this.saveCropBtn.classList.add('listener')
        }

        // Append aspect ratio container
        this.containerEl.appendChild(btnRatioContainer);
    }

    // Crop an image with its corresponding aspect ratio
    cropImage(e, imageSize)
    {
        e.preventDefault();

        this.cropper.getCroppedCanvas({
            width: imageSize.width,
            height: imageSize.height,
            minWidth: this.MIN_SIZE,
            minHeight: this.MIN_SIZE,
            maxWidth: this.MAX_WIDTH_SIZE,
            maxHeight: this.MAX_HEIGHT_SIZE,
            fillColor: '#fff',
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high'
        }).toBlob(blob => {

            // References:
            // https://github.com/fengyuanchen/cropperjs#getcroppedcanvasoptions
            // https://developer.mozilla.org/en-US/docs/Web/API/Blob
            // https://developer.mozilla.org/en-US/docs/Web/API/File

            // When the first image is loaded, if that image has a large size, or unsupported aspect ratio,
            // In the display() method cropBtn is going to be clicked and then hidden
            // Now here we check if this cropBtn is hidden, we show it
            if (this.cropBtn.classList.contains('d-none'))
                this.cropBtn.classList.remove('d-none');

            // Revoke old file url
            URL.revokeObjectURL(this.files[0].url);

            // Get new file url, and put the same name as the old file
            const newUrl = URL.createObjectURL(blob);
            const filename = this.files[0].name;

            // Update file
            const newFile = new File([blob], filename);
            this.files[0] = newFile;
            this.files[0].url = newUrl;

            // Rebuild cropper with the new image url
            this.cropper.replace(this.files[0].url);
            this.aspectRatioButtons();
            this.cropBtn.click();

        }, "image/jpeg", 1);
    }

    // Once the image load in the cropper
    // Force image to be crop if aspect ratio is not supported,
    // Or if widht or height are greater than its requied
    checkLoadedImage() {

        const image = this.cropper.getImageData();

        // Check aspect ratio is supported
        if ((image.aspectRatio >= 0.8 && image.aspectRatio <= 1.91) == false)
        {
            this.cropBtn.click();
            this.cropBtn.classList.add('d-none');
        }
        else if (image.naturalHeight > this.MAX_HEIGHT_SIZE)
        {
            this.cropBtn.click();
            this.cropBtn.classList.add('d-none');
        }
        else if (image.naturalWidth > this.MAX_WIDTH_SIZE)
        {
            this.cropBtn.click();
            this.cropBtn.classList.add('d-none');
        }
    }

    // Get a new size for image to be cropped.
    // Max size will be between 1080 width and 1350 height, according to instagram specification.
    getNewImageSize(image, aspectRatio)
    {
        const percent = 43.7;
        let size = {};

        // Enlarge small images to at least 320px
        if (image.naturalWidth < 320 || image.naturalHeight < 320)
        {
            size.width = this.MIN_SIZE;
            size.height = this.MIN_SIZE;

            return size;
        }

        // Aspect ratio 1:1 (square):
        // If image is larger than max size, set image size to max size
        // Set image width and height to the lower size to maintain good quality
        if (aspectRatio === 1)
        {
            if (image.naturalWidth > this.MAX_WIDTH_SIZE && image.naturalHeight > this.MAX_WIDTH_SIZE)
                size.width = size.height = this.MAX_WIDTH_SIZE;
            else if (image.naturalWidth < image.naturalHeight)
                size.width = size.height = image.naturalWidth;
            else
                size.width = size.height = image.naturalHeight;

            return size;
        }

        // When width is greater than height
        if (aspectRatio > 1)
        {
            if (image.naturalWidth > this.MAX_WIDTH_SIZE)
            {
                size.width = this.MAX_WIDTH_SIZE;
                size.height = this.MAX_WIDTH_SIZE - (Math.round(this.MAX_WIDTH_SIZE * percent / 100));
            }
            else
            {
                size.width = image.naturalWidth;
                size.height = image.naturalWidth  - (Math.round(image.naturalWidth * percent / 100));
            }

            return size;
        }

        // When height is greater than width
        else
        {
            if (image.naturalHeight > this.MAX_HEIGHT_SIZE)
            {
                size.width = this.MAX_HEIGHT_SIZE - (Math.round(this.MAX_HEIGHT_SIZE * percent / 100));
                size.height = this.MAX_HEIGHT_SIZE;
            }
            else
            {
                size.width = image.naturalHeight - (Math.round(image.naturalHeight * percent / 100));
                size.height = image.naturalHeight;
            }

            return size;
        }
    }
}