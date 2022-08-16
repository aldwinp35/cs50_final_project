class CropImage
{
    imageFile;                      // <-- image file
    imageEl;                        // <-- image element
    cropper;                        // <-- cropper instance
    cropBtn;                        // <-- button to cropp image
    removeImageBtn;                 // <-- button to remove image
    toggleCropBoxBtn;               // <-- button to toggle the cropbox of cropperjs
    container;                      // <-- container where the cropper will be render
    imageElWrapper;                 // <-- container that wrap image element
    inputFileWrapper;               // <-- container that wrap input file
    MAX_WIDTH_SIZE = 1080;          // <-- Max size in width
    MAX_HEIGHT_SIZE = 1440;         // <-- Max size in height
    MIN_SIZE = 320;                 // <-- Min size (width, height)

    // Get container where cropper will be render
    // Get inputFileWrapper to hide it when image is loaded
    // and show it when image is remove
    // Get image
    constructor(container, inputFileWrapper, image)
    {
        this.imageFile = image;
        this.container = container;
        this.inputFileWrapper = inputFileWrapper;
    }

    // Create elements, render cropperjs with image
    display()
    {
        // Hide InputFileWrapper area
        this.inputFileWrapper.classList.add('d-none');
        this.inputFileWrapper.parentElement.classList.remove('p-3');

        // Create img element wrapper
        this.imageElWrapper = document.createElement('div');
        this.imageElWrapper.classList.add('image-element-wrapper');

        // Create img element for cropping
        this.imageEl = document.createElement('img');
        this.imageEl.classList.add('image-element');
        this.imageFile.url = URL.createObjectURL(this.imageFile);
        this.imageEl.src = this.imageFile.url;

        // Append elements to current media wrapper
        this.imageElWrapper.append(this.imageEl);

        // Create removeImageBtn, activeCropBtn, cropBtn
        this.removeImageBtn = document.createElement('button'); this.removeImageBtn.className = 'button remove-image-button';
        const removeImageBtnIcon = document.createElement('i'); removeImageBtnIcon.className = 'bi bi-trash3 button-icon-event';
        this.removeImageBtn.appendChild(removeImageBtnIcon);
        this.removeImageBtn.addEventListener('click', e => this.remove(e));

        this.toggleCropBoxBtn = document.createElement('button'); this.toggleCropBoxBtn.className = 'button toggle-cropbox-btn';
        const activeCropBtnIcon = document.createElement('i'); activeCropBtnIcon.className = 'bi bi-crop button-icon-event';
        this.toggleCropBoxBtn.appendChild(activeCropBtnIcon);
        this.toggleCropBoxBtn.addEventListener('click', e => this.toggleCropBox(e));

        this.cropBtn = document.createElement('button'); this.cropBtn.className = 'button crop-button d-none';
        const cropBtnIcon = document.createElement('i'); cropBtnIcon.className = 'bi bi-check2 button-icon-event';
        this.cropBtn.appendChild(cropBtnIcon);

        // Append buttons to container
        this.imageElWrapper.append(this.removeImageBtn, this.toggleCropBoxBtn, this.cropBtn);

        // Initialize cropperjs
        const _this = this;
        this.cropper = new Cropper(this.imageEl, {
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

        // Append elements to carousel container
        this.container.appendChild(this.imageElWrapper);
    }

    // Remove image from container
    remove(e)
    {
        e.preventDefault();

        // Remove image URL from memory
        URL.revokeObjectURL(this.imageFile.url);

        // Remove file
        this.imageFile = null;

        // Remove container items
        for (let i = 0; i < this.container.childElementCount; i++)
        {
            this.container.children[i].remove();
        }

        // This element is a child of container, but because is not a class property container don't recognized
        // That's why here we remove it manually.
        const btnRatioContainer = document.querySelector('.btn-ratio-container');
        if (btnRatioContainer != null)
            btnRatioContainer.remove();

        // Show input file again
        this.inputFileWrapper.classList.remove('d-none');
        this.inputFileWrapper.parentElement.classList.add('p-3');
    }

    // Toggle cropbox (show/hide)
    toggleCropBox(e)
    {
        e.preventDefault();

        // Make sure only one click goes through
        if (!e.detail || e.detail == 1)
        {
            const btnRatioContainer = document.querySelector('.btn-ratio-container');

            if (btnRatioContainer === null)
            {
                // Toggle between removeImageBtn and cropBtn (show/hide)
                this.removeImageBtn.classList.toggle('d-none');
                this.cropBtn.classList.toggle('d-none');

                // Toggle toggleCropBoxBtn icon, to close icon (show/hide)
                this.toggleCropBoxBtn.firstChild.classList.toggle('bi-crop');
                this.toggleCropBoxBtn.firstChild.classList.toggle('bi-x-lg');

                // Change toggleCropBoxBtn position (left/right) (original position is right)
                this.toggleCropBoxBtn.style = 'left: 5px; right: unset;';

                // Show cropbox
                this.cropper.crop();

                // Create and show aspect ratio buttons
                this.createAspectRatioButtons();

                // Click on the aspect ratio 1:1 (square) to make it show first
                document.querySelector('.ratio_square').parentElement.click();
            }
            else
            {
                if (btnRatioContainer.classList.contains('d-none'))
                {
                    this.removeImageBtn.classList.toggle('d-none');
                    this.cropBtn.classList.toggle('d-none');
                    this.toggleCropBoxBtn.firstChild.classList.toggle('bi-crop');
                    this.toggleCropBoxBtn.firstChild.classList.toggle('bi-x-lg');
                    this.toggleCropBoxBtn.style = 'left: 5px; right: unset;';

                    // Show cropbox
                    this.cropper.crop();

                    // Show aspect ratio buttons
                    btnRatioContainer.classList.toggle('d-none');

                    // Click on default aspect ratio (square ratio)
                    document.querySelector('.ratio_square').parentElement.click();
                }

                // If aspect ratio buttons are shown
                else
                {
                    this.removeImageBtn.classList.toggle('d-none');
                    this.cropBtn.classList.toggle('d-none');
                    this.toggleCropBoxBtn.firstChild.classList.toggle('bi-crop');
                    this.toggleCropBoxBtn.firstChild.classList.toggle('bi-x-lg');
                    this.toggleCropBoxBtn.style = 'left: unset; right: 5px;';

                    // Hide cropbox
                    this.cropper.clear();

                    // Hide aspect ratio buttons
                    btnRatioContainer.classList.toggle('d-none');
                }
            }
        }
    }

    // Create and display aspect ratio buttons
    createAspectRatioButtons()
    {
        // When cropImage method is used, it will re-create the aspect ratio buttons
        // With the new image size by calling this method again.
        // For that reason, if aspect ratio buttons container exist, it will remove it
        let btnRatioContainer = document.querySelector('.btn-ratio-container');
        if (btnRatioContainer !== null)
            btnRatioContainer.remove();

        // Get image data from cropper
        let imageData = this.cropper.getImageData();

        // Image size
        let imageSize = {};

        // Aspect ratios object
        const aspectRatios = [
            { name: "Original", ratio: imageData.aspectRatio, class: "ratio_original" },
            { name: "Square", ratio: 1 / 1, class: "ratio_square" },
            { name: "4:5", ratio: 4 / 5, class: "ratio_4_5" },
            { name: "16:9", ratio: 16 / 9, class: "ratio_16_9" },
        ];


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
                imageSize = this.getNewImageSize(imageData, aspectRatios[i].ratio);
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

        // Prevent event listener to apply more than once to cropBtn
        if (!this.cropBtn.classList.contains('listener'))
        {
            // Add click event listener to cropBtn
            this.cropBtn.addEventListener('click', e => this.cropImage(e, imageSize));
            this.cropBtn.classList.add('listener');
        }

        // Append aspect ratio container
        this.container.appendChild(btnRatioContainer);
    }

    // Crop an image with its corresponding aspect ratio
    cropImage(e, imageSize)
    {
        e.preventDefault();

        // https://github.com/fengyuanchen/cropperjs#getcroppedcanvasoptions
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
            // https://developer.mozilla.org/en-US/docs/Web/API/Blob

            // When the original image is loaded, if that image has a large size, or unsupported aspect ratio,
            // toggleCropBoxBtn is going to be clicked and then hidden in the checkLoadedImage()
            // Now here we check if toggleCropBoxBtn is hidden, we show it
            if (this.toggleCropBoxBtn.classList.contains('d-none'))
                this.toggleCropBoxBtn.classList.remove('d-none');

            // Revoke old image url
            URL.revokeObjectURL(this.imageFile.url);

            // Get new image url, and put the same name as the old image
            const newImageUrl = URL.createObjectURL(blob);
            const filename = this.imageFile.name;

            // Update image
            // https://developer.mozilla.org/en-US/docs/Web/API/File
            const newImage = new File([blob], filename);
            this.imageFile = newImage;
            this.imageFile.url = newImageUrl;

            // Rebuild cropper with the new image url
            this.cropper.replace(this.imageFile.url);
            this.createAspectRatioButtons();
            this.toggleCropBoxBtn.click();

        }, "image/jpeg", 1);
    }

    // Check if loaded image is supported, if not, it will force the user to crop it
    checkLoadedImage() {

        const image = this.cropper.getImageData();

        // Check aspect ratio is supported
        if ((image.aspectRatio >= 0.8 && image.aspectRatio <= 1.91) == false)
        {
            this.toggleCropBoxBtn.click();
            this.toggleCropBoxBtn.classList.add('d-none');
        }
        else if (image.naturalHeight > this.MAX_HEIGHT_SIZE)
        {
            this.toggleCropBoxBtn.click();
            this.toggleCropBoxBtn.classList.add('d-none');
        }
        else if (image.naturalWidth > this.MAX_WIDTH_SIZE)
        {
            this.toggleCropBoxBtn.click();
            this.toggleCropBoxBtn.classList.add('d-none');
        }
    }

    // Get a new size for image to be cropped.
    getNewImageSize(imageData, aspectRatio)
    {
        const percent = 43.7;
        let size = {};

        // Enlarge small images to at least 320px
        if (imageData.naturalWidth < 320 || imageData.naturalHeight < 320)
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
            if (imageData.naturalWidth > this.MAX_WIDTH_SIZE && imageData.naturalHeight > this.MAX_WIDTH_SIZE)
                size.width = size.height = this.MAX_WIDTH_SIZE;
            else if (imageData.naturalWidth < imageData.naturalHeight)
                size.width = size.height = imageData.naturalWidth;
            else
                size.width = size.height = imageData.naturalHeight;

            return size;
        }

        // When width is greater than height
        if (aspectRatio > 1)
        {
            if (imageData.naturalWidth > this.MAX_WIDTH_SIZE)
            {
                size.width = this.MAX_WIDTH_SIZE;
                size.height = this.MAX_WIDTH_SIZE - (Math.round(this.MAX_WIDTH_SIZE * percent / 100));
            }
            else
            {
                size.width = imageData.naturalWidth;
                size.height = imageData.naturalWidth  - (Math.round(imageData.naturalWidth * percent / 100));
            }

            return size;
        }

        // When height is greater than width
        else
        {
            if (imageData.naturalHeight > this.MAX_HEIGHT_SIZE)
            {
                size.width = this.MAX_HEIGHT_SIZE - (Math.round(this.MAX_HEIGHT_SIZE * percent / 100));
                size.height = this.MAX_HEIGHT_SIZE;
            }
            else
            {
                size.width = imageData.naturalHeight - (Math.round(imageData.naturalHeight * percent / 100));
                size.height = imageData.naturalHeight;
            }

            return size;
        }
    }
}