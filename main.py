from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
import os
from werkzeug.security import generate_password_hash, check_password_hash

# Cargar variables de entorno del archivo .env
load_dotenv()

app = Flask(__name__, static_folder='src') # Especifica la carpeta 'src' como carpeta de estáticos

# Configuración de la base de datos
app.config['SQLALCHEMY_DATABASE_URI'] = (
    f"mysql+mysqlconnector://{os.getenv('DATABASE_USER')}:"
    f"{os.getenv('DATABASE_PASSWORD')}@"
    f"{os.getenv('DATABASE_HOST')}/"
    f"{os.getenv('DATABASE_NAME')}"
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Modelo de usuario actualizado
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    address = db.Column(db.String(200), nullable=True)
    phone = db.Column(db.String(20), nullable=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return '<User %r>' % self.username

# Ruta para crear un nuevo usuario (registro)
@app.route('/register', methods=['POST'])
def register_user():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    address = data.get('address')
    phone = data.get('phone')

    if not username or not email or not password:
        return jsonify({'message': 'Missing username, email or password'}), 400

    if User.query.filter_by(username=username).first() or User.query.filter_by(email=email).first():
        return jsonify({'message': 'User with this username or email already exists'}), 409

    new_user = User(username=username, email=email, address=address, phone=phone)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'User registered successfully!', 'id': new_user.id}), 201

# Ruta para iniciar sesión
@app.route('/login', methods=['POST'])
def login_user():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()

    if user and user.check_password(password):
        # En un sistema real, aquí generarías un token JWT o manejarías sesiones
        return jsonify({'message': 'Login successful!', 'user_id': user.id, 'username': user.username}), 200
    else:
        return jsonify({'message': 'Invalid credentials'}), 401

# Ruta para obtener todos los usuarios (para el dashboard, por ejemplo)
@app.route('/users', methods=['GET'])
def get_users():
    users = User.query.all()
    users_data = []
    for user in users:
        users_data.append({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'address': user.address,
            'phone': user.phone
        })
    return jsonify(users_data)

# Ruta principal para servir el frontend (index.html)
@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

# Ruta para servir otros archivos estáticos como dashboard.html o script.js
@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory(app.static_folder, filename)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Crea las tablas si no existen

        # Crear usuario 'admin' por defecto si no existe
        if not User.query.filter_by(username='admin').first():
            admin_user = User(username='admin', email='admin@example.com', address='Admin Address', phone='555-1234')
            admin_user.set_password('admin')
            db.session.add(admin_user)
            db.session.commit()
            print("Default admin user created!")

    app.run(debug=True, host='0.0.0.0', port=5000)
