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
The login page display a Facebook login button where the user can log in with their Facebook account. The login is processed using the Facebook JavaScript SDK in **loginPage.js** file.
#### home/index.html
The home page contains the HTML code to display each post scheduled by the user using jinja sintax.

In **homePage.js** file we attach two event to each post:

``click`` event that redirect the user to view and edit the post.

``long-press`` event that allows the user to change the dates between two posts by dragging and dropping the post using [sortablejs](https://github.com/SortableJS/Sortable).

See [long-press-event](https://github.com/john-doherty/long-press-event).

#### post/add.html
The post/add page contains the HTML code that allow the user to create a post.

The page contains four important element:

``input file`` user select the image file to be uploaded.

``input datetime-local`` user select a date where the post going to be publish.

``textarea`` user enter a caption for the post.

``button`` to create post.

In **postAddPage.js** the user inputs are processed using ``formData`` to send data to the backend with ``fetch API``.

#### post/edit.html
The post/edit page contains the HTML code to display a form that allow the user to change post ``date`` and ``caption``.

In **postEditPage.js** there are some client validation for date input. Again the data is processed using ``formData`` and send with ``fetch API``.
#### account/index.html
In that page the users can see and delete their account.
#### layout.html
That page contains the main template for other pages.
#### error.html
That page help to show errors such like 404, 400, etc...
#### privacy_policy.html
That page contains a privacy policy that are required when using facebook login.

### Python files

#### app.py
This file contains the most important: the ``flask app`` and its configuration settings, as well as routes and functions to proccess each request that are send from the client side. Also contains the logic to connect with the models, proccess and save incoming data to the database.

**Routes:**

*/login*

Render login page and proccess login request.
```python
# Render login page, proccess login request
@app.route("/login", methods=["GET", "POST"])
def login():
    # GET: Render login page
    fb = {"version": os.getenv("FB_VERSION"), "app_id": os.getenv("FB_APP_ID")}
    return render_template("login/index.html", fb=fb)
```
from the Javascrip Facebook SDK we received ``instagram_account_id`` and a short-lived ``access_token``

```python
# Received from POST
ig_account_id = request.json["ig_id"]
temp_access_token = request.json["authResponse"]["accessToken"]
```
Then we chage the ``short-lived token`` to a ``long-lived token`` by sending a GET request to ``https://graph.facebook.com/v12.0/oauth/access_token`` endpoint.

```python
# Get long-live access token.
try:
    fb_endpoint = os.getenv("FB_ENDPOINT")
    fb_app_id = os.getenv("FB_APP_ID")
    fb_app_secret = os.getenv("FB_APP_SECRET")

    url = f"{fb_endpoint}oauth/access_token?grant_type=fb_exchange_token&client_id={fb_app_id}&client_secret={fb_app_secret}&fb_exchange_token={temp_access_token}"
    response = requests.get(url)
    response.raise_for_status()
    json_response = response.json()
    long_access_token = json_response["access_token"]
except requests.RequestException:
    raise
```
The long-lived token is needed because it lasts for 60 days, while the short one only lasts for a couple of hours. If the user wants to schedule a post, we ensure that the selected date is no longer than 50 days, thus, when the ``publish post`` function is triggered, the access token is still valid to publish the post.

Finally, we search the user by its ``instagram account id`` in the database. If user exists, we update the ``access token``. If user doesn't exist, we create a new user.
```python
# Search user by Instagram Account Id
user = User.query.filter(User.ig_account_id == ig_account_id).first()
if user != None:
    # Update user access token
    user.access_token = long_access_token
    db.session.commit()
else:
    # Insert new user
    user = User(access_token=long_access_token, ig_account_id=ig_account_id)
    db.session.add(user)
    db.session.commit()

# Set session
session["user_id"] = user.id
session["ig_account_id"] = ig_account_id

# Get back to view with ok
return jsonify({"ok": True})
```
*/logout*

Log out user

*/*

Render home page, swich post date
```python
@app.route("/", methods=["GET", "POST"])
@login_required
def index():
```
To swap post date when the post are moved with sortable plugin in client side:

Sortable js give us the ``index`` and an ``old index`` of the post in the container, we call the old index ``start`` and new index ``end``.
```javascript
const data = {
    "start": {"index": oldIndex},
    "end": {"index": newIndex},
}
```
Then we get those indexes in python to reflect the swap in the database.
```python
start_index = request.json["start"]["index"]
end_index = request.json["end"]["index"]

# Get all post from current user order by date
posts = Post.query.filter(Post.user_id == session.get("user_id")).order_by(Post.date).all()

# When dragging start form top
if start_index < end_index:
    for i in range(start_index, end_index):
        # Update post date
        temp = posts[i].date
        posts[i].date = posts[i + 1].date
        posts[i + 1].date = temp

        temp = posts[i]
        posts[i] = posts[i + 1]
        posts[i + 1] = temp

    # Update changes in database
    db.session.commit()

# When dragging start form bottom
else:
    start_index = start_index + 1
    end_index = end_index + 1
    for i in reversed(range(end_index, start_index)):
        temp = posts[i].date
        posts[i].date = posts[i - 1].date
        posts[i - 1].date = temp

        temp = posts[i]
        posts[i] = posts[i - 1]
        posts[i - 1] = temp

    db.session.commit()
```

Render home page
```python
# GET: Render post page
posts = Post.query.filter(Post.user_id == session.get("user_id")).order_by(Post.date).all()

# Format date for client side (It could be done in js using moment.js for simplicity)
for p in posts:
    p.date = p.date.strftime("%b %d, %I:%M %p")

# Return page
return render_template("home/index.html", posts=posts)
```

*/post/add*

Render add page and save post.

```python
# Render post/add page, add new post
@app.route("/post/add", methods=["GET", "POST"])
@login_required
def add():
    ...
```


Clear any HTML tag in ``caption`` for security reason, then encode it to be placed in the url when the publish api endpoint is call.

Validate ``date`` making sure that it's greater than present date and no longer than 50 days.

Get ``file`` and generate a random filename and save it in a folder named the same as the user ``instagram account id`` inside of ``uploads`` folder

```python
# POST request
# Get date and caption
date = request.form.get("date")
caption = request.form.get("caption")

# Convert iso date to date
date = datetime.fromisoformat(date)

 # Check date range
if date < datetime.now():
    # return message: Date must be in the future
elif date > (datetime.now() + timedelta(days=50)):
    # return message: Date must be less than 50 days

# Clear HTML tags.
caption = re.sub("<[^<]+?>", "", caption)

# Encode characters
caption = urllib.parse.quote(caption, safe="")

# Get file
for file in request.files.values():
    ...

    # Get extension file
    ext = filename[len(filename) - 4:]

    # Generate random filename
    filename = str(uuid.uuid4()) + ext

    # Create folder with ig_account_id if not exist
    resource_path = os.path.join(app.config["UPLOAD_FOLDER_RELATIVE"], session.get("ig_account_id"))
    if not os.path.exists(resource_path):
    try:
        os.makedirs(resource_path)
    except OSError as e:
        if e.errno != errno.EEXIST:
            raise

    # Save file
    file.save(os.path.join(resource_path, filename))

# Save post in database
user_id = session.get("user_id")
post = Post(date=date, caption=caption, filename=filename, user_id=user_id)
db.session.add(post)
db.session.commit()

# Schedule post with apscheduler
scheduler.add_job(publish_post, args=[post.id], trigger="date", run_date=date, id=str(post.id))

# Notify client with ok message
# From client redirect to post page with flash message
flash("New post scheduled", "info")
return jsonify({"ok": True})
```

*/post/edit*

Render edit page. edit post ``caption`` and ``date`` and change apscheduler ``job`` to the new date.

*/post/remove*

Remove a given post from database as well as image from ``uploads`` folder and ``job``.

*/post/publish*

Allow the user to publish a scheduled post using ``Post Now`` button

*/account*

Render account page and let the user modify account details

*/account/delete*

Allow users to delete their account and all data ever saved in the database.

*/privacy*

Render privacy policy page.

*send_file*

A function that serve image to the view from uploads folder
```python
@app.route("/uploads/<path:filename>")
@login_required
def send_file(filename):
    return send_from_directory(os.path.join(app.config["UPLOAD_FOLDER_RELATIVE"], session.get("ig_account_id")), filename, as_attachment=True)
```

*large_file_error*

A function that handle 413 status code returned by flask when file is over the stablished limit.

```python
@app.errorhandler(413)
def large_file_error(error):
    return jsonify({"ok": False, "msg": "File is too large"})
```

#### models.py
This file contains models classes specification for our database to be manage by with SQLAlchemy ORM.
#### helpers.py
This file contains helper functions like ``publish_post``, ``http_request`` and ``login_required`` function from cs50 finance project.

### Database file
#### ospost.db
A sqlite database file generated by SQLAlchemy for saving data in development mode.

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
This file contains a code provide by API to use Javascript SDK for facebook login button. And a http request with fetch API to /login route.
#### homePage.js
Contains the javascript code that set event listener to each code. And use sortablejs library to move the post between then.
#### postAddPage.js
Get and send data to backend when user is creating a new post. And also here is where cropperjs is used to allow the user to crop the image.
#### postEditPage.js
Get and send data to backend when user is editing a post.
### CSS files

#### styles.css
Contains the css styles for the app.
#### cropImage.css
Contains the css style for the javascript class that implements cropperjs.