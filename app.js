# app.py (using Flask)
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///puentes_educativos.db' # Or PostgreSQL, etc.
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    lsm_video_url = db.Column(db.String(255))
    ad_audio_url = db.Column(db.String(255))
    # Add more fields like 'university', 'subject', 'original_material_url', 'status', 'contributor_id'

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'lsm_video_url': self.lsm_video_url,
            'ad_audio_url': self.ad_audio_url
        }

@app.route('/api/courses', methods=['GET'])
def get_courses():
    courses = Course.query.all()
    return jsonify([course.to_dict() for course in courses])

@app.route('/api/courses', methods=['POST'])
def add_course():
    data = request.json
    new_course = Course(title=data['title'], description=data.get('description'),
                        lsm_video_url=data.get('lsm_video_url'), ad_audio_url=data.get('ad_audio_url'))
    db.session.add(new_course)
    db.session.commit()
    return jsonify(new_course.to_dict()), 201

if __name__ == '__main__':
    with app.app_context():
        db.create_all() # Create tables if they don't exist
    app.run(debug=True)

import React, { useState, useEffect } from 'react';

// Variables globales para integración externa (Firebase, etc.)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

function App() {
  // Estados para registro
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerMessage, setRegisterMessage] = useState('');

  // Estados para login
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginMessage, setLoginMessage] = useState('');

  // Estado para el usuario actual
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    // Simulación de userId
    const simulateUserId = () => {
      if (initialAuthToken) {
        setCurrentUserId(`user-${Math.random().toString(36).substring(2, 10)}`);
      } else {
        setCurrentUserId(`anon-${Math.random().toString(36).substring(2, 10)}`);
      }
    };
    simulateUserId();
  }, []);

  // Validación básica de email
  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Registro de usuario
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!isValidEmail(registerEmail)) {
      setRegisterMessage('Correo electrónico no válido.');
      return;
    }
    setRegisterMessage('Registrando...');
    try {
      const response = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_usuario: registerUsername,
          contrasena: registerPassword,
          email: registerEmail,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setRegisterMessage(data.message || 'Registro exitoso!');
        setRegisterUsername('');
        setRegisterPassword('');
        setRegisterEmail('');
      } else {
        setRegisterMessage(data.message || 'Error en el registro.');
      }
    } catch (error) {
      setRegisterMessage('Error de conexión con el servidor.');
    }
  };

  // Inicio de sesión
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginMessage('Iniciando sesión...');
    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_usuario: loginUsername,
          contrasena: loginPassword,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setLoginMessage(data.message || 'Inicio de sesión exitoso!');
        setLoginUsername('');
        setLoginPassword('');
        setCurrentUserId(`logged-in-${loginUsername}-${Math.random().toString(36).substring(2, 10)}`);
      } else {
        setLoginMessage(data.message || 'Usuario o contraseña incorrectos.');
      }
    } catch (error) {
      setLoginMessage('Error de conexión con el servidor.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-xl shadow-2xl p-8 md:p-10 w-full max-w-4xl flex flex-col md:flex-row gap-8">

        {/* Registro */}
        <div className="flex-1 bg-blue-50 p-6 rounded-lg shadow-inner">
          <h2 className="text-3xl font-bold text-blue-800 mb-6 text-center">Registrarse</h2>
          <form onSubmit={handleRegister} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-blue-700 text-sm font-semibold mb-2" htmlFor="register-username">
                Nombre de Usuario
              </label>
              <input
                type="text"
                id="register-username"
                className="w-full pl-3 pr-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={registerUsername}
                onChange={(e) => setRegisterUsername(e.target.value)}
                required
                minLength={3}
              />
            </div>
            <div>
              <label className="block text-blue-700 text-sm font-semibold mb-2" htmlFor="register-password">
                Contraseña
              </label>
              <input
                type="password"
                id="register-password"
                className="w-full pl-3 pr-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-blue-700 text-sm font-semibold mb-2" htmlFor="register-email">
                Email
              </label>
              <input
                type="email"
                id="register-email"
                className="w-full pl-3 pr-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
            >
              Registrar
            </button>
            {registerMessage && (
              <p className={`mt-4 text-center text-sm ${registerMessage.includes('exitoso') ? 'text-green-600' : 'text-red-600'}`}>
                {registerMessage}
              </p>
            )}
          </form>
        </div>

        {/* Separador */}
        <div className="hidden md:flex items-center justify-center">
          <div className="h-full w-px bg-gray-300"></div>
        </div>

        {/* Login */}
        <div className="flex-1 bg-purple-50 p-6 rounded-lg shadow-inner">
          <h2 className="text-3xl font-bold text-purple-800 mb-6 text-center">Iniciar Sesión</h2>
          <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-purple-700 text-sm font-semibold mb-2" htmlFor="login-username">
                Nombre de Usuario
              </label>
              <input
                type="text"
                id="login-username"
                className="w-full pl-3 pr-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-purple-700 text-sm font-semibold mb-2" htmlFor="login-password">
                Contraseña
              </label>
              <input
                type="password"
                id="login-password"
                className="w-full pl-3 pr-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 transition duration-300 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75"
            >
              Iniciar Sesión
            </button>
            {loginMessage && (
              <p className={`mt-4 text-center text-sm ${loginMessage.includes('exitoso') ? 'text-green-600' : 'text-red-600'}`}>
                {loginMessage}
              </p>
            )}
          </form>
        </div>
      </div>

      {/* Mostrar el ID de usuario */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded-full shadow-lg">
        ID de Usuario Actual: <span className="font-mono">{currentUserId}</span>
      </div>
    </div>
  );
}

export default App;
