import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev_secret_key_coreinventory')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///coreinventory.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
