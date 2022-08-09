import os
import requests
import urllib.parse
from time import sleep
from shutil import copy2
from functools import wraps
from datetime import datetime
from flask import redirect, render_template, session


ALLOWED_EXTENSIONS = {'jpg', 'jpeg'}

def error_template(title, msg, status_code):
    error_detail = {"title": title, "msg": msg, "code": status_code}
    return render_template("error.html", error_detail=error_detail), error_detail["code"]


def login_required(f):
    """
    Decorate routes to require login.

    http://flask.pocoo.org/docs/0.12/patterns/viewdecorators/
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get("user_id") is None:
            return redirect("/login")
        return f(*args, **kwargs)
    return decorated_function


def lookup(symbol):
    """Look up quote for symbol."""

    # Contact API
    try:
        api_key = os.environ.get("API_KEY")
        url = f"https://cloud.iexapis.com/stable/stock/{urllib.parse.quote_plus(symbol)}/quote?token={api_key}"
        response = requests.get(url)
        response.raise_for_status()
    except requests.RequestException:
        return None

    # Parse response
    try:
        quote = response.json()
        return {
            "name": quote["companyName"],
            "price": float(quote["latestPrice"]),
            "symbol": quote["symbol"]
        }
    except (KeyError, TypeError, ValueError):
        return None


def http_request(url, type, data=None):
    try:
        if type.upper() == "POST":
            if data == None:
                response = requests.post(url)
            else:
                response = requests.post(url, data)
        else:
            response = requests.get(url)

        response.raise_for_status()
    except requests.RequestException as e:
        print(e)
        return None

    try:
        return response.json()
    except Exception as e:
        return e


# https://flask.palletsprojects.com/en/2.1.x/patterns/fileuploads/
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def publish_post(user_id):

    from models import db, Post, User
    from app import app
    with app.test_request_context():
        user = User.query.filter(User.id == user_id).first()
        if not user:
            print("No user was found")
            return None

        now = datetime(datetime.now().year, datetime.now().month, datetime.now().day, datetime.now().hour, datetime.now().minute)
        post = Post.query.filter(Post.user_id == user.id, Post.date == now).first()
        if not post:
            print("No post was found")
            return None

        # Move image to static/tmp/ directory
        src = os.path.join("uploads", user.ig_account_id, post.filename)
        dst = "static/tmp/"

        # Create destination directory
        if not os.path.exists(dst):
            os.mkdir(dst)

        # Move img to tmp/
        copy2(src, dst)

        # Image url
        image_url = os.getenv("APP_URL") + os.path.join(dst, post.filename)

        # Get facebook endpoint
        fb_endpoint = os.getenv("FB_ENDPOINT")

        # Create IG Container ID
        url = f"{fb_endpoint}{user.ig_account_id}/media?image_url={image_url}&caption={post.caption}&access_token={user.access_token}"
        response = http_request(url, "POST")
        if response is None:
            return None

        container_id = response["id"]

        # Check container status
        url = f"https://graph.facebook.com/{container_id}?fields=status_code&access_token={user.access_token}"
        status = "IN_PROGRESS"
        while (status != "FINISHED "):
            response = http_request(url, "get")
            if response is None:
                return None
            status = response["status_code"]
            sleep(3)

        # Publish Container
        url = f"{fb_endpoint}{user.ig_account_id}/media_publish?creation_id={container_id}&access_token={user.access_token}"
        response = http_request(url, "POST")
        if response is None:
            return None

        ig_media_id = response["id"]

        if ig_media_id:
            print("media was published")
            # Delete media from static
            os.unlink(os.path.join(dst, post.filename))

            # Delete post form database
            db.session.delete(post)
            db.session.commit()
        else:
            print("Fail to post media")
            # Send an email to user
