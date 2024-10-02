from flask import Flask, render_template, redirect, url_for, request, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_login import LoginManager, login_user, login_required, logout_user, current_user, UserMixin
from dotenv import load_dotenv
import os
import google.generativeai as genai

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# Configuration for Flask app
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your_default_secret_key')  # Use default if not set
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # To suppress SQLAlchemy warning

# Initialize extensions
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'
login_manager.login_message_category = 'info'  # Flash message category for login required

# User model for the database
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Route for the signup page
@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

        # Check if user already exists by email or username
        existing_user = User.query.filter((User.email == email) | (User.username == username)).first()
        if existing_user:
            flash('Email or username already exists. Please log in or use different credentials.', 'danger')
            return redirect(url_for('signup'))

        new_user = User(username=username, email=email, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()
        flash('Account created successfully. Please log in.', 'success')
        return redirect(url_for('login'))
    return render_template('signup.html')

# Route for the login page
@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        user = User.query.filter_by(email=email).first()
        if user and bcrypt.check_password_hash(user.password, password):
            login_user(user)
            flash('Login successful!', 'success')
            return redirect(url_for('home'))
        else:
            flash('Login failed. Check your email and password.', 'danger')
    return render_template('login.html')

# Route for the home page
@app.route('/')
@app.route('/home')
def home():
    return render_template('index.html', is_authenticated=current_user.is_authenticated)

# Route for logout
@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('home'))

# Get the API key from environment variables
api_key = os.getenv('GOOGLE_API_KEY')
if not api_key:
    raise ValueError("No GOOGLE_API_KEY found in environment variables")

# Configure the genai library with the API key
genai.configure(api_key=api_key)
model = genai.GenerativeModel("gemini-1.5-pro")

# Route for the question page
@app.route('/question')
@login_required
def question_page():
    return render_template('ques.html')

@app.route('/about')
def about():
    return render_template('about.html')

# Route to generate a question
@app.route('/generate-question', methods=['POST'])
@login_required
def generate_question():
    content = request.json.get('content')
    if not content:
        return jsonify({"error": "Content is required to generate a question."}), 400

    try:
        response = model.generate_content(
            f"Generate a 1-line question from '{content}' whose answer should not be too long nor too short. "
            f"The question should be generated such that the answer should be available in the provided content."
        )
        if response.parts:
            question_text = response.parts[0].text.strip()
            return jsonify({"question": question_text})
        else:
            return jsonify({"error": "No valid question could be generated."}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Route to generate flashcards
@app.route('/generate-flashcards', methods=['POST'])
@login_required
def generate_flashcards():
    content = request.json.get('content')
    if not content:
        return jsonify({"error": "Content is required to generate flashcards."}), 400

    try:
        response = model.generate_content(
            f"Generate 3 flashcards from this content: '{content}'. "
            "Each flashcard should consist of a term or concept and its brief explanation."
        )
        if response.parts:
            flashcards = [part.text.strip() for part in response.parts if part.text.strip()]
            return jsonify({"flashcards": flashcards})
        else:
            return jsonify({"error": "No valid flashcards could be generated."}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Route to check the user's answer
@app.route('/check-answer', methods=['POST'])
@login_required
def check_answer():
    user_answer = request.json.get('answer')
    content = request.json.get('content')
    question = request.json.get('question')

    if not user_answer or not content or not question:
        return jsonify({"error": "Answer, content, and question are required."}), 400

    try:
        response = model.generate_content(
            f"Given the content: '{content}', and the question: '{question}', check this answer given by the user: '{user_answer}'. "
            "Reply as specified further in points ->\n"
            "Check if the answer is correct or not in the context of only the above-given content and not anything else, "
            "and tell if the given answer is correct or wrong.\n"
            "If it is wrong, then explain the correct answer in detail but not too long.\n"
            "Further list in subpoints:\n"
            "Grammatical errors (mention 'none' if there are no errors)\n"
            "Spelling mistakes (mention 'none' if there are no mistakes)\n"
            "Scope of improvement (mention 'none' if there is nothing to improve)\n"
            "Ensure that there are no asterisks or bold formatting in the response. Each point and subpoint should be on a new line."
        )

        if response.parts:
            result_text = response.parts[0].text.strip()
            return jsonify({"result": result_text})
        else:
            return jsonify({"error": "No valid response could be generated."}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Create the database and tables within the app context
    app.run(debug=True)
