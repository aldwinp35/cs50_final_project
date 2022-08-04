import os, errno
import re
import uuid
import urllib.parse

from flask import Flask, render_template, request, redirect, flash, jsonify, send_from_directory, session, url_for
from flask_session import Session
from flask_sqlalchemy import SQLAlchemy

from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

from datetime import datetime
# from pytz import timezone
from apscheduler.schedulers.background import BackgroundScheduler

from helpers import login_required, allowed_file, error_template
from models import db, User, Post

from dotenv import load_dotenv
load_dotenv()

# Configure application
app = Flask(__name__)

# Ensure templates are auto-reloaded
app.config["TEMPLATES_AUTO_RELOAD"] = True

# Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Configure SQLAlchemy Library to use heroku PostgreeSQL database
# uri = os.getenv("DATABASE_URL")
# if uri.startswith("postgres://"):
#     uri = uri.replace("postgres://", "postgresql://")

# app.config["SQLALCHEMY_DATABASE_URI"] = uri
# app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
# db.init_app(app)

# with app.app_context():
#     db.create_all()

# Configure SQLAlchemy Library to use SQLite database
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///tmp/ospost.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)

# Configure uploads folder path
app.config["UPLOAD_FOLDER_RELATIVE"] = "uploads"
app.config["UPLOAD_FOLDER_ABSOLUTE"] = os.path.join(app.root_path, "uploads")


# Render home page
@app.route("/", methods=["GET"])
def index():
    return render_template("home/index.html")


# Render login page (Login with facebook)
@app.route("/login", methods=["GET"])
def login():
    return render_template("login/index.html")


# Render post page, update posts by changing its order (drag and drop using sortable.js in client side)
@app.route("/post", methods=["GET", "POST"])
def post():

    # Test user data
    session["user_id"] = 1
    session["username"] = "jose123"

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
def add():

    if request.method == "POST":
        # Test user data
        session["username"] = "jose123"

        # Get date, caption
        if not request.form.get("date"):
            return jsonify({"ok": False, "msg": "Input date is required!"})

        date = request.form.get("date")
        caption = request.form.get("caption")

        # Convert iso date to date
        date = datetime.fromisoformat(date)

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

                # Create folder with username if not exist
                # https://stackoverflow.com/questions/273192/how-can-i-safely-create-a-nested-directory?answertab=trending#tab-top
                resourcePath = os.path.join(app.config["UPLOAD_FOLDER_RELATIVE"], session.get("username"))
                if not os.path.exists(resourcePath):
                    try:
                        os.makedirs(resourcePath)
                    except OSError as e:
                        if e.errno != errno.EEXIST:
                            raise

                # Save file
                file.save(os.path.join(resourcePath, filename))

        # Save post in database
        post = Post(date=date, caption=caption, filename=filename, user_id=1)
        db.session.add(post)
        db.session.commit()

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

        # Retrieve post from database
        post = Post.query.filter(Post.id == post_id).first()

        if post == None:
            return error_template("Not found", "Resource not found", 404)

        # Update post
        post.caption = caption
        post.date = date
        db.session.commit()

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
def remove(post_id):
    # Remove post

    # Retrieve post form database
    post = Post.query.filter(Post.id == post_id).first()

    if post == None:
        return error_template("Not found", "Resource not found", 404)

    # Delete file
    resourcePath = os.path.join(app.config["UPLOAD_FOLDER_RELATIVE"], session.get("username"))
    filename = post.filename
    try:
        os.unlink(os.path.join(resourcePath, filename))
    except OSError as e:
        raise

    # Delete post
    db.session.delete(post)
    db.session.commit()

    flash("Post deleted", "info")
    return redirect('/post')


# Publish post
@app.route("/post/publish/<post_id>", methods=["POST"])
def publish(post_id):
    # publish post
    return render_template("post/publish")


# Serve image to view (<img src="...")
@app.route("/uploads/<path:filename>")
def send_file(filename):
    return send_from_directory(os.path.join(app.config["UPLOAD_FOLDER_RELATIVE"], session.get("username")), filename, as_attachment=True)


@app.route("/privacy", methods=["GET"])
def privacy():
    return render_template("privacy_policy.html")