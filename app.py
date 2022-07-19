import os

from flask import Flask, render_template, request, redirect, flash, jsonify, session
from flask_session import Session
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from pytz import timezone
from apscheduler.schedulers.background import BackgroundScheduler

from helpers import login_required

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
db = SQLAlchemy(app)


@app.route("/", methods=["GET"])
def index():
    return render_template("home/index.html")


@app.route("/post", methods=["GET"])
def post():
    return render_template("post/index.html")


@app.route("/post/add", methods=["GET", "POST"])
def add():
    return render_template("post/add.html")
