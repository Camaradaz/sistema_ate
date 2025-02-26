from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from sqlalchemy.orm import relationship
from datetime import datetime
from models import DelegateAssignment, Benefit


app = Flask(__name__)
# Configuración de CORS más permisiva
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:avhk2267@localhost/ate'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Definición del modelo Sector
class Sector(db.Model):
    __tablename__ = 'sectors'

    sector_id = db.Column(db.Integer, primary_key=True)
    sector_name = db.Column(db.String(100), nullable=False)

    def to_dict(self):
        return {
            'sector_id': self.sector_id,
            'sector_name': self.sector_name
        }

# Definición del modelo Afiliado
class Afiliado(db.Model):
    __tablename__ = 'affiliates'

    id_associate = db.Column(db.Integer, primary_key=True)
    affiliate_code = db.Column(db.Integer, unique=True, nullable=False)
    affiliate_name = db.Column(db.String(200), nullable=False)
    dni = db.Column(db.String(20), unique=True, nullable=False)
    gender = db.Column(db.String(1), nullable=False)
    contact = db.Column(db.String(100))
    sector_id = db.Column(db.Integer, db.ForeignKey('sectors.sector_id'))
    has_children = db.Column(db.Boolean, default=False)
    has_disability = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now())

    def __repr__(self):
        return f'<Afiliado {self.affiliate_code}>'

    def to_dict(self):
        return {
            'id_associate': self.id_associate,
            'affiliate_code': self.affiliate_code,
            'affiliate_name': self.affiliate_name,
            'dni': self.dni,
            'gender': self.gender,
            'contact': self.contact,
            'sector_id': self.sector_id,
            'has_children': self.has_children,
            'has_disability': self.has_disability,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# Definición del modelo Child
class Child(db.Model):
    __tablename__ = 'children'

    child_id = db.Column(db.Integer, primary_key=True)
    affiliate_id = db.Column(db.Integer, db.ForeignKey('affiliates.id_associate'), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    birth_date = db.Column(db.Date, nullable=False)
    dni = db.Column(db.String(20))
    gender = db.Column(db.String(1))
    has_disability = db.Column(db.Boolean, default=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    affiliate = relationship("Afiliado", backref="children")

    def to_dict(self):
        return {
            'child_id': self.child_id,
            'affiliate_id': self.affiliate_id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'birth_date': self.birth_date.isoformat() if self.birth_date else None,
            'dni': self.dni,
            'gender': self.gender,
            'has_disability': self.has_disability,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# Definición del modelo Delegate
class Delegate(db.Model):
    __tablename__ = 'delegates'

    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    dni = db.Column(db.String(20), nullable=False, unique=True)
    sector_id = db.Column(db.Integer, db.ForeignKey('sectors.sector_id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    status = db.Column(db.String(50), default='Activo')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now(), onupdate=db.func.now())

    def to_dict(self):
        return {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'dni': self.dni,
            'sector_id': self.sector_id,
            'is_active': self.is_active,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

# Definición del modelo Benefit
class Benefit(db.Model):
    __tablename__ = 'benefits'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    age_range = db.Column(db.String(50))
    stock = db.Column(db.Integer, default=0)
    stock_rest = db.Column(db.Integer, default=0)
    status = db.Column(db.String(50), default='Disponible')
    is_available = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'type': self.type,
            'age_range': self.age_range,
            'stock': self.stock,
            'stock_rest': self.stock_rest,
            'status': self.status,
            'is_available': self.is_available,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

# Rutas para afiliados
@app.route('/afiliados', methods=['GET', 'POST', 'OPTIONS'])
def affiliate_operations():
    if request.method == 'OPTIONS':
        return '', 200
        
    if request.method == 'GET':
        try:
            affiliates = Afiliado.query.all()
            return jsonify([afiliado.to_dict() for afiliado in affiliates])
        except Exception as e:
            return jsonify({'error': str(e)}), 500
            
    if request.method == 'POST':
        try:
            data = request.json
            print("Datos recibidos del afiliado:", data)  # Debug

            # Validar datos requeridos
            required_fields = ['affiliate_code', 'affiliate_name', 'dni', 'gender', 'sector_id']
            for field in required_fields:
                if field not in data:
                    return jsonify({'error': f'El campo {field} es requerido'}), 400

            # Crear nuevo afiliado
            new_affiliate = Afiliado(
                affiliate_code=data['affiliate_code'],
                affiliate_name=data['affiliate_name'],
                dni=data['dni'],
                gender=data['gender'],
                contact=data.get('contact', ''),
                sector_id=data['sector_id'],
                has_children=data.get('has_children', False),
                has_disability=data.get('has_disability', False)
            )

            db.session.add(new_affiliate)
            db.session.commit()
            
            print("Afiliado creado:", new_affiliate.to_dict())  # Debug
            return jsonify(new_affiliate.to_dict()), 201

        except Exception as e:
            db.session.rollback()
            print("Error al crear afiliado:", str(e))  # Debug
            return jsonify({'error': str(e)}), 500

@app.route('/afiliados/<int:id>', methods=['GET', 'PUT', 'DELETE', 'OPTIONS'])
def affiliate_detail(id):
    if request.method == 'OPTIONS':
        return '', 200

    try:
        afiliado = Afiliado.query.get_or_404(id)
        
        if request.method == 'GET':
            return jsonify(afiliado.to_dict())
            
        elif request.method == 'PUT':
            data = request.json
            
            # Actualizar campos
            afiliado.affiliate_code = data.get('affiliate_code', afiliado.affiliate_code)
            afiliado.affiliate_name = data.get('affiliate_name', afiliado.affiliate_name)
            afiliado.dni = data.get('dni', afiliado.dni)
            afiliado.gender = data.get('gender', afiliado.gender)
            afiliado.contact = data.get('contact', afiliado.contact)
            afiliado.sector_id = data.get('sector_id', afiliado.sector_id)
            afiliado.has_children = data.get('has_children', afiliado.has_children)
            afiliado.has_disability = data.get('has_disability', afiliado.has_disability)
            
            db.session.commit()
            return jsonify(afiliado.to_dict())
            
        elif request.method == 'DELETE':
            db.session.delete(afiliado)
            db.session.commit()
            return jsonify({'message': 'Afiliado eliminado correctamente'})
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Rutas de la API para el historial de sectores
@app.route('/sectors', methods=['GET'])
def get_sectors():
    try:
        sectors = Sector.query.all()
        print("Sectores encontrados:", [sector.to_dict() for sector in sectors])  # Debug
        
        if not sectors:
            print("No se encontraron sectores en la base de datos")
            return jsonify([]), 200
            
        sector_list = [sector.to_dict() for sector in sectors]
        print("Enviando sectores:", sector_list)  # Debug
        return jsonify(sector_list)
    except Exception as e:
        print("Error al obtener sectores:", str(e))  # Debug
        return jsonify({'error': str(e)}), 500



@app.route('/children', methods=['GET'])
def get_children():
    try:
        children = Child.query.all()
        if not children:
            return jsonify({'message': 'No children found'}), 404
        return jsonify([child.to_dict() for child in children])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Rutas de la API para obtener el historial de delegados
@app.route('/delegates', methods=['GET'])
def get_delegate():
    try:
        delegates = Delegate.query.all()
        if not delegates:
            return jsonify({'message': 'No delegates found'}), 404
        return jsonify([delegate.to_dict() for delegate in delegates])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Rutas de la API para crear un delegado
@app.route('/delegados', methods=['POST'])
def create_delegate():
    try:
        data = request.json
        print("Datos recibidos:", data)  # Debug

        # Validar datos requeridos
        required_fields = ['first_name', 'last_name', 'dni', 'sector_id']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'El campo {field} es requerido'}), 400

        # Crear nuevo delegado
        new_delegate = Delegate(
            first_name=data['first_name'],
            last_name=data['last_name'],
            dni=data['dni'],
            sector_id=data['sector_id'],
            is_active=data.get('is_active', True)
        )

        db.session.add(new_delegate)
        db.session.commit()
        
        print("Delegado creado:", new_delegate.to_dict())  # Debug
        
        return jsonify(new_delegate.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        print("Error al crear delegado:", str(e))  # Debug
        return jsonify({'error': str(e)}), 500

@app.route('/delegados/<int:id>', methods=['PUT'])
def update_delegate(id):
    try:
        delegate = Delegate.query.get_or_404(id)
        data = request.json

        # Verificar si el DNI ya existe, excluyendo el delegado actual
        existing_delegate = Delegate.query.filter(
            Delegate.dni == data['dni'],
            Delegate.id != id
        ).first()
        
        if existing_delegate:
            return jsonify({'error': 'El DNI ya está registrado para otro delegado'}), 400

        # Actualizar los datos del delegado
        delegate.first_name = data.get('first_name', delegate.first_name)
        delegate.last_name = data.get('last_name', delegate.last_name)
        delegate.dni = data.get('dni', delegate.dni)
        delegate.sector_id = data.get('sector_id', delegate.sector_id)
        delegate.is_active = data.get('is_active', delegate.is_active)

        db.session.commit()
        
        return jsonify(delegate.to_dict()), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    try:
        # Intentar hacer una consulta simple a la base de datos
        Delegate.query.first()
        return jsonify({
            "status": "ok",
            "message": "Server is running and database is connected"
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

# Asegúrate de que CORS esté configurado correctamente
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@app.route('/hijos', methods=['POST'])
def create_child():
    try:
        data = request.json
        print("Datos recibidos:", data)  # Debug

        # Validar datos requeridos
        required_fields = ['affiliate_id', 'first_name', 'last_name', 'birth_date', 'gender']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'El campo {field} es requerido'}), 400

        # Crear nuevo hijo
        new_child = Child(
            affiliate_id=data['affiliate_id'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            birth_date=data['birth_date'],
            dni=data.get('dni', ''),
            gender=data['gender'],
            has_disability=data.get('has_disability', False),
            notes=data.get('notes', '')
        )

        db.session.add(new_child)
        db.session.commit()
        
        print("Hijo creado:", new_child.to_dict())  # Debug
        
        return jsonify(new_child.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        print("Error al crear hijo:", str(e))  # Debug
        return jsonify({'error': str(e)}), 500

@app.route('/hijos/<int:child_id>', methods=['PUT'])
def update_child(child_id):
    try:
        child = Child.query.get_or_404(child_id)
        data = request.json

        # Actualizar campos
        child.affiliate_id = data.get('affiliate_id', child.affiliate_id)
        child.first_name = data.get('first_name', child.first_name)
        child.last_name = data.get('last_name', child.last_name)
        child.birth_date = data.get('birth_date', child.birth_date)
        child.dni = data.get('dni', child.dni)
        child.gender = data.get('gender', child.gender)
        child.has_disability = data.get('has_disability', child.has_disability)
        child.notes = data.get('notes', child.notes)

        db.session.commit()
        return jsonify(child.to_dict()), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/hijos/<int:child_id>', methods=['DELETE', 'OPTIONS'])
def delete_child(child_id):
    if request.method == 'OPTIONS':
        # Manejar la solicitud preflight CORS
        response = app.make_default_options_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Methods', 'DELETE')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        return response

    try:
        print(f"Intentando eliminar hijo con ID: {child_id}")  # Debug
        
        child = Child.query.get_or_404(child_id)
        if not child:
            return jsonify({'error': f'No se encontró el hijo con ID {child_id}'}), 404
            
        print(f"Hijo encontrado: {child.first_name} {child.last_name}")  # Debug
        
        # Guardar información para el mensaje de respuesta
        child_info = f"{child.first_name} {child.last_name}"
        
        # Eliminar el hijo
        db.session.delete(child)
        db.session.commit()
        
        print(f"Hijo eliminado exitosamente: {child_info}")  # Debug
        
        return jsonify({
            'message': f'Hijo {child_info} eliminado correctamente',
            'child_id': child_id
        }), 200
        
    except Exception as e:
        print(f"Error al eliminar hijo: {str(e)}")  # Debug
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/afiliados/<int:id>', methods=['DELETE'])
def delete_affiliate(id):
    try:
        print(f"Intentando eliminar afiliado con ID: {id}")
        
        # Buscar y eliminar el afiliado
        affiliate = Afiliado.query.get(id)
        
        if not affiliate:
            return jsonify({'error': 'Afiliado no encontrado'}), 404
            
        print(f"Afiliado encontrado: {affiliate.affiliate_name}")
        
        # Eliminar directamente
        db.session.delete(affiliate)
        db.session.commit()
        
        print("Afiliado eliminado exitosamente")
        
        return jsonify({
            'success': True,
            'message': 'Afiliado eliminado correctamente',
            'deleted_id': id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error al eliminar afiliado: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/delegados/<int:id>', methods=['DELETE'])
def delete_delegate(id):
    try:
        print(f"Intentando eliminar delegado con ID: {id}")  # Debug
        
        delegate = Delegate.query.get_or_404(id)
        if not delegate:
            return jsonify({'error': 'Delegado no encontrado'}), 404
            
        print(f"Delegado encontrado: {delegate.first_name} {delegate.last_name}")  # Debug
        
        # Eliminar el delegado
        db.session.delete(delegate)
        db.session.commit()
        
        print("Delegado eliminado exitosamente")  # Debug
        
        return jsonify({
            'success': True,
            'message': 'Delegado eliminado correctamente',
            'deleted_id': id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error al eliminar delegado: {str(e)}")  # Debug
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/benefits', methods=['POST'])
def create_benefit():
    try:
        data = request.json
        print("Datos recibidos del beneficio:", data)  # Debug

        # Validar datos requeridos
        required_fields = ['name', 'type']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'El campo {field} es requerido'}), 400

        # Crear nuevo beneficio
        new_benefit = Benefit(
            name=data['name'],
            type=data['type'],
            age_range=data.get('age_range'),
            stock=data.get('stock', 0),
            stock_rest=data.get('stock', 0),  # Inicialmente igual al stock
            status=data.get('status', 'Disponible'),
            is_available=data.get('is_available', True)
        )

        db.session.add(new_benefit)
        db.session.commit()
        
        print("Beneficio creado:", new_benefit.to_dict())  # Debug
        
        return jsonify(new_benefit.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        print("Error al crear beneficio:", str(e))  # Debug
        return jsonify({'error': str(e)}), 500

@app.route('/benefits/<int:id>', methods=['PUT'])
def update_benefit(id):
    try:
        print(f"Intentando actualizar beneficio con ID: {id}")  # Debug
        
        benefit = Benefit.query.get_or_404(id)
        if not benefit:
            return jsonify({'error': 'Beneficio no encontrado'}), 404
            
        data = request.json
        print("Datos recibidos:", data)  # Debug

        # Actualizar campos
        benefit.name = data.get('name', benefit.name)
        benefit.type = data.get('type', benefit.type)
        benefit.age_range = data.get('age_range', benefit.age_range)
        benefit.stock = data.get('stock', benefit.stock)
        benefit.stock_rest = data.get('stock_rest', benefit.stock_rest)
        benefit.status = data.get('status', benefit.status)
        benefit.is_available = data.get('is_available', benefit.is_available)

        db.session.commit()
        
        print("Beneficio actualizado:", benefit.to_dict())  # Debug
        
        return jsonify(benefit.to_dict()), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error al actualizar beneficio: {str(e)}")  # Debug
        return jsonify({'error': str(e)}), 500

@app.route('/benefits/<int:id>', methods=['DELETE', 'OPTIONS'])
def delete_benefit(id):
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        print(f"Intentando eliminar beneficio con ID: {id}")  # Debug
        
        benefit = Benefit.query.get_or_404(id)
        if not benefit:
            return jsonify({'error': 'Beneficio no encontrado'}), 404
            
        db.session.delete(benefit)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Beneficio eliminado correctamente',
            'id': id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error al eliminar beneficio: {str(e)}")  # Debug
        return jsonify({'error': str(e)}), 500

@app.route('/afiliados/<int:affiliate_id>/children', methods=['GET'])
def get_affiliate_children(affiliate_id):
    try:
        children = Child.query.filter_by(affiliate_id=affiliate_id).all()
        return jsonify([{
            'child_id': child.child_id,
            'first_name': child.first_name,
            'last_name': child.last_name,
            'birth_date': child.birth_date.isoformat() if child.birth_date else None,
            'gender': child.gender,
            'has_disability': child.has_disability
        } for child in children]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/benefits', methods=['GET'])
def get_benefits():
    try:
        benefits = Benefit.query.all()
        benefits_list = [benefit.to_dict() for benefit in benefits]
        print("Beneficios enviados:", benefits_list)  # Debug
        return jsonify(benefits_list), 200
    except Exception as e:
        print("Error al obtener beneficios:", str(e))  # Debug
        return jsonify({'error': str(e)}), 500

@app.route('/delegate-assignments', methods=['POST'])
def create_delegate_assignment():
    try:
        data = request.json
        print("Datos recibidos:", data)  # Debug
        
        # Validar datos requeridos
        required_fields = ['delegate_id', 'benefit_id', 'quantity']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'El campo {field} es requerido'}), 400

        # Verificar que hay suficiente stock
        benefit = Benefit.query.get(data['benefit_id'])
        if not benefit:
            return jsonify({'error': 'Beneficio no encontrado'}), 404
            
        if benefit.stock_rest < data['quantity']:
            return jsonify({'error': 'No hay suficiente stock restante disponible'}), 400

        # Crear la asignación sin modificar el beneficio directamente
        new_assignment = DelegateAssignment(
            delegate_id=data['delegate_id'],
            benefit_id=data['benefit_id'],
            quantity=data['quantity']
        )
        
        # Solo agregamos la asignación, dejamos que el trigger maneje el stock_rest
        db.session.add(new_assignment)
        db.session.commit()
        
        # Recargamos el beneficio para obtener los valores actualizados
        db.session.refresh(benefit)
        
        print("Beneficio después de la asignación:", benefit.to_dict())  # Debug
        
        return jsonify({
            'assignment': new_assignment.to_dict(),
            'benefit': benefit.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        print("Error en la asignación:", str(e))  # Debug
        return jsonify({'error': str(e)}), 500

# Iniciar la aplicación
if __name__ == '__main__':
    with app.app_context():
        # Eliminar cualquier referencia al historial en la base de datos
        db.session.execute('DROP TABLE IF EXISTS affiliate_history CASCADE;')
        db.session.commit()
    app.run(debug=True, port=5000)


