class Carousel {
    // Properties

    files;                  // Upload files
    index = 0;              // Index to navigate between files

    nextBtn;                // Carousel next button
    prevBtn;                // Carousel prev button
    removeBtn;              // Remove media button
    cropBtn;                // Crop image button

    currentMediaEl;         // Current media displaying element
    currentMediaWrapperEl;  // Wrapper element for current media

    showViewmap;            // Decide if show media viewmap
    viewmapWrapperEl;       // Wrapper for viewmap

    autoCrop;               // Decide if crop media (only images)
    observer;               // Observe DOM change
    cropper;                // Crop images

    containerEl;            // Container element

    // Constructor
    constructor(containerEl, files, showViewmap = false, autoCrop = false) {

        // Check container is passed
        if (containerEl === undefined) return console.error("Container element is missing.");
        if (files === undefined) return console.error("At least 1 url is required. None was passed.");

        // Assignments
        this.containerEl = containerEl;
        this.files = files;
        this.showViewmap = showViewmap;
        this.autoCrop = autoCrop;

        // https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
        this.observer = new MutationObserver(mutations => {
            for (let mutation of mutations) {
                if (mutation.attributeName === 'style')
                    this.showOrHideCarouselButtons();

                if (mutation.type === 'childList')
                    this.showOrHideCarouselButtons();
            }
        });

        // Initialize cropperjs
        this.cropper = new Cropper(this.currentMediaEl, {
            aspectRatio: 1,
            autoCrop: true,
            viewMode: 1,
            dragMode: 'move',
            zoomOnWheel: false,
            toggleDragModeOnDblclick: false,
            cropBoxResizable: true,
            background: false,
            minCropBoxWidth: 320,
            movable: false,
        });
    }

    // Methods
    display() {

        this.currentMediaWrapperEl = document.createElement('div');
        this.currentMediaWrapperEl.classList.add('current-media-wrapper');

        // Observe current media wrapper for DOM changes
        const config = { attributes: true, childList: true, subtree: true };
        this.observer.observe(this.currentMediaWrapperEl, config);

        // Next, prev, remove buttons
        this.nextBtn = document.createElement('button'); this.nextBtn.className = 'next-btn';
        const nextBtnIcon = document.createElement('i'); nextBtnIcon.className = 'bi bi-arrow-right-short carousel-btn-icons';
        this.nextBtn.appendChild(nextBtnIcon);
        this.nextBtn.addEventListener('click', e => this.next(e));

        this.prevBtn = document.createElement('button'); this.prevBtn.className = 'prev-btn';
        const prevBtnIcon = document.createElement('i'); prevBtnIcon.className = 'bi bi-arrow-left-short carousel-btn-icons';
        this.prevBtn.appendChild(prevBtnIcon);
        this.prevBtn.addEventListener('click', e => this.prev(e));

        this.removeBtn = document.createElement('button'); this.removeBtn.className = 'remove-btn';
        const removeBtnIcon = document.createElement('i'); removeBtnIcon.className = 'bi bi-x carousel-btn-icons';
        this.removeBtn.appendChild(removeBtnIcon);
        this.removeBtn.addEventListener('click', e => this.remove(e));

        this.cropBtn = document.createElement('button'); this.cropBtn.className = 'crop-btn';
        const cropBtnIcon = document.createElement('i'); cropBtnIcon.className = 'bi bi-crop carousel-btn-icons';
        this.cropBtn.appendChild(cropBtnIcon);
        this.cropBtn.addEventListener('click', e => this.remove(e));

        this.currentMediaWrapperEl.append(this.nextBtn, this.prevBtn, this.removeBtn, this.cropBtn);

        // Display cropper
        if (this.autoCrop) {
            // Create currentMediaEl tag for cropping
            this.currentMediaEl = document.createElement('img');
            this.currentMediaEl.classList.add('current-media-crop');
            this.currentMediaEl.src = this.files[this.index].url;

            // Append elements to current media wrapper
            this.currentMediaWrapperEl.append(this.currentMediaEl);

            // Initialize cropperjs
            this.initCropper();
        }
        else {
            // Create currentMediaEl for displaying
            this.currentMediaEl = document.createElement('div');
            this.currentMediaEl.classList.add('current-media')
            this.currentMediaEl.style.backgroundImage = `url(${ this.files[this.index].url })`;

            // Append elements to current media wrapper
            this.currentMediaWrapperEl.style.aspectRatio = 1;
            this.currentMediaWrapperEl.append(this.currentMediaEl);
        }

        // Append elements to carousel container
        this.containerEl.appendChild(this.currentMediaWrapperEl);

        // Show viewmap
        if (this.showViewmap)
            this.viewmap();
    }

    // Move to the next
    next(e) {
        e.preventDefault();
        this.index++;
        this.currentMediaEl.style.backgroundImage = `url(${ this.files[this.index].url })`;
    }

    // Move to previous media
    prev(e) {
        e.preventDefault();
        this.index--;
        this.currentMediaEl.style.backgroundImage = `url(${ this.files[this.index].url })`;
    }

    // Add media
    add() {

    }

    // Remove current media
    remove(e) {
        e.preventDefault();

        // If there is only 1 media in carousel
        if (this.files.length === 1) {
            // Remove file from memory
            URL.revokeObjectURL(this.files[0].url);
            this.files.pop();

            // Stop observing for DOM changes
            this.observer.disconnect();

            // Remove container items
            for (let i = 0; i < this.containerEl.children.length; i++) {
                this.containerEl.children[i].remove();
            }

            // Show input file again
            const mediaFilesWrapper = document.querySelector('#media-files-wrapper');
            mediaFilesWrapper.classList.remove('d-none');
            mediaFilesWrapper.parentElement.classList.add('p-3');
        }
        else {
            // Remove file from memory
            URL.revokeObjectURL(this.files[this.index].url);
            this.files.splice(this.index, 1);

            // Remove viewmap image
            if (this.showViewmap)
                this.viewmapWrapperEl.querySelectorAll('.viewmap-wrapper')[this.index].remove();

            // Show first picture
            this.index = 0;
            this.currentMediaEl.style.backgroundImage = `url(${ this.files[this.index].url })`;
        }
    }

    crop(e) {
        e.preventDefault();

        this.cropper.ready = () => {
            const image = this.cropper.getImageData();
            this.aspectRatioButtons(image);
        }
    }

    viewmap() {
        this.viewmapWrapperEl = document.createElement('div');

        // For each media in carousel create small image
        for (let i = 0; i < this.files.length; i++) {

            // Create viewmap wrapper
            const viewmapWrapper = document.createElement('div');
            viewmapWrapper.classList.add('viewmap-wrapper');

            // Create viewmap images
            const viewmapImage = document.createElement('div');
            viewmapImage.classList.add('viewmap-image');
            viewmapImage.style.backgroundImage = `url(${ this.files[i].url })`;

            // Add event to each image in viewmap
            viewmapImage.addEventListener('click', () => {
                if (this.autoCrop) {
                    // Rebuild the cropper with new URL when click viewmap image, but not only if the same image is clicked
                    const cropperViewBoxImg = document.querySelector('.cropper-view-box img');
                    if (cropperViewBoxImg.src !== this.files[i].url) {
                        this.cropper.replace(this.files[i].url);
                    }
                }
                else {
                    this.index = i;
                    this.currentMediaEl.style.backgroundImage = `url(${ this.files[this.index].url })`
                }
            });

            // Append viewmap image to viewmap wrapper
            viewmapWrapper.appendChild(viewmapImage);
            this.viewmapWrapperEl.appendChild(viewmapWrapper);
        }

        // Append viewmap to carousel
        this.containerEl.append(this.viewmapWrapperEl);
    }

    aspectRatioButtons(image) {

        const aspectRatios = [
            { name: "Original", ratio: image.aspectRatio },
            { name: "Square", ratio: 1 / 1 },
            { name: "4:5", ratio: 4 / 5 },
            { name: "16:9", ratio: 16 / 9 },
        ];

        // Default aspect ratio 1:1
        const ratio = aspectRatios[0].ratio;
        let imageSize = this.getNewImageSize(image, ratio);

        // Re-render btnRatioContainer when cropper is rebuild
        let btnRatioContainer = document.querySelector('.btn-ratio-container');
        if (btnRatioContainer !== null) {
            btnRatioContainer.remove();
        }

        btnRatioContainer = document.createElement('div');
        btnRatioContainer.className = 'btn-ratio-container';

        // Create aspect ratio buttons
        for (let i = 0; i < aspectRatios.length; i++) {
            const btnRatio = document.createElement('button');
            btnRatio.textContent = aspectRatios[i].name;

            btnRatio.addEventListener('click', e => {
                e.preventDefault();

                this.cropper.setAspectRatio(aspectRatios[i].ratio);
                this.cropper.setCropBoxData({ "width": this.cropper.getContainerData().width });
                imageSize = this.getNewImageSize(image, aspectRatios[i]);
            });

            // Append original aspect ratio button if image aspect ratio is supported on instagram
            // https://help.instagram.com/1631821640426723    
            if (aspectRatios[i].name === "original") {
                if (aspectRatios[i] >= 0.8 && aspectRatios[i] <= 1.91) {
                    btnRatioContainer.appendChild(btnRatio);
                }
            }

            // Append buttons
            btnRatioContainer.appendChild(btnRatio);

        }

        // Create Test crop btn
        const btnCrop = document.createElement('button');
        btnCrop.innerText = 'crop';

        btnCrop.addEventListener('click', (e) => {
            e.preventDefault();

            // Crop image
            this.cropImage(imageSize);

        });

        // Append btn crop test
        btnRatioContainer.append(btnCrop);

        // Append btn ratio container
        this.containerEl.appendChild(btnRatioContainer);
    }


    // Crop an image with its corresponding aspect ratio using cropperjs library
    cropImage(imageSize) {

        this.cropper.getCroppedCanvas({
            width: imageSize.width,
            height: imageSize.height,
            minWidth: 320,
            minHeight: 320,
            fillColor: '#fff',
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high'
        }).toBlob(blob => {
            const imgurl = document.createElement('img');
            const url = URL.createObjectURL(blob);

            imgurl.onload = () => {
                console.log('cropped img, revoked blob');
                URL.revokeObjectURL(blob);
            }
            imgurl.src = url;
            imgurl.style = 'width: 200px; height: auto; margin: 10px';
            this.containerEl.parentElement.appendChild(imgurl);

        }, "image/jpeg", 1);
    }

    // Initialize or create a cropperjs instance
    initCropper() {
    }

    // Get size to crop image
    getNewImageSize(image, aspectRatio) {

        let size = { width: 1080, height: 1350 };

        // Enlarge small images to at least 320
        if (image.naturalWidth < 320 || image.naturalHeight < 320)
            return { width: 320, height: 320 };

        // Get the lower side of the image
        if (aspectRatio === 1) {
            if (image.naturalWidth > size.width && image.naturalHeight > size.width)
                return size;
            else if (image.naturalWidth < image.naturalHeight)
                size.width = size.height = image.naturalWidth;
            else
                size.width = size.height = image.naturalHeight;
            return size;
        }

        // When height is greater than width
        if (aspectRatio > 0) {

            if (image.naturalHeight > size.height)
                return size;
            else
                size.height = image.naturalHeight;
            return size;
        }
        // When width is greater than height
        else {
            if (image.naturalWidth > size.width)
                return size;
            else
                size.width = image.naturalWidth;
            return size;
        }
    }

    // Decide when to show or hide prev and next buttons
    showOrHideCarouselButtons() {
        if (this.index == 0) this.prevBtn.classList.add('d-none');
        else if (this.index > 0) this.prevBtn.classList.remove('d-none');

        if (this.index == this.files.length - 1) this.nextBtn.classList.add('d-none');
        else if (this.index < this.files.length - 1) this.nextBtn.classList.remove('d-none');
    }
}