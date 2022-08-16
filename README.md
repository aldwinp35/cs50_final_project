# Ospost
#### Video Demo:  <URL HERE>
#### Description:
Ospost is a post scheduling for Instagram that you can help you to plan your posts to publish them on a specific date on instagram. Ospost is develop with Flask, JavaScript, Bootstrap and it uses the [Instagram Graph API](https://developers.facebook.com/docs/instagram-api "Go to Instagram API").

Before start explaining what each file does, it's important to explain the flow of the app first.

1. Log In with facebook

    Before the user logs in, need to have the following:
    * An Instagram Business Account.
    * A Facebook Page connected to that account

    In the log in dialog process, the user select instagram account that will be use and the facebook page connected to that account.

    This will give Ospost an user access token that contains the permissions to post on that instagram account.

2. Create post (schedule)

    To create and schedule a post, user does following:

    * Select the media (only image are supported: jpg, jpeg)
    * Crop image if needed
    * Enter a caption (optional)
    * Enter a datetime (a date greater than present date and no longer than 50 days)
3. Edit, Remove post
4. Publish post

    To publish a post on instagram, the user can use *publish now* or wait for the cron job to publish it on the specified date.

5. Delete account

### Files structure
```
static/
    |-- css/
        |-- styles.css
        |-- cropImage.css
    |-- js/
        |-- utils.js
        |-- cropImage.js
        |-- loginPage.js
        |-- homePage.js
        |-- postAddPage.js
        |-- postEditPage.js
templates/
    |-- login/
        |-- index.html
    |-- home/
        |-- index.html
    |-- post/
        |-- add.html
        |-- edit.html
    |-- account/
        |-- index.html
    |-- error.html
    |-- layout.html
    |-- privacy_policy.html
tmp/
    |-- ospost.db
uploads/
app.py
helpers.py
models.py
requeriments.txt
```
### HTML files

#### login/index.html
#### home/index.html
#### post/add.html
#### post/edit.html
#### account/index.html
#### layout.html
#### error.html
#### privacy_policy.html

### Python files

#### app.py
#### models.py
#### helpers.py

### Database file
#### ospost.db

### Javascript files

#### utils.js
Contains javascript functions that help to validate inputs on the client side, make http request with fetch API and contains helper for javascript dates format.

```javascript
function validateInput(inputEl)
function showInputError(inputEl)
function getIsoDate(date)
function addDays(date, days)
async function request(url, method, data=null)
```
#### cropImage.js
A Javascript class that implements the [cropperjs](https://github.com/fengyuanchen/cropperjs) library. The user could try to create a post with an image whose width or height is too large or Instagram does not support the aspect ratio.

According to the [Instagram API docs](https://developers.facebook.com/docs/instagram-api/reference/ig-user/media#image-specifications), image specification are the following:

* Format: JPEG
* File size: 8 MB maximum.
* Aspect ratio: Must be within a 4:5 to 1.91:1 range
* Minimum width: 320 (will be scaled up to the minimum if necessary)
* Maximum width: 1440 (will be scaled down to the maximum if necessary)
* Height: Varies, depending on width and aspect ratio
* Color Space: sRGB. Images using other color spaces will have their color spaces converted to sRGB.

```javascript
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

    // Remove image from container
    remove(e)

    // Toggle cropbox (show/hide)
    toggleCropBox(e)

    // Create and display aspect ratio buttons
    createAspectRatioButtons()

    // Crop an image with its corresponding aspect ratio
    cropImage(e, imageSize)

    // Check if loaded image is supported, if not, it will force the user to crop it
    checkLoadedImage()

    // Get a new size for image to be cropped.
    getNewImageSize(image, aspectRatio)
}

```

#### loginPage.js
#### homePage.js
#### postAddPage.js
#### postEditPage.js

### CSS files

#### styles.css
Contains the css styles for the app.
#### cropImage.css
Contains the css style for the javascript class that implements cropperjs.