class CropImage 
{
    index = 0;
    files;
    cropper;
    cropBtn;
    removeBtn;
    saveCropBtn;
    containerEl;
    currentMediaEl;
    currentMediaWrapperEl
    viewmapWrapperEl;

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
        this.currentMediaEl.src = this.files[this.index].url;

        // Append elements to current media wrapper
        this.currentMediaWrapperEl.append(this.currentMediaEl);             

        // Initialize cropperjs
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
        });       

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

        // Create viewmap
        this.viewmapWrapperEl = document.createElement('div');
        this.viewmapWrapperEl.classList.add('viewmap-wrapper');

        // For each media in carousel create small image
        for (let i = 0; i < this.files.length; i++) 
        {
            // Create viewmap wrapper
            const viewmapBoxWrapper = document.createElement('div');
            viewmapBoxWrapper.classList.add('viewmap-wrapper-box');

            // Create viewmap images
            const viewmapImage = document.createElement('div');
            viewmapImage.id = i;
            viewmapImage.classList.add('viewmap-image');            
            viewmapImage.style.backgroundImage = `url(${ this.files[i].url })`;

            // Add click event to each image in viewmap
            viewmapImage.addEventListener('click', (e) => {
                this.index = e.target.id;
                // Rebuild the cropper with new URL when click viewmap image, but not only if the same image is clicked
                const cropperViewBoxImg = document.querySelector('.cropper-view-box img');
                if (cropperViewBoxImg.src !== this.files[this.index].url) {                   
                    this.cropper.replace(this.files[this.index].url);
                }
            });

            // Append viewmap image to viewmap wrapper
            viewmapBoxWrapper.appendChild(viewmapImage);
            this.viewmapWrapperEl.appendChild(viewmapBoxWrapper);
        }

        // Append viewmap to container
        this.containerEl.append(this.viewmapWrapperEl);        
 
 
        //  const optionsWrapper = document.createElement('div');
        //  optionsWrapper.classList.add('options-wrapper');
        //  optionsWrapper.append(this.cropBtn, this.removeBtn);

        //  this.containerEl.appendChild(optionsWrapper);
    }
    
    // Remove current media
    remove(e) 
    {
        e.preventDefault();

        // If there is only 1 media in carousel
        if (this.files.length === 1) 
        {
            // Remove file from memory
            URL.revokeObjectURL(this.files[0].url);
            this.files.pop();
         
            // Remove container items
            for (let i = 0; i < this.containerEl.children.length; i++) 
            {
                this.containerEl.children[i].remove();
            }

            // Remove viewmap
            this.viewmapWrapperEl.remove();

            // Show input file again
            const mediaFilesWrapper = document.querySelector('#media-files-wrapper');
            mediaFilesWrapper.classList.remove('d-none');
            mediaFilesWrapper.parentElement.classList.add('p-3');
        }
        else 
        {
            // Remove file from memory
            URL.revokeObjectURL(this.files[this.index].url);
            this.files.splice(this.index, 1);

            this.viewmapWrapperEl.querySelectorAll('.viewmap-wrapper-box')[this.index].remove();

            // Show first picture
            this.index = 0;
            this.cropper.replace(this.files[this.index].url);
            
            // Update id of elements
            const viewmapImages = document.querySelectorAll('.viewmap-image');
            viewmapImages.forEach((el, i) => {
                el.id = i;
            });
        }
    }

    toggleCropButtons(e) 
    {
        e.preventDefault();       

        if (!e.detail || e.detail == 1) 
        {            
            const btnRatioContainer = document.querySelector('.btn-ratio-container');
            if (btnRatioContainer !== null)
            {
                if (btnRatioContainer.classList.contains('d-none'))
                {
                    this.removeBtn.classList.add('d-none');
                    this.cropBtn.firstChild.classList.remove('bi-crop');
                    this.cropBtn.firstChild.classList.add('bi-x-lg');
                    this.cropBtn.style = 'left: 5px; right: unset;';
                    this.saveCropBtn.classList.remove('d-none');
                    btnRatioContainer.classList.remove('d-none');
                    this.cropper.crop();
                }
                else
                {
                    this.removeBtn.classList.remove('d-none');
                    this.cropBtn.firstChild.classList.add('bi-crop');
                    this.cropBtn.firstChild.classList.remove('bi-x-lg');
                    this.cropBtn.style = 'left: unset; right: 5px;';
                    this.saveCropBtn.classList.add('d-none');
                    btnRatioContainer.classList.add('d-none');
                    this.cropper.clear();
                }
            }
            else
            {
                this.removeBtn.classList.add('d-none');
                this.cropBtn.firstChild.classList.remove('bi-crop');
                this.cropBtn.firstChild.classList.add('bi-x-lg');
                this.cropBtn.style = 'left: 5px; right: unset;';
                this.saveCropBtn.classList.remove('d-none');
                this.cropper.crop();        
                this.aspectRatioButtons();
            }
        }
    }
    
    aspectRatioButtons() 
    {
        const image = this.cropper.getImageData();
        const aspectRatios = [
            { name: "Original", ratio: image.aspectRatio, class: "ratio_original" },
            { name: "Square", ratio: 1 / 1, class: "ratio_square" },
            { name: "4:5", ratio: 4 / 5, class: "ratio_4_5" },
            { name: "16:9", ratio: 16 / 9, class: "ratio_16_9" },
        ];
            
        // Default aspect ratio 1:1
        const ratio = aspectRatios[0].ratio;
        let imageSize = this.getNewImageSize(image, ratio);
            
        // Re-render btnRatioContainer when cropper is rebuild
        let btnRatioContainer = document.querySelector('.btn-ratio-container');
        if (btnRatioContainer !== null) 
            btnRatioContainer.remove();        
            
        btnRatioContainer = document.createElement('div');
        btnRatioContainer.classList.add('btn-ratio-container');
        
        // Create aspect ratio buttons
        for (let i = 0; i < aspectRatios.length; i++) 
        {
            const divContext = document.createElement('div');
            divContext.classList.add('btn-ratio-context', aspectRatios[i].class);

            const pText = document.createElement('p');
            pText.textContent = aspectRatios[i].name;
            pText.classList.add('btn-ratio-text');

            const btnRatio = document.createElement('button');
            btnRatio.classList.add('btn-ratio');
            if (aspectRatios[i].class == 'ratio_square')
            {
                divContext.style.border = '2px #000 solid';
                pText.style.color = '#000';
            }

            btnRatio.append(divContext, pText);

            btnRatio.addEventListener('click', e => {
                e.preventDefault();
                
                this.cropper.setAspectRatio(aspectRatios[i].ratio);
                this.cropper.setCropBoxData({ "width": this.cropper.getContainerData().width });
                imageSize = this.getNewImageSize(image, aspectRatios[i]);
            });
                
            // Append original aspect ratio button if image aspect ratio is supported on instagram
            // https://help.instagram.com/1631821640426723    
            if (aspectRatios[i].name === "original") 
            {
                if (aspectRatios[i] >= 0.8 && aspectRatios[i] <= 1.91) 
                    btnRatioContainer.appendChild(btnRatio);                
            }                    
            
            // Append buttons
            btnRatioContainer.appendChild(btnRatio);
        }                       
        
        this.saveCropBtn.addEventListener('click', e => {
            e.preventDefault();
                       
            this.cropImage(imageSize);
        });

        
        // Append btn ratio container
        this.containerEl.appendChild(btnRatioContainer);
    }   

    // Crop an image with its corresponding aspect ratio using cropperjs library
    cropImage(imageSize) 
    {
        this.cropper.getCroppedCanvas({
            width: imageSize.width,
            height: imageSize.height,
            minWidth: 320,
            minHeight: 320,
            fillColor: '#fff',
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high'
        }).toBlob(blob => {            
            
            // References:
            // https://github.com/fengyuanchen/cropperjs#getcroppedcanvasoptions
            // https://developer.mozilla.org/en-US/docs/Web/API/Blob
            // https://developer.mozilla.org/en-US/docs/Web/API/File

            // Revoke old file url
            URL.revokeObjectURL(this.files[this.index].url);  
            
            // Get new file url, and put the same name as the old file
            const newUrl = URL.createObjectURL(blob);
            const filename = this.files[this.index].name;
            
            // Update file
            const newFile = new File([blob], filename);
            this.files[this.index] = newFile;
            this.files[this.index].url = newUrl;                        
            
            // Change image in cropper with the new url
            this.cropper.replace(this.files[this.index].url);

            // Show (remove, crop) buttons again
            this.cropBtn.click();           

        }, "image/jpeg", 1);
    }    

    // Get size to crop image
    getNewImageSize(image, aspectRatio) 
    {
        let size = { width: 1080, height: 1350 };

        // Enlarge small images to at least 320
        if (image.naturalWidth < 320 || image.naturalHeight < 320)
            return { width: 320, height: 320 };

        // Get the lower side of the image
        if (aspectRatio === 1) 
        {
            if (image.naturalWidth > size.width && image.naturalHeight > size.width)
                return size;
            else if (image.naturalWidth < image.naturalHeight)
                size.width = size.height = image.naturalWidth;
            else
                size.width = size.height = image.naturalHeight;
            return size;
        }

        // When height is greater than width
        if (aspectRatio > 0) 
        {

            if (image.naturalHeight > size.height)
                return size;
            else
                size.height = image.naturalHeight;
            return size;
        }
        // When width is greater than height
        else 
        {
            if (image.naturalWidth > size.width)
                return size;
            else
                size.width = image.naturalWidth;
            return size;
        }
    }                    
}