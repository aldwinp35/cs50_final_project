import os
import re
import uuid
import errno
import requests
import urllib.parse
from datetime import datetime
from dotenv import load_dotenv
from flask_session import Session
from werkzeug.utils import secure_filename
from models import db, User, Post
from apscheduler.executors.pool import ThreadPoolExecutor
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.schedulers.background import BackgroundScheduler
from helpers import login_required, allowed_file, error_template, publish_post
from flask import Flask, render_template, request, redirect, flash, jsonify, send_from_directory, session
load_dotenv()

# ------------------------
# CONFIGURATIONS
# ------------------------

app = Flask(__name__)

app.config["TEMPLATES_AUTO_RELOAD"] = True
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
app.config["UPLOAD_FOLDER_RELATIVE"] = "uploads"
app.config["UPLOAD_FOLDER_ABSOLUTE"] = os.path.join(app.root_path, "uploads")

Session(app)

if os.environ.get("FLASK_ENV") == "development":
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///tmp/ospost.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    db.init_app(app)

    jobstores = {
        "default": SQLAlchemyJobStore(url="sqlite:///tmp/ospost.db", tablename="apscheduler_jobs"),
    }

else:
    uri = os.getenv("DATABASE_URL")
    if uri.startswith("postgres://"):
        uri = uri.replace("postgres://", "postgresql://")

    app.config["SQLALCHEMY_DATABASE_URI"] = uri
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    db.init_app(app)

    jobstores = {
        "default": SQLAlchemyJobStore(url=uri, tablename="apscheduler_jobs"),
    }

executors = {
    "default": ThreadPoolExecutor(20),
}
job_defaults = {
    "coalesce": False,
    "max_instances": 3
}
scheduler = BackgroundScheduler(jobstores=jobstores, executors=executors, job_defaults=job_defaults)
scheduler.start()


# ------------------------
# ROUTES
# ------------------------

# Render home page
@app.route("/", methods=["GET"])
@login_required
def index():
    return render_template("home/index.html")


# Render login page (Login with facebook)
@app.route("/login", methods=["GET", "POST"])
def login():

    session.clear()

    if request.method == "POST":

        # Get data
        if request.data:
            # fb_page_id = request.json["fb_id"]
            ig_account_id = request.json["ig_id"]
            temp_access_token = request.json["authResponse"]["accessToken"]

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

    # GET: Render login page
    else:
        if os.environ.get("FLASK_ENV") == "development":

            user = User.query.filter(User.id == 1).first()
            if user == None:
                user = User(access_token=os.getenv("TMP_ACCESS_TOKEN"), ig_account_id=os.getenv("TMP_IG_ACCOUNT_ID"))
                db.session.add(user)
                db.session.commit()
                session["user_id"] = user.id
                session["ig_account_id"] = user.ig_account_id
                return redirect("/")

        else:
            fb = {"version": os.getenv("FB_VERSION"), "app_id": os.getenv("FB_APP_ID")}
            return render_template("login/index.html", fb=fb)


# Render post page, update posts by changing its order (drag and drop using sortable.js in client side)
@app.route("/post", methods=["GET", "POST"])
@login_required
def post():

    if request.method == "POST":

        # Update post date by dragging
        if not request.data:
            return jsonify({"ok":  False, "msg": "Missing indexes"})

        else:
            # Get values from fetch request (range of index)
            start_index = request.json["start"]["index"]
            end_index = request.json["end"]["index"]

            # Get all post from current user
            posts = Post.query.filter(Post.user_id == session.get("user_id")).order_by(Post.date).all()

            # Update posts in the range index
            try:
                # When dragging start form top
                if start_index < end_index:
                    for i in range(start_index, end_index):
                        # Update post date
                        temp = posts[i].date
                        posts[i].date = posts[i + 1].date
                        posts[i + 1].date = temp

                        # Update post: Here we could call 'posts = Post.query.filter(Post.user_id == session....' again, and will do the same thing
                        # but that's too much call to the database especially if user have lots of posts scheduled.
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
            except Exception as e:
                return jsonify({"ok": False, "msg": e})

        # Get date of each post
        post_dates = list()
        for p in posts:
            date = p.date.strftime("%b %d, %I:%M %p")
            post_dates.append(date)

        # Return date to update post date in view
        return jsonify({"ok": True, "msg": "Post dates were updated", "dates": post_dates})

    # GET: Render post page
    else:
        posts = Post.query.filter(Post.user_id == session.get("user_id")).order_by(Post.date).all()

        # Format date for client side (It could be done in js using moment.js for simplicity)
        for p in posts:
            p.date = p.date.strftime("%b %d, %I:%M %p")

        # Return page
        return render_template("post/index.html", posts=posts)


# Render post/add page, add new post
@app.route("/post/add", methods=["GET", "POST"])
@login_required
def add():

    if request.method == "POST":

        # Get date, caption
        if not request.form.get("date"):
            return jsonify({"ok": False, "msg": "Input date is required!"})

        date = request.form.get("date")
        caption = request.form.get("caption")

        # Convert iso date to date
        date = datetime.fromisoformat(date)
        if date < datetime.now():
            return jsonify({"ok": False, "msg": "Date must be in the future!"})

        # Clear HTML tags. Check for more options: https://stackoverflow.com/questions/753052/strip-html-from-strings-in-python
        caption = re.sub("<[^<]+?>", "", caption)

        # Encode hashtags, is required by the Facebook API for content publishing
        caption = urllib.parse.quote(caption, safe="")

        # Ensure file/s were send
        if not request.files:
            return jsonify({"ok": False, "msg": "File is required!"})

        # Get files
        for file in request.files.values():

            # Uploading files: https://flask.palletsprojects.com/en/2.1.x/patterns/fileuploads/
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)

                # Get extension file
                ext = filename[len(filename) - 4:]

                # Generate random filename
                filename = str(uuid.uuid4()) + ext

                # Create folder with ig_account_id if not exist
                # https://stackoverflow.com/questions/273192/how-can-i-safely-create-a-nested-directory?answertab=trending#tab-top
                resource_path = os.path.join(app.config["UPLOAD_FOLDER_RELATIVE"], session.get("ig_account_id"))
                if not os.path.exists(resource_path):
                    try:
                        os.makedirs(resource_path)
                    except OSError as e:
                        if e.errno != errno.EEXIST:
                            raise

                # Save file
                file.save(os.path.join(resource_path, filename))

        user_id = session.get("user_id")
        # Save post in database
        post = Post(date=date, caption=caption, filename=filename, user_id=user_id)
        db.session.add(post)
        db.session.commit()

        # Schedule post with apscheduler
        scheduler.add_job(publish_post, args=[user_id], trigger="date", run_date=date, id=str(post.id))

        # Notify client with ok message
        # From client redirect to post page with flash message
        flash("New post scheduled", "info")
        return jsonify({"ok": True})

    # GET: Render post/add page
    else:
        return render_template("post/add.html")


# Render single post details, edit single post
@app.route("/post/edit/", defaults={"post_id": None})
@app.route("/post/edit/<post_id>", methods=["GET", "POST"])
@login_required
def edit(post_id):

    # Check post_id is present
    if not post_id:
        return error_template("Bad request", "Post ID is required", 400)

    if request.method == "POST":

        if not request.form.get("date"):
            return jsonify({"ok": False, "msg": "Missing post date"})

        # Get caption
        caption = request.form.get("caption")
        caption = re.sub("<[^<]+?>", "", caption)
        caption = urllib.parse.quote(caption, safe="")

        # Get date
        date = request.form.get("date")
        date = datetime.fromisoformat(date)
        if date < datetime.now():
            return jsonify({"ok": False, "msg": "Date must be in the future!"})

        # Retrieve post from database
        post = Post.query.filter(Post.id == post_id).first()

        if post == None:
            return error_template("Not found", "Resource not found", 404)

        # Update post
        post.caption = caption
        post.date = date
        db.session.commit()

        # Reschedule job
        job_id = str(post.id)
        job = scheduler.get_job(job_id)
        if job != None:
            scheduler.reschedule_job(id=job_id, trigger="date", run_date=date)
        else:
            scheduler.add_job(publish_post, args=[session.get("user_id")], trigger="date", run_date=date, id=job_id)

        flash("Post updated", "info")
        return redirect("/post")

    else:
        # Get post from database
        post = Post.query.filter(Post.id == post_id).first()

        if post == None:
            return error_template("Not found", "Resource not found", 404)

        # Decode caption
        post.caption = urllib.parse.unquote(post.caption)

        return render_template("post/edit.html", post=post)


# Remove post
@app.route("/post/remove/<post_id>", methods=["POST"])
@login_required
def remove(post_id):

    # Retrieve post form database
    post = Post.query.filter(Post.id == post_id).first()

    if post == None:
        return error_template("Not found", "Resource not found", 404)

    # Delete file
    resource_path = os.path.join(app.config["UPLOAD_FOLDER_RELATIVE"], session.get("ig_account_id"))
    filename = post.filename
    try:
        os.unlink(os.path.join(resource_path, filename))
    except OSError as e:
        raise

    # Remove job_store
    job_id = str(post.id)
    job = scheduler.get_job(job_id)
    if job != None:
        scheduler.remove_job(job_id)

    # Delete post
    db.session.delete(post)
    db.session.commit()

    flash("Post deleted", "info")
    return redirect("/post")


# Publish post
@app.route("/post/publish/<post_id>", methods=["POST"])
@login_required
def publish(post_id):
    # publish post
    return render_template("post/publish")


@app.route("/account", methods=["GET", "POST"])
@login_required
def account():

    if request.method == "POST":

        # Update user email
        if request.form.get("email"):

            # Validate email
            valid_email = re.search("[a-z\d]+\@[a-z\d]+\.com", request.form.get("email"))
            if not valid_email:
                return error_template("Invalid email", "Invalid email", 400)

            # Update user email
            email = valid_email.group()
            user = User.query.filter(User.id == session.get("user_id")).first()
            user.email = email
            db.session.commit()

        # Update user name
        if request.form.get("name"):
            name = request.form.get("name")
            user = User.query.filter(User.id == session.get("user_id")).first()
            user.name = name
            db.session.commit()

        # Redirect to account page
        return redirect("/account")

     # GET: Render account page
    else:
        user = User.query.filter(User.id == session.get("user_id")).first()
        return render_template("account.html", user=user)


# Serve image to view (<img src="...")
@app.route("/uploads/<path:filename>")
@login_required
def send_file(filename):
    return send_from_directory(os.path.join(app.config["UPLOAD_FOLDER_RELATIVE"], session.get("ig_account_id")), filename, as_attachment=True)


@app.route("/privacy", methods=["GET"])
def privacy():
    return render_template("privacy_policy.html")

