from enum import unique
from flask_sqlalchemy import SQLAlchemy
from dataclasses import dataclass

db = SQLAlchemy()

@dataclass
class User(db.Model):
    id: int
    username: str
    access_token: str

    id = db.Column(db.Integer, primary_key=True, nullable=False)
    name = db.Column(db.String(80), nullable=True)
    username = db.Column(db.String(80), unique=True, nullable=True)
    email = db.Column(db.String(200), unique=True, nullable=True)
    ig_account_id = db.Column(db.String(30), unique=True, nullable=False)
    access_token = db.Column(db.Text, unique=True, nullable=False)
    posts = db.relationship('Post', backref='user', lazy=True)

    # def __repr__(self):
    #     return f'<User: {self.username}>'


@dataclass
class Post(db.Model):
    id: int
    date: str
    caption: str
    filename: str
    user_id: int

    id = db.Column(db.Integer, primary_key=True, nullable=False)
    date = db.Column(db.DateTime, nullable=False)
    caption = db.Column(db.Text, nullable=True)
    filename = db.Column(db.Text, unique=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    # def __repr__(self):
    #     return f'<Post: {self.id}>'


class Apscheduler_jobs(db.Model):
    id = db.Column(db.Integer, primary_key=True, nullable=False)
    next_run_time = db.Column(db.Float, nullable=True)
    job_state = db.Column(db.LargeBinary, nullable=False)

    # def __repr__(self):
    #     return f'<Post: {self.id}>'