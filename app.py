import os
import re
import uuid
import urllib.parse

from flask import Flask, render_template, request, redirect, flash, jsonify, send_from_directory, session, url_for
from flask_session import Session
from flask_sqlalchemy import SQLAlchemy

from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

from datetime import datetime
from pytz import timezone
from apscheduler.schedulers.background import BackgroundScheduler

from helpers import login_required, allowed_file
from models import db, User, Post

# Configure application
app = Flask(__name__)

# Ensure templates are auto-reloaded
app.config["TEMPLATES_AUTO_RELOAD"] = True

# Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Configure SQLAlchemy Library to use SQLite database
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///tmp/ospost.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)

# Configure uploads folder path
app.config['UPLOAD_FOLDER_RELATIVE'] = 'uploads'
app.config['UPLOAD_FOLDER_ABSOLUTE'] = os.path.join(app.root_path, 'uploads')


@app.route("/", methods=["GET"])
def index():
    return render_template("home/index.html")


@app.route("/post", methods=["GET"])
def post():
    session["user_id"] = 1
    session["username"] = "jose123"

    posts = Post.query.filter(Post.user_id == session.get('user_id')).all()    
    return render_template("post/index.html", posts=posts)

@app.route("/uploads/<path:filename>")
def send_file(filename):    
    return send_from_directory(os.path.join(app.config['UPLOAD_FOLDER_RELATIVE'], session.get('username')), filename, as_attachment=True)    
    

@app.route("/post/add", methods=["GET", "POST"])
def add():
    if request.method == "POST":

        session["username"] = "jose123"                
       
        if not request.form.get("date"):
            return jsonify({"ok": False, "msg": "Input date is required!"})

        # Get date, caption
        date = request.form.get("date")
        caption = request.form.get("caption")

        # Convert iso date to date
        date = datetime.fromisoformat(date)

        # Clear HTML tags. Check for more options: https://stackoverflow.com/questions/753052/strip-html-from-strings-in-python  
        caption = re.sub('<[^<]+?>', '', caption)

        # Encode hashtags, is required by the Facebook API for content publishing
        caption = urllib.parse.quote(caption, safe='')

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
                resourcePath = os.path.join(app.config['UPLOAD_FOLDER_ABSOLUTE'], session.get("username"))
                if not os.path.exists(resourcePath):
                    os.mkdir(resourcePath)

                # Save file
                file.save(os.path.join(resourcePath, filename))   

        # Save in db
        post = Post(date=date, caption=caption, media_url='https://example.com', filename=filename, user_id=1)
        db.session.add(post)
        db.session.commit()

        # Notify client with ok message
        return jsonify({"ok": True, "msg": "Post saved successfully"})

    else:               
        # print(os.listdir(app.config['UPLOAD_FOLDER_ABSOLUTE']))
        return render_template("post/add.html")