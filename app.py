from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app)

# Configuración de la base de datos
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# --------------------- MODELOS ---------------------

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre_usuario = db.Column(db.String(80), unique=True, nullable=False)
    contrasena_hash = db.Column(db.String(128), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    cursos = db.relationship('Course', backref='contributor', lazy=True)

class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=False)
    video_url_lsm = db.Column(db.String(255), nullable=False)
    audio_description_url = db.Column(db.String(255), nullable=True)
    contributor_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)

# --------------------- ENDPOINTS ---------------------

@app.route('/api/register', methods=['POST'])
def register_user():
    """Registrar un nuevo usuario."""
    data = request.get_json()
    if not data or not all(k in data for k in ('nombre_usuario', 'contrasena', 'email')):
        return jsonify({'message': 'Faltan datos obligatorios'}), 400

    if User.query.filter_by(nombre_usuario=data['nombre_usuario']).first():
        return jsonify({'message': 'El nombre de usuario ya existe'}), 409

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'El correo electrónico ya está registrado'}), 409

    hashed_password = generate_password_hash(data['contrasena'])
    user = User(
        nombre_usuario=data['nombre_usuario'],
        contrasena_hash=hashed_password,
        email=data['email']
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'Usuario registrado exitosamente'}), 201

@app.route('/api/login', methods=['POST'])
def login_user():
    """Iniciar sesión de usuario."""
    data = request.get_json()
    if not data or not all(k in data for k in ('nombre_usuario', 'contrasena')):
        return jsonify({'message': 'Faltan datos obligatorios'}), 400

    user = User.query.filter_by(nombre_usuario=data['nombre_usuario']).first()
    if user and check_password_hash(user.contrasena_hash, data['contrasena']):
        return jsonify({'message': 'Inicio de sesión exitoso', 'user_id': user.id}), 200
    return jsonify({'message': 'Credenciales incorrectas'}), 401

@app.route('/api/courses', methods=['GET'])
def get_courses():
    """Obtener todos los cursos."""
    courses = Course.query.all()
    return jsonify([
        {
            'id': course.id,
            'title': course.title,
            'description': course.description,
            'video_url_lsm': course.video_url_lsm,
            'audio_description_url': course.audio_description_url,
            'contributor_id': course.contributor_id
        }
        for course in courses
    ]), 200

@app.route('/api/courses', methods=['POST'])
def add_course():
    """Agregar un nuevo curso."""
    data = request.get_json()
    required_fields = ('title', 'description', 'video_url_lsm')
    if not data or not all(k in data for k in required_fields):
        return jsonify({'message': 'Faltan datos obligatorios'}), 400

    # Opcional: evitar cursos duplicados por título
    if Course.query.filter_by(title=data['title']).first():
        return jsonify({'message': 'Ya existe un curso con ese título'}), 409

    new_course = Course(
        title=data['title'],
        description=data['description'],
        video_url_lsm=data['video_url_lsm'],
        audio_description_url=data.get('audio_description_url'),
        contributor_id=data.get('contributor_id')
    )
    db.session.add(new_course)
    db.session.commit()
    return jsonify({'message': 'Curso añadido exitosamente', 'course_id': new_course.id}), 201

# --------------------- INICIALIZAR BASE DE DATOS ---------------------

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Crea las tablas si no existen
    app.run(debug=True, port=3001)
